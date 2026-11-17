// One shared choice for every code block on the current documentation page.
export function createPageWrapStore() {
  const choices = new Map<string, boolean>();
  const listeners = new Set<() => void>();
  return {
    get: (page: string) => choices.get(page) ?? false,
    toggle(page: string) {
      choices.set(page, !(choices.get(page) ?? false));
      listeners.forEach(listener => listener());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}
export const pageWrap = createPageWrapStore();
