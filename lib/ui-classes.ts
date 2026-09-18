import type { ViewStyle } from 'react-native';

/** Shared header "chip" style — pill trigger button used by both the user menu and the company switcher. */
export const CHIP_CLASS =
  'flex-row items-center gap-2.5 border border-[#E4E4E7] bg-[#FAFAFA] px-3 py-2 web:cursor-pointer web:hover:bg-[#F0F0F1] web:hover:border-[#D4D4D8]';

/**
 * Corner radius as a direct style (not a Tailwind class) — arbitrary-value `rounded-[Npx]`
 * classes were not taking effect reliably through NativeWind's web class pipeline, so this
 * sets `borderRadius` straight via RN's own style system, which always works.
 */
export const CHIP_STYLE: ViewStyle = { borderRadius: 14 };
