import type { ViewStyle } from 'react-native';

/** Shared header "chip" layout — trigger used by both the user menu and the workspace switcher.
 * Ghost by default (blends into the page background); the white hover surface is applied via
 * `CHIP_HOVER_STYLE` + JS-tracked hover state, not `web:hover:` classes — this project's
 * NativeWind setup doesn't reliably compile opacity-modifier classes like `shadow-black/5`. */
export const CHIP_CLASS = 'flex-row items-center gap-3 px-3 py-2 web:cursor-pointer';

/**
 * Corner radius + a very subtle always-on border, as a direct style (not Tailwind classes) —
 * arbitrary-value `rounded-[Npx]`/`border-[#hex]` classes were not taking effect reliably
 * through NativeWind's web class pipeline, so both are set straight via RN's own style system,
 * which always works. Radius 8 matches the nav rows' `rounded-lg` — 14 (this chip's old radius
 * from before it was scaled down to a ghost/hover-only style) reads as a bulging stadium pill on
 * a box this short. The border gives the chip a little definition at rest (not just on hover) so
 * it reads as clickable instead of blending completely into the page.
 */
export const CHIP_STYLE: ViewStyle = { borderRadius: 8, borderWidth: 1, borderColor: '#E4E4E7' };

/** Applied (merged with `{ backgroundColor: '#fff' }`) only while `onHoverIn`/`onHoverOut` state
 * says the chip is hovered — see `CHIP_CLASS` for why this isn't a `web:hover:` class. */
export const CHIP_HOVER_STYLE: ViewStyle = {
  backgroundColor: '#FFFFFF',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
};
