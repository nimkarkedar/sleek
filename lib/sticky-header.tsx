import * as React from 'react';
import type { ViewStyle } from 'react-native';

/**
 * The page's sticky header (the shell's title row, plus a page's tabs when it has them) casts a
 * faint shadow once content has scrolled underneath it. The shadow goes on whichever of the two
 * is lowest, so it always sits along the header's bottom edge.
 */
export const StickyHeaderContext = React.createContext<{
  scrolled: boolean;
  setHasTabs: (hasTabs: boolean) => void;
}>({ scrolled: false, setHasTabs: () => {} });

/** A soft shadow under the bottom edge only — the negative spread keeps it off the sides. */
export const HEADER_SHADOW: ViewStyle = {
  boxShadow: '0 12px 12px -12px rgba(0, 0, 0, 0.12)',
} as ViewStyle;

/** For a page's tabs row: claims the header's bottom edge while mounted, and returns whether
 * to show the shadow. */
export function useStickyTabsShadow(): boolean {
  const { scrolled, setHasTabs } = React.useContext(StickyHeaderContext);
  React.useEffect(() => {
    setHasTabs(true);
    return () => setHasTabs(false);
  }, [setHasTabs]);
  return scrolled;
}
