import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { type Company } from '@/lib/companies';
import { createRng, randomInt } from '@/lib/seeded-random';
import { TONE_BADGE_CLASS, TONE_HEX, type Tone } from '@/lib/tone';
import { cn } from '@/lib/utils';
import {
  ArrowLeftRight,
  ArrowRight,
  ClipboardCheck,
  FileText,
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
 * Two kinds of "to do":
 *  - 'queue': an aggregate count of pending items (transactions, documents). These can't be
 *    checked off with a single tap — the count changes as new items arrive, and "done" means
 *    working through each one, not toggling a box. Shown with a domain icon + a CTA that jumps
 *    into the relevant queue.
 *  - 'task': a genuine one-off action (send this report). These get a real checkbox, since
 *    marking it done is exactly what completing the task means — this is the actual
 *    "close it out" loop we want the accountant forming a habit around.
 *
 * `highlight` marks the one item that should always catch the eye (e.g. the most urgent queue)
 * — gets a pulsing ring on its icon plus a faint persistent tint on the row.
 *
 * `clientVisible` (default true) — Work is the same company's workspace for both personas, but
 * a couple of items are professional bookkeeping tasks the accountant does *for* the client
 * (sending a report, reviewing compliance flags), not something a business owner does for
 * themselves — those are hidden from the Client view.
 */
type TodoItem =
  | {
      id: string;
      kind: 'queue';
      icon: LucideIcon;
      tone: Tone;
      title: string;
      subtitle: string;
      ctaLabel: string;
      targetKey: string;
      highlight?: boolean;
      clientVisible?: boolean;
    }
  | {
      id: string;
      kind: 'task';
      title: string;
      subtitle: string;
      ctaLabel: string;
      targetKey: string;
      highlight?: boolean;
      clientVisible?: boolean;
    };

// All CTAs currently point back at Work — there's no deeper per-item destination built yet.
// Each item carries its own `targetKey` so pointing individual items elsewhere later (Books,
// Reports, ...) is a one-line data change, not a restructure.
//
// Counts/subtitles are seeded per company so switching the workspace selector shows different
// numbers, but "pending transactions" always stays item #1 and highlighted — per user research,
// it's the single highest-priority to-do regardless of which client you're looking at.
function buildTodos(company: Company): TodoItem[] {
  const rng = createRng(`${company.id}:todos`);
  const pendingTransactions = randomInt(rng, 1, 40);
  const documents = randomInt(rng, 1, 20);
  const approvals = randomInt(rng, 1, 10);
  const flags = randomInt(rng, 1, 6);

  return [
    {
      id: 'pending-transactions',
      kind: 'queue',
      icon: ArrowLeftRight,
      tone: 'destructive',
      title: `${pendingTransactions} pending transactions need your attention`,
      subtitle: 'Review and categorize to keep the books accurate',
      ctaLabel: 'Review',
      targetKey: 'work',
      highlight: true,
    },
    {
      id: 'documents-to-upload',
      kind: 'queue',
      icon: FileText,
      tone: 'neutral',
      title: `${documents} documents to be uploaded to reconcile transactions`,
      subtitle: 'Missing receipts and invoices for this month',
      ctaLabel: 'Upload',
      targetKey: 'work',
    },
    {
      id: 'send-monthly-report',
      kind: 'task',
      title: 'Send monthly report to the client',
      subtitle: `Keeps ${company.name} updated on their financial health`,
      ctaLabel: 'Open',
      targetKey: 'work',
      clientVisible: false,
    },
    {
      id: 'approval-requests',
      kind: 'queue',
      icon: ClipboardCheck,
      tone: 'success',
      title: `${approvals} approval requests waiting`,
      subtitle: 'Payment runs held up until you sign off',
      ctaLabel: 'Approve',
      targetKey: 'work',
    },
    {
      id: 'review-flags',
      kind: 'task',
      title: 'Review flagged compliance items',
      subtitle: `${flags} items flagged during last reconciliation`,
      ctaLabel: 'Open',
      targetKey: 'work',
      clientVisible: false,
    },
  ];
}

const BADGE_SIZE = 36;
const ROW_HOVER_BG = '#FAFAFA';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
  isChecked: boolean;
  onToggle: () => void;
  onNavigate: (targetKey: string) => void;
};

function TodoRow({ todo, isLast, isChecked, onToggle, onNavigate }: TodoRowProps) {
  const [hovered, setHovered] = React.useState(false);

  // Background is driven by inline style, not a Tailwind class — this project's NativeWind
  // setup doesn't reliably compile "compound" utilities (opacity modifiers like `bg-x/5`,
  // arbitrary bracket values) into real CSS, only plain single-token classes. Inline style
  // always works regardless, same fix as the corner-radius issue earlier.
  const baseBg = todo.highlight ? hexToRgba(TONE_HEX.destructive, 0.05) : 'transparent';
  const hoverBg = todo.highlight ? hexToRgba(TONE_HEX.destructive, 0.09) : ROW_HOVER_BG;

  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{ backgroundColor: hovered ? hoverBg : baseBg }}
      // Column by default (RN's flex-direction default) so the CTA drops below the icon+title
      // on mobile instead of being squeezed onto the same tight row — row again from md up,
      // matching the original single-row layout.
      className={cn(
        'gap-3 px-6 py-5 md:flex-row md:items-center md:gap-4',
        !isLast && 'border-b border-[#E4E4E7]'
      )}>
      {/* flex-1 so this group fills the row on desktop (md:flex-row on the outer Pressable) and
          pushes the button to the far right, same as before this was split into two groups —
          without it the group shrink-wraps and the button ends up stranded right next to the
          text instead of at the row's edge. items-start top-aligns the icon column and the text
          column against each other when the title wraps to two lines. */}
      <View className="flex-1 flex-row items-start gap-4">
        {/* Fixed-width, horizontally centered — task rows' 24px checkbox and queue rows' 36px
            badge sit in the same column this way, so the text (and, on mobile, the CTA below
            it) always starts at the same x regardless of which icon a given row has. Was two
            differently-sized icons left-aligned against each other, which is what was throwing
            the text/button alignment off row to row. */}
        <View className="w-9 items-center">
          {todo.kind === 'task' ? (
            <Pressable
              onPress={onToggle}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isChecked }}
              accessibilityLabel={todo.title}
              hitSlop={8}
              className="web:cursor-pointer">
              <Checkbox checked={isChecked} />
            </Pressable>
          ) : (
            <View
              className="items-center justify-center"
              style={{ width: BADGE_SIZE, height: BADGE_SIZE }}>
              {todo.highlight && <PulseRing color={TONE_HEX[todo.tone]} />}
              <View
                className={`h-9 w-9 items-center justify-center rounded-full ${TONE_BADGE_CLASS[todo.tone]}`}>
                <Icon as={todo.icon} size={16} className="text-white" />
              </View>
            </View>
          )}
        </View>

        <View className="flex-1 gap-0.5">
          <Text
            className={cn(
              'text-base text-[#18181B]',
              isChecked && 'text-[#9A9A9A] line-through'
            )}>
            {todo.title}
          </Text>
          <Text className="hidden text-sm text-[#656565] md:flex">{todo.subtitle}</Text>
        </View>
      </View>

      {/* Indented to the icon column's width (36) + the row's own gap (16) = the same x the text
          above starts at — one constant value now that the icon column itself is a fixed width.
          Cancelled out on desktop, where the row's own gap-4 handles spacing instead. */}
      <View className="ml-14 md:ml-0">
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onPress={() => onNavigate(todo.targetKey)}>
          <Text className="text-sm font-plex-medium">{todo.ctaLabel}</Text>
          <Icon as={ArrowRight} size={14} />
        </Button>
      </View>
    </Pressable>
  );
}

type WorkListProps = {
  role: 'client' | 'accountant';
  company: Company;
  onNavigate: (targetKey: string) => void;
  /** Accountant's Dashboard shows this as "To do for the day" — their main task list, not just
   * a nav destination. The standalone Work page renders the same list without the heading, since
   * the page title there already says "Work". */
  showHeading?: boolean;
};

export function WorkList({ role, company, onNavigate, showHeading }: WorkListProps) {
  const [checkedIds, setCheckedIds] = React.useState<Set<string>>(new Set());
  const todos = React.useMemo(() => buildTodos(company), [company]);

  function toggle(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const visible = todos.filter((todo) => role === 'accountant' || todo.clientVisible !== false);

  return (
    <View className="gap-5">
      {showHeading && (
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-plex-bold tracking-tight text-[#18181B]">
            To do for the day
          </Text>
          <Pressable onPress={() => onNavigate('work')} className="web:cursor-pointer">
            <Text className="text-sm font-plex-medium text-brand">View all</Text>
          </Pressable>
        </View>
      )}
      <View className="rounded-2xl border border-[#E4E4E7] bg-white shadow-sm shadow-black/5">
        {visible.map((todo, index) => (
          <TodoRow
            key={todo.id}
            todo={todo}
            isLast={index === visible.length - 1}
            isChecked={todo.kind === 'task' && checkedIds.has(todo.id)}
            onToggle={() => toggle(todo.id)}
            onNavigate={onNavigate}
          />
        ))}
      </View>
    </View>
  );
}
