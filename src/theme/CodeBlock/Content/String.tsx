import React, {useEffect, useRef, useState, useSyncExternalStore, type ReactNode} from 'react';
import {useLocation} from '@docusaurus/router';
import {useThemeConfig} from '@docusaurus/theme-common';
import {CodeBlockContextProvider, createCodeBlockMetadata} from '@docusaurus/theme-common/internal';
import Container from '@theme/CodeBlock/Container';
import Content from '@theme/CodeBlock/Content';
import IconWordWrap from '@theme/Icon/WordWrap';
import type {Props} from '@theme/CodeBlock/Content/String';
import {pageWrap} from '../pageWrap';

const serverWrap = () => false;
const terminalLanguages = new Set(['bash', 'sh', 'shell', 'shell-session', 'console', 'powershell', 'ps1', 'zsh']);

export default function CodeBlockString(props: Props): ReactNode {
  const {prism} = useThemeConfig();
  const {pathname} = useLocation();
  const isWrapped = useSyncExternalStore(pageWrap.subscribe, () => pageWrap.get(pathname), serverWrap);
  const codeBlockRef = useRef<HTMLPreElement>(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; clearTimeout(copyTimer.current); };
  }, []);

  const metadata = createCodeBlockMetadata({
    code: props.children, className: props.className, metastring: props.metastring,
    magicComments: prism.magicComments, defaultLanguage: prism.defaultLanguage,
    language: props.language, title: props.title, showLineNumbers: props.showLineNumbers,
  });
  if (metadata.lineNumbersStart === undefined && metadata.code.split('\n').length > 8) {
    metadata.lineNumbersStart = 1;
  }
  const title = metadata.title || (terminalLanguages.has(metadata.language) ? 'Terminal' : 'Code');
  const copyLabel = copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy';
  async function copyCode() {
    let next: typeof copyState;
    try { await navigator.clipboard.writeText(metadata.code); next = 'copied'; }
    catch { next = 'failed'; }
    if (!mounted.current) return;
    clearTimeout(copyTimer.current);
    setCopyState(next);
    copyTimer.current = setTimeout(() => setCopyState('idle'), 1800);
  }

  return (
    <CodeBlockContextProvider metadata={metadata} wordWrap={{
      codeBlockRef, isEnabled: isWrapped, isCodeScrollable: true,
      toggle: () => pageWrap.toggle(pathname),
    }}>
      <Container as="div" className={`${metadata.className} fs-code-block`} data-code-wrap={isWrapped}>
        <div className="fs-code-header">
          <div className="fs-code-heading">
            <span className="fs-code-title" title={typeof title === 'string' ? title : undefined}>{title}</span>
            <span className="fs-code-language">{metadata.language || 'text'}</span>
          </div>
          <div className="fs-code-actions">
            <button type="button" className="fs-code-wrap" aria-label="Wrap long lines"
              title="Wrap long lines" aria-pressed={isWrapped} onClick={() => pageWrap.toggle(pathname)}>
              <IconWordWrap aria-hidden="true" />
            </button>
            <button type="button" className="fs-code-copy" aria-label={copyState === 'copied' ? 'Copied' : 'Copy code to clipboard'}
              onClick={copyCode}>{copyLabel}</button>
            <span className="fs-code-copy-status" role="status">{copyState === 'copied' ? 'Code copied to clipboard' : copyState === 'failed' ? 'Could not copy code. Please try again.' : ''}</span>
          </div>
        </div>
        <Content />
      </Container>
    </CodeBlockContextProvider>
  );
}
