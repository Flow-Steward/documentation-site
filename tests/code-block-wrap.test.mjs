import test from 'node:test';
import assert from 'node:assert/strict';
import {createPageWrapStore} from '../src/theme/CodeBlock/pageWrap.ts';

test('all blocks on one page share wrap while another page starts unwrapped', () => {
  const store = createPageWrapStore();
  const observed = [];
  const unsubscribe = store.subscribe(() => observed.push(store.get('/docs/intro')));
  assert.equal(store.get('/docs/intro'), false);
  store.toggle('/docs/intro');
  assert.deepEqual(observed, [true]);
  assert.equal(store.get('/docs/intro'), true);
  assert.equal(store.get('/docs/reference/cli'), false);
  store.toggle('/docs/intro');
  assert.deepEqual(observed, [true, false]);
  unsubscribe();
  store.toggle('/docs/intro');
  assert.deepEqual(observed, [true, false]);
});
