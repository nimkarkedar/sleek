import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react-native';
import * as React from 'react';
import { Platform, View, type AccessibilityActionEvent, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

/**
 * A list whose rows are reordered by dragging a grip handle. Only the handle starts a drag, so
 * touching the rest of a row still scrolls the page or presses what's in it. The handle also
 * moves its row with the arrow keys, and offers "Move up" / "Move down" to screen readers.
 *
 * `renderItem` gets the handle to place in the row wherever it fits.
 */
export function SortableList<T>({
  items,
  keyOf,
  labelOf,
  onMove,
  renderItem,
  disabled,
}: {
  items: T[];
  keyOf: (item: T) => string;
  /** Names the row for the handle's accessibility label ("Reorder Balance sheet"). */
  labelOf: (item: T) => string;
  onMove: (from: number, to: number) => void;
  renderItem: (item: T, index: number, handle: React.ReactNode) => React.ReactNode;
  /** No handles, no dragging — e.g. a published report. */
  disabled?: boolean;
}) {
  const [active, setActive] = React.useState<number | null>(null);
  const [target, setTarget] = React.useState<number | null>(null);
  const translateY = useSharedValue(0);
  const targetSv = useSharedValue(-1);
  const heights = useSharedValue<number[]>([]);
  const heightsRef = React.useRef<number[]>([]);
  // Read by the end-of-drag handler, which can run after a render that changed them.
  const dragRef = React.useRef<{ from: number | null; to: number | null }>({
    from: null,
    to: null,
  });

  const start = React.useCallback((index: number) => {
    dragRef.current = { from: index, to: index };
    setActive(index);
    setTarget(index);
  }, []);
  const moveTo = React.useCallback((index: number) => {
    dragRef.current.to = index;
    setTarget(index);
  }, []);
  const end = React.useCallback(() => {
    const { from, to } = dragRef.current;
    dragRef.current = { from: null, to: null };
    translateY.value = 0;
    targetSv.value = -1;
    setActive(null);
    setTarget(null);
    if (from !== null && to !== null && from !== to) onMove(from, to);
  }, [onMove, translateY, targetSv]);

  const draggedHeight = active !== null ? (heightsRef.current[active] ?? 0) : 0;

  return (
    <View>
      {items.map((item, index) => {
        // Rows between the dragged row and where it would land slide over to make room.
        let shift = 0;
        if (active !== null && target !== null && index !== active) {
          if (active < target && index > active && index <= target) shift = -draggedHeight;
          if (active > target && index < active && index >= target) shift = draggedHeight;
        }
        return (
          <SortableRow
            key={keyOf(item)}
            index={index}
            count={items.length}
            label={labelOf(item)}
            dragging={active !== null}
            isActive={active === index}
            shift={shift}
            translateY={translateY}
            targetSv={targetSv}
            heights={heights}
            disabled={disabled}
            onLayoutHeight={(h) => {
              heightsRef.current[index] = h;
              heights.value = [...heightsRef.current];
            }}
            onStart={start}
            onTarget={moveTo}
            onEnd={end}
            onMove={onMove}>
            {(handle) => renderItem(item, index, handle)}
          </SortableRow>
        );
      })}
    </View>
  );
}

/** Where a row dragged from `from` by `dy` would land, given every row's height. */
function landingIndex(from: number, dy: number, hs: number[]): number {
  'worklet';
  let to = from;
  let passed = 0;
  if (dy > 0) {
    for (let i = from + 1; i < hs.length; i++) {
      if (dy > passed + hs[i] / 2) to = i;
      else break;
      passed += hs[i];
    }
  } else {
    for (let i = from - 1; i >= 0; i--) {
      if (-dy > passed + hs[i] / 2) to = i;
      else break;
      passed += hs[i];
    }
  }
  return to;
}

function SortableRow({
  index,
  count,
  label,
  dragging,
  isActive,
  shift,
  translateY,
  targetSv,
  heights,
  disabled,
  onLayoutHeight,
  onStart,
  onTarget,
  onEnd,
  onMove,
  children,
}: {
  index: number;
  count: number;
  label: string;
  dragging: boolean;
  isActive: boolean;
  shift: number;
  translateY: SharedValue<number>;
  targetSv: SharedValue<number>;
  heights: SharedValue<number[]>;
  disabled?: boolean;
  onLayoutHeight: (height: number) => void;
  onStart: (index: number) => void;
  onTarget: (index: number) => void;
  onEnd: () => void;
  onMove: (from: number, to: number) => void;
  children: (handle: React.ReactNode) => React.ReactNode;
}) {
  const pan = React.useMemo(
    () =>
      Gesture.Pan()
        .enabled(!disabled)
        .onStart(() => {
          translateY.value = 0;
          targetSv.value = index;
          scheduleOnRN(onStart, index);
        })
        .onUpdate((e) => {
          translateY.value = e.translationY;
          const to = landingIndex(index, e.translationY, heights.value);
          if (to !== targetSv.value) {
            targetSv.value = to;
            scheduleOnRN(onTarget, to);
          }
        })
        .onFinalize(() => {
          scheduleOnRN(onEnd);
        }),
    [disabled, index, heights, onEnd, onStart, onTarget, targetSv, translateY]
  );

  // The dragged row follows the pointer; the others ease aside while a drag is on, and snap
  // straight to their new slots when it drops (the list has already reordered underneath).
  const style = useAnimatedStyle(
    () =>
      isActive
        ? { transform: [{ translateY: translateY.value }], zIndex: 10 }
        : {
            transform: [{ translateY: dragging ? withTiming(shift, { duration: 150 }) : shift }],
            zIndex: 0,
          },
    [isActive, dragging, shift]
  );

  const move = (delta: number) => {
    const to = index + delta;
    if (to >= 0 && to < count) onMove(index, to);
  };

  const handle = disabled ? null : (
    <GestureDetector gesture={pan}>
      <View
        accessible
        focusable
        role="button"
        accessibilityLabel={`Reorder ${label}`}
        accessibilityActions={[
          { name: 'moveUp', label: 'Move up' },
          { name: 'moveDown', label: 'Move down' },
        ]}
        onAccessibilityAction={(e: AccessibilityActionEvent) =>
          move(e.nativeEvent.actionName === 'moveUp' ? -1 : 1)
        }
        // Web: arrow keys move the focused row.
        {...(Platform.OS === 'web'
          ? {
              onKeyDown: (e: { key: string; preventDefault: () => void }) => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  move(e.key === 'ArrowUp' ? -1 : 1);
                }
              },
            }
          : {})}
        style={Platform.OS === 'web' ? ({ touchAction: 'none' } as ViewStyle) : undefined}
        className={cn(
          'h-9 w-7 items-center justify-center rounded-md web:select-none web:outline-none web:focus-visible:bg-muted',
          isActive ? 'web:cursor-grabbing' : 'web:cursor-grab web:hover:bg-muted'
        )}>
        {/* Three lines — the usual "drag to reorder" handle. */}
        <Icon as={Menu} size={16} className="text-muted-foreground" />
      </View>
    </GestureDetector>
  );

  return (
    <Animated.View style={style} onLayout={(e) => onLayoutHeight(e.nativeEvent.layout.height)}>
      {/* A lifted card while dragging — the classes live on a plain View, since NativeWind
          doesn't style Animated views. */}
      <View
        className={cn(
          'rounded-lg',
          isActive && 'border border-border bg-white shadow-md shadow-black/10'
        )}>
        {children(handle)}
      </View>
    </Animated.View>
  );
}
