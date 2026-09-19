import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

type NavIconProps = {
  d: string;
  size?: number;
  color?: string;
  /** Solid version for the active nav item — these are hand-drawn outline paths (not a
   * separate outline/filled glyph pair), so "filled" is approximated by filling the same
   * path rather than swapping in different artwork. */
  filled?: boolean;
};

function NavIcon({ d, size = 18, color = 'currentColor', filled = false }: NavIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
      <Path
        d={d}
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const NAV_ICON_PATHS = {
  home: 'M3 10.5L12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1V9.5',
  getpaid:
    'M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  spend: 'M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM2 10h20',
  banking:
    'M2 9l10-6 10 6M4 9h16v2H4zM6 21v-10M10 21v-10M14 21v-10M18 21v-10M4 21h16',
  books:
    'M4 4a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v17a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V4zM4 19a2 2 0 0 1 2-2h11',
  reports: 'M4 20V10M10 20V4M16 20v-7M3 20h18',
  workqueue:
    'M8 2v3M16 2v3M3.5 9h17M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8 13h5M8 17h8',
  clients:
    'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16.5 11a2.5 2.5 0 1 0 0-5M18.5 14.2c1.7.6 3 2 3.4 3.8',
  chevronDown: 'M6 9l6 6 6-6',
} as const;

export type NavIconName = keyof typeof NAV_ICON_PATHS;

export function Chevron({ size = 16, color = '#656565' }: { size?: number; color?: string }) {
  return <NavIcon d={NAV_ICON_PATHS.chevronDown} size={size} color={color} />;
}

export function NavigationIcon({
  name,
  size,
  color,
  filled,
}: {
  name: NavIconName;
  size?: number;
  color?: string;
  filled?: boolean;
}) {
  return <NavIcon d={NAV_ICON_PATHS[name]} size={size} color={color} filled={filled} />;
}
