import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { CompanyAvatar } from '@/components/workspace/workspace-selector';
import { type Company } from '@/lib/companies';
import { Portal } from '@rn-primitives/portal';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  ClipboardCheck,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import * as React from 'react';
import { Animated, Easing, Pressable, ScrollView, View } from 'react-native';

export type ComplianceStatus = 'good' | 'upcoming' | 'pending';

/** Derived from the Work list's own due dates (`getMostUrgentDueInDays`) — not an independent
 * signal invented for this widget, so "pending" here can never disagree with what "To do for
 * the day" is already showing. Same thresholds as the list's own row-level urgency styling:
 * <=0 is the red "due today/overdue" state, <=3 is "coming up soon." */
export function complianceStatusFromDueInDays(mostUrgentDueInDays: number): ComplianceStatus {
  if (mostUrgentDueInDays <= 0) return 'pending';
  if (mostUrgentDueInDays <= 3) return 'upcoming';
  return 'good';
}

/** The icon itself stays a constant dark glyph across all three states — only a small
 * notification dot changes (color, or absent entirely for "good") — rather than swapping icon
 * shape/color per status. Matches this being a plain inline link (like a "View report" link),
 * not a status chip. */
const DOT_COLOR: Record<ComplianceStatus, string | null> = {
  good: null,
  upcoming: '#D97706',
  pending: '#FB5E37',
};

const PANEL_WIDTH = 480;

/** Placeholder filing pipeline for the demo — every regulatory step that recurs annually once a
 * company is past its one-off incorporation setup (AGM/Annual Return → ACRA, Form C-S/IR8A →
 * IRAS), not yet wired to real per-company data. Sorted by due date, not by authority — the
 * accountant cares what's next, not which agency asked for it. */
type FilingStatus = 'flagged' | 'progress' | 'not-started' | 'done';
type Authority = 'ACRA' | 'IRAS';

const FILING_STATUS_META: Record<FilingStatus, { icon: LucideIcon; color: string }> = {
  flagged: { icon: AlertTriangle, color: '#FB5E37' },
  progress: { icon: Clock, color: '#D97706' },
  'not-started': { icon: Circle, color: '#A1A1AA' },
  done: { icon: CheckCircle2, color: '#1FA136' },
};

const FILINGS: Array<{
  key: string;
  status: FilingStatus;
  authority: Authority;
  title: string;
  meta: string;
  caption?: string;
  actionLabel?: string;
}> = [
  {
    key: 'agm',
    status: 'flagged',
    authority: 'ACRA',
    title: 'AGM',
    meta: 'Due 30 Sep',
    caption: 'Awaiting director signature on financial statements',
    actionLabel: 'Remind',
  },
  {
    key: 'annual-return',
    status: 'progress',
    authority: 'ACRA',
    title: 'Annual Return',
    meta: 'Due 31 Oct',
    caption: 'Needs: signed FS, AGM minutes, XBRL',
  },
  {
    key: 'form-cs',
    status: 'progress',
    authority: 'IRAS',
    title: 'Form C-S',
    meta: 'Due 30 Nov',
    caption: 'In progress · Accountant',
  },
  {
    key: 'ir8a',
    status: 'not-started',
    authority: 'IRAS',
    title: 'IR8A',
    meta: 'Due 1 Mar 2027',
    caption: 'Not started',
  },
];

/** Items that dropped out for this company this year (revenue under thresholds, not
 * GST-registered, audit-exempt) — shown collapsed with the reason, not hidden entirely. A
 * waiver looks identical to a forgotten filing unless the accountant can see it was checked. */
const NOT_REQUIRED = [
  { key: 'eci', title: 'ECI', reason: 'Waived · revenue ≤ $5M, nil ECI' },
  { key: 'gst', title: 'GST', reason: 'Not registered · revenue under $1M' },
  { key: 'audit', title: 'Audit', reason: 'Exempt · small company' },
];

function AuthorityTag({ authority }: { authority: Authority }) {
  return (
    <View className="rounded bg-[#F4F4F5] px-2 py-1">
      <Text className="text-xs font-plex-semibold uppercase tracking-wide text-[#656565]">
        {authority}
      </Text>
    </View>
  );
}

// Icon (20) + its gap (8) — the caption/meta/action line below indents past this so it lines up
// under the title text instead of the icon.
const ROW_INDENT = 28;

function FilingRow({
  status,
  authority,
  title,
  meta,
  caption,
  actionLabel,
}: {
  status: FilingStatus;
  authority: Authority;
  title: string;
  meta: string;
  caption?: string;
  actionLabel?: string;
}) {
  const statusMeta = FILING_STATUS_META[status];
  return (
    <View className="gap-2 py-5">
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-row items-center gap-2">
          <Icon as={statusMeta.icon} size={20} color={statusMeta.color} />
          <Text className="text-base font-plex-bold text-[#18181B]">{title}</Text>
        </View>
        <AuthorityTag authority={authority} />
      </View>
      <View
        className="flex-row items-start justify-between gap-4"
        style={{ paddingLeft: ROW_INDENT }}>
        {caption ? (
          <Text className="flex-1 text-base text-[#656565]">{caption}</Text>
        ) : (
          <View className="flex-1" />
        )}
        <Text className="text-base text-[#656565]">{meta}</Text>
      </View>
      {actionLabel && (
        <View style={{ paddingLeft: ROW_INDENT }}>
          <Button variant="outline" size="sm" className="self-start">
            <Text className="text-sm font-plex-medium">{actionLabel}</Text>
          </Button>
        </View>
      )}
    </View>
  );
}

/** Collapsed by default — the count in the header line is the at-a-glance signal; expanding is
 * for the accountant who wants to confirm a waiver's reasoning, not something everyone needs
 * open every time. A filled chip rather than a plain row — visually distinct from the active
 * filings above so it reads as "the resolved pile," not one more thing to act on. */
function NotRequiredSection() {
  const [expanded, setExpanded] = React.useState(false);
  return (
    // One continuous rounded box for the whole thing — header row and (when open) the item
    // list both live inside it, so expanding doesn't spill content out into plain white below.
    <View className="mt-5 rounded-xl bg-[#F4F4F5]">
      <Pressable
        onPress={() => setExpanded((prev) => !prev)}
        accessibilityRole="button"
        accessibilityLabel={`Not required this year, ${NOT_REQUIRED.length} items, ${expanded ? 'expanded' : 'collapsed'}`}
        className="flex-row items-center justify-between px-4 py-3.5 web:cursor-pointer">
        <Text className="text-base text-[#18181B]">
          Not required this year · {NOT_REQUIRED.length} things
        </Text>
        <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
          <Icon as={ChevronDown} size={18} className="text-[#18181B]" />
        </View>
      </Pressable>
      {expanded && (
        <View className="gap-3 px-4 pb-4 pt-1">
          {NOT_REQUIRED.map((item) => (
            <View key={item.key} className="flex-row items-center justify-between gap-4">
              <Text className="text-sm font-plex-semibold text-[#3F3F46]">{item.title}</Text>
              <Text className="text-sm text-[#656565]">{item.reason}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function ComplianceStatusButton({
  status,
  company,
}: {
  status: ComplianceStatus;
  company: Company;
}) {
  const [mounted, setMounted] = React.useState(false);
  const translateX = React.useRef(new Animated.Value(PANEL_WIDTH)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;
  const dotColor = DOT_COLOR[status];

  function openPanel() {
    setMounted(true);
  }

  // Slide in from the right + fade the overlay in, Notion-panel style, once the portal has
  // actually mounted (animating from the very first render would jump instead of sliding).
  React.useEffect(() => {
    if (!mounted) return;
    translateX.setValue(PANEL_WIDTH);
    overlayOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  }, [mounted, translateX, overlayOpacity]);

  // Animate back out first, then unmount — otherwise closing would just cut the panel away
  // instantly instead of sliding it back offscreen.
  function closePanel() {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: PANEL_WIDTH,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start(() => setMounted(false));
  }

  return (
    <>
      <Pressable
        onPress={openPanel}
        accessibilityRole="link"
        accessibilityLabel={`Compliance updates — ${status}`}
        className="flex-row items-center gap-2 web:cursor-pointer">
        <View>
          <Icon as={ClipboardCheck} size={18} className="text-[#18181B]" />
          {dotColor && (
            <View
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: dotColor,
              }}
            />
          )}
        </View>
        <Text numberOfLines={1} className="text-base font-plex-semibold text-[#18181B]">
          Compliance updates
        </Text>
        <Icon as={ArrowRight} size={16} className="text-[#18181B]" />
      </Pressable>

      {mounted && (
        <Portal name="compliance-panel">
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 70,
              backgroundColor: 'rgba(0,0,0,0.3)',
              opacity: overlayOpacity,
            }}>
            <Pressable
              onPress={closePanel}
              accessibilityLabel="Close compliance updates panel"
              style={{ flex: 1 }}
            />
          </Animated.View>

          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: PANEL_WIDTH,
              maxWidth: '100%',
              zIndex: 71,
              transform: [{ translateX }],
              // Inline, not `className="flex-col bg-white shadow-lg"` — this project's
              // NativeWind setup only reliably styles plain View/Text, not Animated.View, so
              // those classes were silently no-ops here (panel rendered with no background).
              flexDirection: 'column',
              backgroundColor: '#FFFFFF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
            }}>
            {/* Header block on the app's own gray canvas color (same #F4F5FA the dashboard's nav
                and header sit on) — the white list below it reads as the foreground "card,"
                same layering language used everywhere else in the shell. */}
            <View style={{ backgroundColor: '#F4F5FA' }} className="gap-3 px-8 pb-6 pt-8">
              <View className="flex-row items-start justify-between">
                <Text className="text-sm text-[#656565]">Compliance updates for</Text>
                <Pressable
                  onPress={closePanel}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  hitSlop={8}
                  className="web:cursor-pointer">
                  <Icon as={X} size={20} className="text-[#656565]" />
                </Pressable>
              </View>
              <View className="flex-row items-center gap-3">
                <CompanyAvatar company={company} size={32} />
                <Text className="text-2xl font-plex-bold text-[#18181B]">{company.name}</Text>
              </View>
              <Text className="text-lg font-plex-bold text-[#18181B]">
                FY2025/26 · FYE 31 Mar 2026
              </Text>
              <View className="flex-row items-center gap-2">
                <View
                  style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FB5E37' }}
                />
                <Text className="text-base font-plex-semibold text-destructive-text">
                  1 at risk
                </Text>
              </View>
            </View>
            <View className="border-b border-[#E4E4E7]" />

            <ScrollView className="flex-1" contentContainerClassName="px-8 py-6">
              {FILINGS.map(({ key, ...filing }, index) => (
                <React.Fragment key={key}>
                  {index > 0 && <View className="border-t border-[#E4E4E7]" />}
                  <FilingRow {...filing} />
                </React.Fragment>
              ))}

              <NotRequiredSection />

              {/* Primary CTA, full width so it reads as the clear next action, Sleek blue — the
                  brand color, not the default near-black `bg-primary` the shared Button
                  defaults to. */}
              <Button
                className="mt-5 w-full bg-brand active:bg-brand-hover web:hover:bg-brand-hover">
                <Text className="text-sm font-plex-medium text-white">View details</Text>
                <Icon as={ArrowRight} size={14} className="text-white" />
              </Button>
            </ScrollView>
          </Animated.View>
        </Portal>
      )}
    </>
  );
}
