import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { type Company } from '@/lib/companies';
import { createRng, randomInt } from '@/lib/seeded-random';
import { TONE_BADGE_CLASS, TONE_HEX } from '@/lib/tone';
import { cn, hexToRgba } from '@/lib/utils';
import {
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  FileText,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * Every row is the same shape now — icon, title/subtext, a due date, and a CTA that jumps into
 * the relevant queue. There used to be a second 'task' variant with a checkbox instead of an
 * icon (for one-off actions like sending a report), but the whole row is a single click-through
 * to the target now, so a separate "mark as done here" interaction didn't have a place anymore.
 *
 * `dueInDays` (0 = today, negative = overdue) drives both the sort order (most urgent first)
 * and the row's urgency styling — red, in this list, means exactly one thing: due today or
 * overdue. Nothing else on the row uses red.
 *
 * `clientVisible` (default true) — Work is the same company's workspace for both personas, but
 * a couple of items are professional bookkeeping tasks the accountant does *for* the client
 * (sending a report, reviewing compliance flags), not something a business owner does for
 * themselves — those are hidden from the Client view.
 *
 * `subtext` — the human "why," one short sentence (e.g. "Needed to complete this month's
 * reconciliation"). `feedsInto`/`authority` aren't rendered by the current row design (a plain
 * title/subtext/due/CTA layout has no chip for them) but are kept on the data — what this feeds
 * and which government body ultimately requires it — since that's real product logic worth not
 * throwing away while the visual design is still being iterated on.
 */
type TodoItem = {
  id: string;
  icon: LucideIcon;
  title: string;
  subtext: string;
  feedsInto: string;
  authority?: 'ACRA' | 'IRAS';
  ctaLabel: string;
  targetKey: string;
  /** Which Work Queue tab this should land on, when `targetKey` is 'work' — e.g. "documents to
   * upload" opens straight on the Documents tab instead of the default Pending transactions
   * one. Left unset for items that don't have a specific tab to point at. */
  targetTab?: string;
  dueInDays: number;
  clientVisible?: boolean;
};

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

/** Whole-day difference, ignoring time-of-day — negative once the date has passed. */
function daysUntil(date: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const startOfTarget = new Date(date).setHours(0, 0, 0, 0);
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  return Math.round((startOfTarget - startOfToday) / msPerDay);
}

const MONTHLY_CLOSE_DAY = 10;

/** The recurring "books close by the Nth" cadence that reconciliation (transactions +
 * documents) actually feeds — same idea for every company, not company-specific, since it's a
 * calendar cutoff, not a per-company fact. */
function nextMonthlyCloseDate(): Date {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), MONTHLY_CLOSE_DAY);
  if (target < now) target.setMonth(target.getMonth() + 1);
  return target;
}

/** Annual Return, 31 Oct — same filing deadline the (currently hidden) compliance panel used.
 * Kept here independently of that panel: the underlying deadline is still real and still worth
 * driving this list's urgency, even while the panel itself is on hold. */
function nextAnnualReturnDate(): Date {
  const now = new Date();
  const target = new Date(now.getFullYear(), 9, 31);
  if (target < now) target.setFullYear(target.getFullYear() + 1);
  return target;
}

/** Seeded per company — deterministic per item, not just per company, so adding/reordering
 * fields doesn't shuffle every other item's numbers. */
function itemRng(company: Company, itemId: string): () => number {
  return createRng(`${company.id}:todos:${itemId}`);
}

/** -3..+7 — skewed toward "soon," since everything in this list is still open. Exported so the
 * Work Queue nav badge can be built from the exact same counts shown here instead of drifting
 * out of sync with its own separate number. */
export function computeTodoCounts(company: Company) {
  return {
    pendingTransactions: randomInt(itemRng(company, 'pending-transactions'), 1, 40),
    documents: randomInt(itemRng(company, 'documents-to-upload'), 1, 20),
    approvals: randomInt(itemRng(company, 'approval-requests'), 1, 10),
    flags: randomInt(itemRng(company, 'review-flags'), 1, 6),
  };
}

/** The Work Queue nav badge — sum of every countable item in this list, so it can never show a
 * number the list itself doesn't add up to. */
export function getWorkQueueTotal(company: Company): number {
  const counts = computeTodoCounts(company);
  return counts.pendingTransactions + counts.documents + counts.approvals + counts.flags;
}

// All CTAs currently point back at Work — there's no deeper per-item destination built yet.
// Each item carries its own `targetKey` so pointing individual items elsewhere later (Books,
// Reports, ...) is a one-line data change, not a restructure.
//
// Due dates below are no longer arbitrary per-item offsets — they're the real thing each task
// feeds: transactions/documents/the monthly report all key off the recurring monthly close,
// flagged items off the Annual Return filing. This is the fix for the actual product problem —
// a client who only sees "8 documents pending" every month has no reason to believe it's urgent
// and puts it off; showing what it's actually blocking, and a real deadline, is what's supposed
// to break that procrastination loop.
function buildTodos(company: Company): TodoItem[] {
  const { pendingTransactions, documents, approvals, flags } = computeTodoCounts(company);
  const monthlyCloseDue = daysUntil(nextMonthlyCloseDate());
  // Cleared with some runway before the filing itself — this is prep work, not the filing day.
  const flagsDue = daysUntil(nextAnnualReturnDate()) - 21;

  // Acme is the company everyone lands on by default (COMPANIES[0]), so it's the one every demo
  // opens with — worth guaranteeing it actually shows the urgent/red state on the top-priority
  // item instead of leaving that to chance every time the seed happens to roll something urgent.
  const pendingTransactionsDue = company.id === 'acme' ? -1 : monthlyCloseDue;

  return [
    {
      id: 'pending-transactions',
      icon: ArrowLeftRight,
      title: `${pendingTransactions} pending transactions need your attention`,
      subtext: "Needed to complete this month's management accounts",
      feedsInto: 'Monthly management accounts',
      authority: 'IRAS',
      ctaLabel: 'Review',
      targetKey: 'work',
      dueInDays: pendingTransactionsDue,
    },
    {
      id: 'documents-to-upload',
      icon: FileText,
      title: `${documents} documents to upload`,
      subtext: "Needed to complete this month's reconciliation",
      feedsInto: 'Monthly management accounts',
      authority: 'IRAS',
      ctaLabel: 'Upload',
      targetKey: 'work',
      targetTab: 'documents',
      dueInDays: monthlyCloseDue,
    },
    {
      id: 'send-monthly-report',
      icon: BarChart3,
      title: 'Send monthly report to the client',
      subtext: "Shares this month's management accounts with the client",
      feedsInto: 'Client reporting',
      // No authority tag — this is a business courtesy, not a government filing.
      ctaLabel: 'Open',
      targetKey: 'work',
      // Goes out once the books above are actually closed.
      dueInDays: monthlyCloseDue + 2,
      clientVisible: false,
    },
    {
      id: 'approval-requests',
      icon: ClipboardCheck,
      title: `${approvals} approval ${pluralize(approvals, 'request')} waiting`,
      subtext: 'Needed to keep supplier payments and the books in sync',
      feedsInto: 'Monthly management accounts',
      authority: 'IRAS',
      ctaLabel: 'Approve',
      targetKey: 'work',
      dueInDays: monthlyCloseDue,
    },
    {
      id: 'review-flags',
      icon: ShieldCheck,
      title: `${flags} flagged compliance ${pluralize(flags, 'item')} to review`,
      subtext: 'Needed to finalise financial statements for the year',
      feedsInto: 'Annual filing',
      authority: 'ACRA',
      ctaLabel: 'Open',
      targetKey: 'work',
      dueInDays: flagsDue,
      clientVisible: false,
    },
  ];
}

const BADGE_SIZE = 36;
const ROW_HOVER_BG = '#FAFAFA';

// The actual calendar date, e.g. "30 Sep" — sits above the relative countdown so the due column
// reads as a real deadline, not just an abstract day counter.
function dueDateLabel(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// Relative countdown — "6 days left," "Overdue by 3 days," collapsing to whole months once a
// deadline is far enough out ("3 months left") that a day count stops being meaningful.
function dueCountdown(days: number): string {
  if (days < 0) return `Overdue by ${Math.abs(days)} ${pluralize(Math.abs(days), 'day')}`;
  if (days === 0) return 'Due today';
  if (days === 1) return '1 day left';
  if (days > 60) {
    const months = Math.max(1, Math.round(days / 30));
    return `${months} ${pluralize(months, 'month')} left`;
  }
  return `${days} days left`;
}

/** The one and only meaning red carries in this list — due today or overdue. Nothing else
 * (item type, category, icon) borrows it. Anything closer than 3 days gets a softer amber
 * instead of full red, so "overdue" still reads as the one unambiguous alarm state. */
function dueCountdownColor(days: number): string {
  if (isUrgent(days)) return TONE_HEX.destructive;
  if (days <= 3) return '#D97706';
  return '#656565';
}

function isUrgent(days: number): boolean {
  return days <= 0;
}

/** Soft "live/urgent" ping behind an icon badge — expands and fades, loops forever. Deliberately
 * not a shimmer sweep: shimmer reads as "this is still loading," which is the wrong signal for
 * something that needs action now. */
function PulseRing({ color }: { color: string }) {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, [progress]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - progress.value),
    transform: [{ scale: 1 + progress.value * 0.8 }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: BADGE_SIZE,
          height: BADGE_SIZE,
          borderRadius: BADGE_SIZE / 2,
          backgroundColor: color,
          pointerEvents: 'none',
        },
        ringStyle,
      ]}
    />
  );
}

type TodoRowProps = {
  todo: TodoItem;
  isLast: boolean;
  onNavigate: (targetKey: string, targetTab?: string) => void;
};

function TodoRow({ todo, isLast, onNavigate }: TodoRowProps) {
  const [hovered, setHovered] = React.useState(false);
  const urgent = isUrgent(todo.dueInDays);

  // Background is driven by inline style, not a Tailwind class — this project's NativeWind
  // setup doesn't reliably compile "compound" utilities (opacity modifiers like `bg-x/5`,
  // arbitrary bracket values) into real CSS, only plain single-token classes. Inline style
  // always works regardless, same fix as the corner-radius issue earlier.
  const baseBg = urgent ? hexToRgba(TONE_HEX.destructive, 0.05) : 'transparent';
  const hoverBg = urgent ? hexToRgba(TONE_HEX.destructive, 0.09) : ROW_HOVER_BG;

  return (
    <Pressable
      onPress={() => onNavigate(todo.targetKey, todo.targetTab)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      // No accessibilityRole="button" here — RN Web renders that as a real <button>, and this
      // row contains the CTA, which is already a <button> of its own. A <button> can't nest
      // another <button> (invalid HTML, React warns). The row is still fully clickable via
      // onPress; accessibilityLabel keeps it announced sensibly without claiming a role that
      // conflicts with its child.
      accessibilityLabel={todo.title}
      style={{ backgroundColor: hovered ? hoverBg : baseBg }}
      // Row on every breakpoint now — icon column, then one content column holding
      // title/due/CTA. Previously the icon+title were one group and due/CTA were separate
      // siblings faking alignment with a guessed `ml-14` margin matching the icon's width; any
      // mismatch between that margin and the icon's real width/gap showed up as misalignment.
      // Nesting everything text-related inside one column instead means it's the same flexbox
      // aligning them, not two numbers happening to match.
      className={cn(
        'flex-row gap-4 px-6 py-5 web:cursor-pointer',
        !isLast && 'border-b border-[#E4E4E7]'
      )}>
      <View
        className="items-center justify-center"
        style={{ width: BADGE_SIZE, height: BADGE_SIZE }}>
        {urgent && <PulseRing color={TONE_HEX.destructive} />}
        <View
          className={`h-9 w-9 items-center justify-center rounded-full ${TONE_BADGE_CLASS.neutral}`}>
          <Icon as={todo.icon} size={16} className="text-white" />
        </View>
      </View>

      {/* Content column — title/due/CTA stacked on mobile, laid out as three sub-columns on
          desktop. flex-1 so it absorbs whatever width the icon doesn't take. */}
      <View className="flex-1 gap-3 md:flex-row md:items-center md:gap-4">
        <View className="flex-1">
          <Text className="text-base font-plex-semibold text-[#18181B]">{todo.title}</Text>
          {/* The human "why" — desktop only. Mobile already stacks title / due+countdown / CTA
              as three separate rows; adding a fourth (this) made the card too tall — the title
              alone carries enough context there.
              Spacing is a margin on this Text itself (`mt-1`), not a `gap` on the parent — RN's
              flex `gap` doesn't reliably exclude a `hidden` (display:none) child from the gap
              calculation the way web CSS does, which was adding phantom space below the title
              on mobile even with this element invisible. A margin on a display:none element is
              unambiguously zero, gap or no gap. */}
          <Text className="hidden text-sm text-[#656565] md:mt-1 md:flex">{todo.subtext}</Text>
        </View>

        {/* Due date + countdown. One line on mobile ("Due 23 Sep · Overdue by 1 day") to keep
            the card from growing an extra row per item; two lines on desktop, in its own
            fixed-width column (`md:w-40` — a real Tailwind scale class, not an arbitrary
            `md:w-[160px]` one, which is the kind that doesn't compile reliably in this project)
            — without the fixed width, this column's start position shifted row to row because
            the CTA column after it wasn't fixed-width either (see below), so a longer/shorter
            button label pushed everything before it sideways. */}
        <View className="flex-row items-center gap-1.5 md:w-40 md:flex-col md:items-start md:gap-0.5">
          <Text className="text-sm text-[#656565]">Due {dueDateLabel(todo.dueInDays)}</Text>
          <Text className="text-sm text-[#656565] md:hidden">·</Text>
          <Text
            style={{ color: dueCountdownColor(todo.dueInDays) }}
            className="text-sm font-plex-semibold">
            {dueCountdown(todo.dueInDays)}
          </Text>
        </View>

        {/* CTA — fixed width + right-aligned on desktop (same reasoning as the due column
            above: "Approve" and "Open" are different lengths, so without a fixed width here the
            due column's own position would still drift). */}
        <View className="md:w-32 md:items-end">
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onPress={() => onNavigate(todo.targetKey, todo.targetTab)}>
            <Text className="text-sm font-plex-medium">{todo.ctaLabel}</Text>
            <Icon as={ArrowRight} size={14} />
          </Button>
        </View>
      </View>
    </Pressable>
  );
}

type WorkListProps = {
  role: 'client' | 'accountant';
  company: Company;
  onNavigate: (targetKey: string, targetTab?: string) => void;
  /** Accountant's Dashboard shows this as "To do for the day" — their main task list, not just
   * a nav destination. The standalone Work page renders the same list without the heading, since
   * the page title there already says "Work". */
  showHeading?: boolean;
};

export function WorkList({ role, company, onNavigate, showHeading }: WorkListProps) {
  const todos = React.useMemo(() => buildTodos(company), [company]);

  // Most urgent first — otherwise a task due today can end up buried under one due next week
  // just because of where it happens to sit in the source list.
  const visible = todos
    .filter((todo) => role === 'accountant' || todo.clientVisible !== false)
    .sort((a, b) => a.dueInDays - b.dueInDays);

  return (
    <View className="gap-5">
      {showHeading && (
        <Text className="text-xl font-plex-bold tracking-tight text-[#18181B]">
          To do for the day
        </Text>
      )}
      <View className="rounded-2xl border border-[#E4E4E7] bg-white shadow-sm shadow-black/5">
        {visible.map((todo, index) => (
          <TodoRow
            key={todo.id}
            todo={todo}
            isLast={index === visible.length - 1}
            onNavigate={onNavigate}
          />
        ))}
      </View>
    </View>
  );
}
