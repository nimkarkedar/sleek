/** Shared semantic color system for dashboard badges — reused anywhere an icon needs to signal
 * "neutral/informational", "positive/incoming", or "needs attention/outgoing". */
export type Tone = 'neutral' | 'success' | 'destructive';

export const TONE_BADGE_CLASS: Record<Tone, string> = {
  neutral: 'bg-[#18181B]',
  success: 'bg-success',
  destructive: 'bg-destructive',
};

/** Raw hex per tone — for cases (e.g. Reanimated's animated styles) that need an actual color
 * value rather than a Tailwind class. Keep in sync with the --success/--destructive CSS vars. */
export const TONE_HEX: Record<Tone, string> = {
  neutral: '#18181B',
  success: '#1FA136',
  destructive: '#FB5E37',
};
