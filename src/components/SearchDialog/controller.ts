/** Own modal lifecycle only; EasyOps continues to own index/results and selection. */
export function bindSearchDialog(dialog: HTMLDialogElement, trigger: HTMLButtonElement) {
 const document = dialog.ownerDocument;
 let openedWithPointer = false;
 let previousOverflow: string | null = null;
 const focusSearch = () => {
  const input = dialog.querySelector<HTMLInputElement>('input[aria-label="Search"]');
  input?.focus(); input?.select();
 };
 const open = (fromPointer = false) => {
  if (!dialog.open) {
   openedWithPointer = fromPointer;
   previousOverflow = document.body.style.overflow;
   dialog.showModal();
   document.body.style.overflow = 'hidden';
  }
  focusSearch();
 };
 const close = () => {
  if (dialog.open) dialog.close();
  // Native close events are queued; cleanup must complete before unmount removes listeners.
  restore();
 };
 const restore = () => {
  // Ignore a queued old close after reopening, and make synchronous/queued cleanup idempotent.
  if (dialog.open || previousOverflow === null) return;
  document.body.style.overflow = previousOverflow; previousOverflow = null;
  if (openedWithPointer) trigger.dataset.pointerFocus = 'true';
  else delete trigger.dataset.pointerFocus;
  trigger.focus({preventScroll: true});
 };
 const clickTrigger = (event: MouseEvent) => {open(event.detail > 0);};
 const keyDown = (event: KeyboardEvent) => {
  // Preserve the opening modality through in-modal Escape/typing.
  if (!dialog.open) delete trigger.dataset.pointerFocus;
  if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k') {
   // Capture before EasyOps' document listener can focus its hidden dialog input.
   event.preventDefault(); event.stopImmediatePropagation(); open();
  } else if (event.key === 'Escape' && dialog.open) {
   // EasyOps closes and blurs its list on Escape; dismiss the encompassing modal too.
   event.preventDefault(); event.stopImmediatePropagation(); close();
  }
 };
 const backdrop = (event: MouseEvent) => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
 };
 const cancel = (event: Event) => {event.preventDefault(); close();};
 trigger.addEventListener('click', clickTrigger);
 dialog.addEventListener('click', backdrop);
 dialog.addEventListener('cancel', cancel);
 dialog.addEventListener('close', restore);
 document.addEventListener('keydown', keyDown, true);
 return {open, close, dispose() {
  close();
  trigger.removeEventListener('click', clickTrigger);
  dialog.removeEventListener('click', backdrop);
  dialog.removeEventListener('cancel', cancel);
  dialog.removeEventListener('close', restore);
  document.removeEventListener('keydown', keyDown, true);
 }};
}
