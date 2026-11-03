import {publicationPlan, SOURCE} from './proposal.mjs';

export const DOCS_REPO = 'Flow-Steward/documentation-site';
export const BRANCH = 'codex/documentation-sync';
const BOT_EMAIL = '41898282+github-actions[bot]@users.noreply.github.com';

export async function publishProposal({api, metadata, changes, summary, evidence, reviews = []}) {
  const tree = publicationPlan(changes, metadata);
  const base = `/repos/${DOCS_REPO}`;
  const main = await api('GET', `${base}/git/ref/heads/main`);
  if (main.object.sha !== metadata.docsSha) throw new Error('documentation main changed; rerun generation');
  const branch = await api('GET', `${base}/git/ref/heads/${BRANCH}`, undefined, true);
  if ((branch?.object.sha ?? null) !== metadata.branchSha) throw new Error('automation branch changed; rerun generation');
  if (branch) {
    const commit = await api('GET', `${base}/git/commits/${branch.object.sha}`);
    if (commit.author.email !== BOT_EMAIL || !/^docs: synchronize public source [a-f0-9]{40}(?: \[skip ci\])?$/.test(commit.message)) throw new Error('human edits on automation branch require manual review');
  }
  const prs = await api('GET', `${base}/pulls?state=all&head=Flow-Steward%3Acodex%2Fdocumentation-sync&base=main&per_page=100`);
  const existing = prs.find(pr => pr.state === 'open');
  if (!tree.length && !existing) return {noop: true};
  if (prs.some(pr => pr.state === 'closed' && !pr.merged_at)) throw new Error('automation PR was manually closed; reopen it for review before retrying');
  const baseCommit = await api('GET', `${base}/git/commits/${metadata.docsSha}`);
  // A reverted product change must also remove obsolete changes from the pending
  // bot PR. Reuse main's tree, including its unchanged accepted checkpoint.
  const newTree = tree.length ? await api('POST', `${base}/git/trees`, {base_tree: baseCommit.tree.sha, tree}) : baseCommit.tree;
  const parents = [...new Set([metadata.docsSha, ...(branch ? [branch.object.sha] : [])])];
  const commit = await api('POST', `${base}/git/commits`, {message: `docs: synchronize public source ${metadata.sourceSha}${metadata.skipTests ? ' [skip ci]' : ''}`, tree: newTree.sha, parents, author: {name: 'github-actions[bot]', email: BOT_EMAIL}});
  if (branch) await api('PATCH', `${base}/git/refs/heads/${BRANCH}`, {sha: commit.sha, force: false});
  else await api('POST', `${base}/git/refs`, {ref: `refs/heads/${BRANCH}`, sha: commit.sha});
  const outcome = tree.length ? 'Accepting this PR advances the source checkpoint and publishes the site. No automatic merge.' : 'No outstanding documentation changes. Obsolete proposed changes were withdrawn; the accepted checkpoint is unchanged.';
  const run = process.env.GITHUB_RUN_ID;
  const report = run && /^\d+$/.test(run) ? `\nFull per-page summaries, limitations and source evidence: https://github.com/${DOCS_REPO}/actions/runs/${run} (docs-proposal-combined artifact).\n` : '';
  const changedPages = new Set(changes.map(change => change.path));
  const pageSummaries = reviews.filter(review => changedPages.has(review.path)).map(review => `- ${review.path}: ${review.summary.slice(0, 500)}`).join('\n').slice(0, 20000);
  const sourceEvidence = evidence.map(path => `- ${path}`).join('\n').slice(0, 12000);
  const body = `AI-proposed documentation update; human review is required.\n\nPublic source: https://github.com/${SOURCE}/commit/${metadata.sourceSha}\nDocumentation base: ${metadata.docsSha}\n${metadata.skipTests ? '\nTest suites were explicitly skipped for this operational run at the user’s request.\n' : ''}\n${summary}\n${report}\nChanged-page summaries (bounded; complete receipts are in the artifact):\n${pageSummaries}\n\nSource evidence (bounded; full list is in the artifact):\n${sourceEvidence}\n\n${outcome}`;
  if (existing) return {...await api('PATCH', `${base}/pulls/${existing.number}`, {body}), noop: !tree.length};
  return api('POST', `${base}/pulls`, {title: 'docs: synchronize public product documentation', body, head: BRANCH, base: 'main'});
}

export function githubApi(token) {
  if (!token) throw new Error('GitHub token is required');
  return async (method, path, body, optional = false) => {
    if (!path.startsWith(`/repos/${DOCS_REPO}/`)) throw new Error('repository outside documentation scope');
    const response = await fetch(`https://api.github.com${path}`, {method, headers: {Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json'}, body: body === undefined ? undefined : JSON.stringify(body)});
    if (optional && response.status === 404) return null;
    if (!response.ok) throw new Error(`GitHub ${method} ${path.split('?')[0]} returned ${response.status}`);
    return response.status === 204 ? null : response.json();
  };
}
