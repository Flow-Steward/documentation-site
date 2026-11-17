// Conservative reuse of paid, unscoped historical receipts. Original bytes and
// SHAs remain provenance; never forge a scoped cache entry from legacy output.
import {existsSync, readFileSync, readdirSync, lstatSync} from 'node:fs';
import {join} from 'node:path';
import {digest, gitRead, sourceSnapshot, textHash} from './input-identity.mjs';
import {checkReceipt, evidencePath} from './batches.mjs';

export function legacyReceipts({docsRoot, productRoot, sourceSha, docsSha}) {
  const root = join(docsRoot, '.automation/recovery');
  const sourceTree = digest(sourceSnapshot(productRoot, sourceSha));
  const currentDocs = sourceSnapshot(docsRoot, docsSha);
  const runs = [], diagnostics = [];
  if (existsSync(root)) for (const entry of readdirSync(root, {withFileTypes: true})) {
    if (!entry.isDirectory() || !/^\d+$/.test(entry.name)) continue;
    const directory = join(root, entry.name);
    const context = join(directory, 'context/metadata.json');
    const receipts = join(directory, 'receipts');
    if (!existsSync(context) || !existsSync(receipts)) continue;
    try {
      const metadata = JSON.parse(readFileSync(context, 'utf8'));
      const plan = JSON.parse(readFileSync(join(directory, 'context/plan.json'), 'utf8'));
      const workflow = gitRead(docsRoot, ['show', `${metadata.docsSha}:.github/workflows/update-docs.yml`]);
      if (!/^\s+model: gpt-6-luna\s*$/m.test(workflow) || !workflow.includes('DOCS_AI_MODEL must be exactly gpt-6-luna')) throw new Error('historical Luna configuration is not attested');
      // Full source equality is intentional: old jobs did not have a proved
      // scoped read boundary. Evidence paths alone cannot justify narrower reuse.
      if (digest(sourceSnapshot(productRoot, metadata.sourceSha)) !== sourceTree) continue;
      const originalDocs = sourceSnapshot(docsRoot, metadata.docsSha);
      const promptPaths = ['.github/codex/documentation.md', '.github/codex/proposal.schema.json'];
      if (promptPaths.some(path => originalDocs.find(file => file.path === path)?.oid !== currentDocs.find(file => file.path === path)?.oid)) continue;
      runs.push({run: entry.name, directory, metadata, plan, originalDocs});
    } catch (error) { diagnostics.push({run: entry.name, reason: error.message}); }
  }
  return {
    diagnostics,
    lookup(task) {
      const pageHash = task.inputs.pageHash;
      for (const run of runs) {
        const originalTask = run.plan.tasks.find(item => item.path === task.path && item.id === task.id);
        const file = join(run.directory, 'receipts', `proposal-${task.id}.json`);
        if (!originalTask || !existsSync(file) || lstatSync(file).isSymbolicLink()) continue;
        try {
          const rawBytes = readFileSync(file, 'utf8'), receipt = JSON.parse(rawBytes);
          checkReceipt(receipt, originalTask, run.metadata, docsRoot, productRoot);
          const oldPage = gitRead(docsRoot, ['show', `${run.metadata.docsSha}:${task.path}`]);
          const output = receipt.updates[0]?.content ?? oldPage;
          if (![textHash(oldPage), textHash(output)].includes(pageHash)) continue;
          // Include every other documentation page plus declared site/external
          // dependencies; old reviewers could read beyond their assigned page.
          const relevant = path => path !== task.path && (path.startsWith('docs/') || task.inputs.context.documentationInputs.some(item => item.path === path));
          if (digest(run.originalDocs.filter(file => relevant(file.path))) !== digest(currentDocs.filter(file => relevant(file.path)))) continue;
          return {hit: true, receipt, alreadyApplied: pageHash === textHash(output),
            proof: {kind: 'legacy-full-source-and-document-inputs', runId: run.run, rawHash: textHash(rawBytes), configuredModel: 'gpt-6-luna', originalSourceSha: run.metadata.sourceSha, originalDocsSha: run.metadata.docsSha, currentSourceSha: sourceSha, currentDocsSha: docsSha, sourceTreeHash: sourceTree, evidence: receipt.evidence.map(evidencePath)}};
        } catch (error) { diagnostics.push({run: run.run, page: task.path, reason: error.message}); }
      }
      return {hit: false, reason: 'No unchanged, valid legacy inputs; paid output stays preserved and must not be silently regenerated'};
    },
  };
}
