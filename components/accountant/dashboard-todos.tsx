import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { TONE_BADGE_CLASS, TONE_HEX, type Tone } from '@/lib/tone';
import { cn } from '@/lib/utils';
import {
  ArrowLeftRight,
  ArrowRight,
  Check,
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
    }
  | {
      id: string;
      kind: 'task';
      title: string;
      subtitle: string;
      ctaLabel: string;
      targetKey: string;
      highlight?: boolean;
    };

const MAX_VISIBLE = 5;

// All CTAs currently point at Work Queue — the only destination built so far. Each item
// carries its own `targetKey` so pointing individual items at other sections later (Books,
// Reports, ...) is a one-line data change, not a restructure.
const TODOS: TodoItem[] = [
  {
    id: 'pending-transactions',
    kind: 'queue',
    icon: ArrowLeftRight,
    tone: 'destructive',
    title: '18 pending transactions need your attention',
    subtitle: 'Review and categorize to keep the books accurate',
    ctaLabel: 'Review',
    targetKey: 'workqueue',
    highlight: true,
  },
  {
    id: 'documents-to-upload',
    kind: 'queue',
    icon: FileText,
    tone: 'neutral',
    title: '12 documents to be uploaded to reconcile transactions',
    subtitle: 'Missing receipts and invoices for this month',
    ctaLabel: 'Upload',
    targetKey: 'workqueue',
  },
  {
    id: 'send-monthly-report',
    kind: 'task',
    title: 'Send monthly report to the client',
    subtitle: 'Keeps Acme Pte Ltd updated on their financial health',
    ctaLabel: 'Open',
    targetKey: 'workqueue',
  },
  {
    id: 'approval-requests',
    kind: 'queue',
    icon: ClipboardCheck,
    tone: 'success',
    title: '3 approval requests waiting',
    subtitle: 'Payment runs held up until you sign off',
    ctaLabel: 'Approve',
    targetKey: 'workqueue',
  },
  {
    id: 'review-flags',
    kind: 'task',
    title: 'Review flagged compliance items',
    subtitle: '2 items flagged during last reconciliation',
    ctaLabel: 'Open',
    targetKey: 'workqueue',
  },
];

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

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View
      className={cn(
        'h-6 w-6 items-center justify-center rounded-md border-2',
        checked ? 'border-success bg-success' : 'border-[#D4D4D8] bg-white'
      )}>
      {checked && <Icon as={Check} size={14} className="text-white" />}
    </View>
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
      className={cn('flex-row items-center gap-4 px-5 py-4', !isLast && 'border-b border-[#E4E4E7]')}>
      {todo.kind === 'task' ? (
        <Pressable
          onPress={onToggle}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isChecked }}
          accessibilityLabel={todo.title}
          hitSlop={8}
          className="self-start web:cursor-pointer">
          <Checkbox checked={isChecked} />
        </Pressable>
      ) : (
        <View
          className="items-center justify-center self-start"
          style={{ width: BADGE_SIZE, height: BADGE_SIZE }}>
          {todo.highlight && <PulseRing color={TONE_HEX[todo.tone]} />}
          <View
            className={`h-9 w-9 items-center justify-center rounded-full ${TONE_BADGE_CLASS[todo.tone]}`}>
            <Icon as={todo.icon} size={16} className="text-white" />
          </View>
        </View>
      )}

      <View className="flex-1 gap-0.5">
        <Text
          className={cn('text-base text-[#18181B]', isChecked && 'text-[#9A9A9A] line-through')}>
          {todo.title}
        </Text>
        <Text className="hidden text-sm text-[#656565] md:flex">{todo.subtitle}</Text>
      </View>

      <Button variant="outline" size="sm" onPress={() => onNavigate(todo.targetKey)}>
        <Text className="text-sm font-plex-medium">{todo.ctaLabel}</Text>
        <Icon as={ArrowRight} size={14} />
      </Button>
    </Pressable>
  );
}

type DashboardTodosProps = {
  onNavigate: (targetKey: string) => void;
};

export function DashboardTodos({ onNavigate }: DashboardTodosProps) {
  const [checkedIds, setCheckedIds] = React.useState<Set<string>>(new Set());

  function toggle(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const visible = TODOS.slice(0, MAX_VISIBLE);

  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-xl font-plex-bold tracking-tight text-[#18181B]">
          To do for the day
        </Text>
        <Pressable
          onPress={() => onNavigate('workqueue')}
          className="flex-row items-center gap-1 web:cursor-pointer">
          <Text className="text-sm font-plex-medium text-brand">View all</Text>
          <Icon as={ArrowRight} size={14} className="text-brand" />
        </Pressable>
      </View>

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
