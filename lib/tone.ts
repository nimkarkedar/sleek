/** Shared semantic color system for dashboard badges — reused anywhere an icon needs to signal
 * "neutral/informational", "positive/incoming", or "needs attention/outgoing". */
export type Tone = 'neutral' | 'success' | 'destructive';

export const TONE_BADGE_CLASS: Record<Tone, string> = {
  neutral: 'bg-[#18181B]',
  success: 'bg-success',
  destructive: 'bg-destructive',
};
