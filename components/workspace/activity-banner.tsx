import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { type Company } from '@/lib/companies';
import { ArrowRight, Sparkles, X } from 'lucide-react-native';
import * as React from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * "While you were away" summary — replaces the old profit/loss headline. Deliberately NOT
 * seeded like the rest of this app's demo data (which stays fixed per company so numbers don't
 * shuffle on every reload): this is meant to feel alive, a fresh reassurance each time the
 * dashboard loads that Sleek kept working in the background, so it uses plain `Math.random()`.
 */
function pastMonthName(): string {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - 1);
  return date.toLocaleDateString('en-US', { month: 'long' });
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildActionPool(companyName: string): Array<{ count: number; text: string }> {
  const month = pastMonthName();
  const pool = [
    () => {
      const n = randomInt(15, 42);
      return { count: n, text: `categorised ${n} transactions` };
    },
    () => {
      const n = randomInt(5, 18);
      return { count: n, text: `matched ${n} receipts` };
    },
    () => {
      const n = randomInt(3, 12);
      return { count: n, text: `reconciled ${n} bank transactions` };
    },
    () => {
      const n = randomInt(2, 9);
      return { count: n, text: `uploaded ${n} documents` };
    },
    () => {
      const n = randomInt(1, 4);
      return { count: n, text: `flagged ${n} ${n === 1 ? 'item' : 'items'} for review` };
    },
    () => ({ count: 1, text: `drafted ${companyName}'s ${month} report` }),
  ];
  // Shuffle, then take 3 — a different mix of actions each load, not just different numbers.
  return pool
    .map((build) => ({ build, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, 3)
    .map(({ build }) => build());
}

function joinWithAnd(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildSummary(companyName: string): { count: number; description: string } {
  const actions = buildActionPool(companyName);
  const count = actions.reduce((sum, a) => sum + a.count, 0);
  const description = capitalize(joinWithAnd(actions.map((a) => a.text)));
  return { count, description };
}

const SWEEP_MS = 1800;
const SWEEP_PAUSE_MS = 3200;
const BAND_WIDTH = 220;

/** Honors the OS "reduce motion" setting — the banner stays fully static when it's on. */
function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduced)
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}

/** Soft diagonal highlight that sweeps across the banner every few seconds — the "Sleek was
 * quietly at work" magic cue. Its own absolutely-positioned, clipped layer (rather than
 * `overflow-hidden` on the banner) because the dismiss button deliberately hangs outside the
 * banner's corner and would get clipped too. */
function Shimmer({ width }: { width: number }) {
  const progress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!width) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: SWEEP_MS,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.delay(SWEEP_PAUSE_MS),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [width, progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-BAND_WIDTH * 1.5, width + BAND_WIDTH * 0.5],
  });

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { borderRadius: 16, overflow: 'hidden' }]}>
      <Animated.View
        style={{
          position: 'absolute',
          top: -20,
          bottom: -20,
          width: BAND_WIDTH,
          transform: [{ translateX }, { skewX: '-20deg' }],
        }}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="banner-shimmer" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
              <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.75} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#banner-shimmer)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** Sparkles icon with a slow, gentle twinkle (breathing opacity + scale). */
function TwinklingSparkles({ animate }: { animate: boolean }) {
  const pulse = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!animate) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animate, pulse]);

  return (
    <Animated.View
      style={{
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }),
        transform: [
          { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.06] }) },
        ],
      }}>
      <Icon as={Sparkles} size={20} className="text-[#18181B]" />
    </Animated.View>
  );
}

export function ActivityBanner({
  company,
  onNavigate,
}: {
  company: Company;
  onNavigate: (targetKey: string) => void;
}) {
  // Deliberately plain component state, not persisted anywhere (no sessionStorage) — dismissing
  // is meant to be scoped to "this one look at this one company's dashboard, right now," not a
  // durable preference. It reappears whenever this component gets a fresh mount: a page
  // refresh, leaving the shell for the root two-pane picker and coming back, or switching
  // companies (shell.tsx keys this component by company id specifically so a company switch
  // remounts it, since that alone wouldn't otherwise unmount anything). For demo purposes,
  // re-showing it easily matters more than remembering it was dismissed.
  const [dismissed, setDismissed] = React.useState(false);
  // Generated once per mount, not on every re-render — recomputing on unrelated state changes
  // elsewhere in the shell would make the message flicker/change under the user while they're
  // still reading it.
  const summary = React.useMemo(() => buildSummary(company.name), [company.name]);
  const reducedMotion = useReducedMotion();
  const [width, setWidth] = React.useState(0);

  if (dismissed) return null;

  return (
    // RN's default `position` is already 'relative' (unlike web's 'static'), so the absolutely
    // positioned close button below just works without extra styling here.
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ backgroundColor: '#EEFBF3' }}
      className="flex-row items-center gap-3 rounded-2xl py-4 pl-5 pr-10">
      {!reducedMotion && <Shimmer width={width} />}
      <TwinklingSparkles animate={!reducedMotion} />
      <View className="flex-1 gap-0.5">
        <Text className="font-plex-semibold text-base text-[#18181B]">
          {summary.count} actions completed while you were away
        </Text>
        <Text className="text-sm text-[#656565]">{summary.description}</Text>
      </View>
      <Pressable
        onPress={() => onNavigate('ledger-adjustments')}
        accessibilityRole="link"
        className="flex-row items-center gap-1.5 web:cursor-pointer">
        <Text className="hidden font-plex-semibold text-sm text-[#18181B] md:flex">
          View details
        </Text>
        <Icon as={ArrowRight} size={14} className="text-[#18181B]" />
      </Pressable>
      {/* Hangs off the box's top-right corner (negative offsets, half outside the box) rather
          than sitting inset inside the padding — out of the row next to "View details", which
          made the arrow read as if it pointed at the close button. A small white circular badge
          (with a soft shadow, since it's floating over two different backgrounds) so it still
          reads as attached to the box at that position; muted gray icon inside keeps it "dull"
          rather than the bold black-pill treatment used for genuinely primary actions
          elsewhere. */}
      <Pressable
        onPress={() => setDismissed(true)}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        hitSlop={8}
        style={{
          position: 'absolute',
          top: -10,
          right: -10,
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.15,
          shadowRadius: 3,
        }}
        className="items-center justify-center web:cursor-pointer">
        <Icon as={X} size={12} className="text-[#656565]" />
      </Pressable>
    </View>
  );
}
