import * as React from 'react';

/**
 * The shell renders one page-level `ScrollView` that every page's content sits inside — there's
 * no per-page scroll container to attach `onEndReached` to. This is a small pub/sub bus so the
 * shell's own `onScroll` can announce "near the bottom" once, and any page deep in the tree
 * (e.g. a paginated table) can subscribe to "load the next page" without the shell needing to
 * know which page is currently mounted or what "more" means for it.
 */
type Listener = () => void;

export function useScrollEndBus() {
  const listenersRef = React.useRef<Set<Listener>>(new Set());

  const subscribe = React.useCallback((fn: Listener) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

  const notify = React.useCallback(() => {
    listenersRef.current.forEach((fn) => fn());
  }, []);

  return { subscribe, notify };
}

const ScrollEndContext = React.createContext<{ subscribe: (fn: Listener) => () => void } | null>(
  null
);

export function ScrollEndProvider({
  subscribe,
  children,
}: {
  subscribe: (fn: Listener) => () => void;
  children: React.ReactNode;
}) {
  const value = React.useMemo(() => ({ subscribe }), [subscribe]);
  return <ScrollEndContext.Provider value={value}>{children}</ScrollEndContext.Provider>;
}

/** Call `onEnd` whenever the page scroll nears the bottom, for as long as this component stays
 * mounted — e.g. reveal the next page of an already-computed list. */
export function useOnScrollEnd(onEnd: Listener) {
  const ctx = React.useContext(ScrollEndContext);
  React.useEffect(() => {
    if (!ctx) return;
    return ctx.subscribe(onEnd);
  }, [ctx, onEnd]);
}
