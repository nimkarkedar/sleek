import { Chevron } from '@/components/icons/nav-icons';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { CHIP_CLASS, CHIP_HOVER_STYLE, CHIP_STYLE } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Portal } from '@rn-primitives/portal';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';

const PANEL_WIDTH = 320;
const CUSTOM_PANEL_WIDTH = 300;
/** Matches the breakpoint used by `WorkspaceSelector` — below this the picker behaves like a
 * native bottom sheet instead of an anchored dropdown. */
const MOBILE_BREAKPOINT = 768;

export type PeriodPreset = 'current-year' | 'last-quarter' | 'last-half-year' | 'previous-year';

export type Period =
  | { kind: 'preset'; preset: PeriodPreset }
  | { kind: 'custom'; from: string; to: string };

export const DEFAULT_PERIOD: Period = { kind: 'preset', preset: 'current-year' };

const PRESET_LIST_LABEL: Record<PeriodPreset, string> = {
  'current-year': 'Current financial year',
  'last-quarter': 'Last quarter',
  'last-half-year': 'Last half year',
  'previous-year': 'Previous year',
};

const PRESET_TRIGGER_LABEL: Record<PeriodPreset, string> = {
  'current-year': 'Current year',
  'last-quarter': 'Last quarter',
  'last-half-year': 'Last half year',
  'previous-year': 'Previous year',
};

function monthYear(date: Date): string {
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

/** Financial year runs Apr–Mar — the year a Jan/Feb/Mar date belongs to is the one that started
 * the previous April. */
function fyStartYear(today: Date): number {
  return today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
}

function presetRange(preset: PeriodPreset, today: Date): { start: Date; end: Date } {
  const startYear = fyStartYear(today);
  switch (preset) {
    case 'current-year':
      return { start: new Date(startYear, 3, 1), end: new Date(startYear + 1, 2, 31) };
    case 'previous-year':
      return { start: new Date(startYear - 1, 3, 1), end: new Date(startYear, 2, 31) };
    case 'last-quarter': {
      const currentQuarterStart = Math.floor(today.getMonth() / 3) * 3;
      return {
        start: new Date(today.getFullYear(), currentQuarterStart - 3, 1),
        end: new Date(today.getFullYear(), currentQuarterStart, 0),
      };
    }
    case 'last-half-year': {
      const inSecondHalf = today.getMonth() >= 6;
      return inSecondHalf
        ? { start: new Date(today.getFullYear(), 0, 1), end: new Date(today.getFullYear(), 5, 30) }
        : {
            start: new Date(today.getFullYear() - 1, 6, 1),
            end: new Date(today.getFullYear() - 1, 11, 31),
          };
    }
  }
}

/** One line per row: "<label> - <range>" — presets use a month-level range except "previous
 * year", which reads as a plain year span ("2025-2026") to match the financial-year naming. */
function presetRowLabel(preset: PeriodPreset, today: Date): string {
  const { start, end } = presetRange(preset, today);
  const range =
    preset === 'previous-year'
      ? `${start.getFullYear()}-${end.getFullYear()}`
      : `${monthYear(start)} - ${monthYear(end)}`;
  return `${PRESET_LIST_LABEL[preset]} - ${range}`;
}

function formatDateInput(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fromISODate(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** Month-grid calendar for the custom range — click a day to start a range, click a later day
 * to complete it; clicking again after a range is complete starts a new one. */
function CalendarMonth({
  visibleMonth,
  onPrevMonth,
  onNextMonth,
  from,
  to,
  onSelectDay,
}: {
  visibleMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  from: Date | null;
  to: Date | null;
  onSelectDay: (day: Date) => void;
}) {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <View className="gap-1">
      <View className="flex-row items-center justify-between px-1 pb-1">
        <Pressable
          onPress={onPrevMonth}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          hitSlop={8}
          className="items-center justify-center rounded-md p-1 web:cursor-pointer web:hover:bg-[#F5F5F5]">
          <Icon as={ChevronLeft} size={16} className="text-[#656565]" />
        </Pressable>
        <Text className="text-sm font-plex-semibold text-[#18181B]">
          {visibleMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable
          onPress={onNextMonth}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          hitSlop={8}
          className="items-center justify-center rounded-md p-1 web:cursor-pointer web:hover:bg-[#F5F5F5]">
          <Icon as={ChevronRight} size={16} className="text-[#656565]" />
        </Pressable>
      </View>

      <View className="flex-row">
        {WEEKDAY_LABELS.map((w, i) => (
          <View key={`${w}-${i}`} className="flex-1 items-center py-1">
            <Text className="text-[11px] font-plex-medium text-[#9A9A9A]">{w}</Text>
          </View>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} className="flex-row">
          {week.map((day, di) => {
            if (!day) return <View key={di} className="flex-1" style={{ aspectRatio: 1 }} />;
            const isFrom = !!from && isSameDay(day, from);
            const isTo = !!to && isSameDay(day, to);
            const inRange = !!from && !!to && day > from && day < to;
            const isToday = isSameDay(day, today);
            const isEndpoint = isFrom || isTo;
            return (
              <Pressable
                key={di}
                onPress={() => onSelectDay(day)}
                accessibilityRole="button"
                accessibilityLabel={day.toDateString()}
                style={{ aspectRatio: 1 }}
                className={cn(
                  'flex-1 items-center justify-center web:cursor-pointer',
                  inRange && 'bg-[#EAF1FE]'
                )}>
                <View
                  style={{ backgroundColor: isEndpoint ? '#2D74E4' : 'transparent' }}
                  className="h-8 w-8 items-center justify-center rounded-full">
                  <Text
                    className={cn(
                      'text-sm',
                      isEndpoint
                        ? 'font-plex-semibold text-white'
                        : isToday
                          ? 'font-plex-bold text-brand'
                          : 'text-[#18181B]'
                    )}>
                    {day.getDate()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function periodTriggerLabel(period: Period, today: Date = new Date()): string {
  if (period.kind === 'custom') {
    if (!period.from || !period.to) return 'Custom range';
    return `Custom - ${formatDateInput(period.from)} - ${formatDateInput(period.to)}`;
  }
  const { start, end } = presetRange(period.preset, today);
  return `${PRESET_TRIGGER_LABEL[period.preset]} - ${monthYear(start)} - ${monthYear(end)}`;
}

const ALL_PRESETS: PeriodPreset[] = [
  'current-year',
  'last-quarter',
  'last-half-year',
  'previous-year',
];

type PeriodSelectorProps = {
  period: Period;
  onPeriodChange: (period: Period) => void;
  className?: string;
};

export function PeriodSelector({ period, onPeriodChange, className }: PeriodSelectorProps) {
  const triggerRef = React.useRef<View>(null);
  const [open, setOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const [view, setView] = React.useState<'list' | 'custom'>('list');
  const [customFrom, setCustomFrom] = React.useState('');
  const [customTo, setCustomTo] = React.useState('');
  const [visibleMonth, setVisibleMonth] = React.useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [anchor, setAnchor] = React.useState({ top: 0, left: 0 });
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isMobile = windowWidth < MOBILE_BREAKPOINT;
  const today = React.useMemo(() => new Date(), []);

  function openPicker() {
    setView('list');
    if (period.kind === 'custom') {
      setCustomFrom(period.from);
      setCustomTo(period.to);
      const anchorDate = fromISODate(period.from) ?? new Date();
      setVisibleMonth(new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1));
    }
    if (isMobile) {
      setOpen(true);
      return;
    }
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ top: y + height + 8, left: x });
      setOpen(true);
    });
  }

  function close() {
    setOpen(false);
    setView('list');
  }

  function selectPreset(preset: PeriodPreset) {
    onPeriodChange({ kind: 'preset', preset });
    close();
  }

  function handleSelectDay(day: Date) {
    const fromDate = fromISODate(customFrom);
    const toDate = fromISODate(customTo);
    if (!fromDate || (fromDate && toDate)) {
      // Nothing picked yet, or a complete range already exists — start a fresh one.
      setCustomFrom(toISODate(day));
      setCustomTo('');
    } else if (day < fromDate) {
      // Picked an earlier day second — it becomes the start instead of the end.
      setCustomTo(customFrom);
      setCustomFrom(toISODate(day));
    } else {
      setCustomTo(toISODate(day));
    }
  }

  function applyCustomRange() {
    if (!customFrom || !customTo) return;
    onPeriodChange({ kind: 'custom', from: customFrom, to: customTo });
    close();
  }

  const selectedPreset = period.kind === 'preset' ? period.preset : null;

  const listContent = (
    <>
      {ALL_PRESETS.map((preset) => {
        const isSelected = selectedPreset === preset;
        return (
          <Pressable
            key={preset}
            onPress={() => selectPreset(preset)}
            className={cn(
              'flex-row items-center gap-3 rounded-lg px-3 py-3 web:cursor-pointer',
              isSelected ? 'bg-[#F0F0F1]' : 'web:hover:bg-[#F5F5F5]'
            )}>
            <Text numberOfLines={1} className="flex-1 text-sm font-plex-medium text-[#18181B]">
              {presetRowLabel(preset, today)}
            </Text>
            {isSelected && <Icon as={Check} size={16} className="text-brand" />}
          </Pressable>
        );
      })}
      <Pressable
        onPress={() => setView('custom')}
        className={cn(
          'flex-row items-center gap-3 rounded-lg px-3 py-3 web:cursor-pointer',
          period.kind === 'custom' ? 'bg-[#F0F0F1]' : 'web:hover:bg-[#F5F5F5]'
        )}>
        <Text numberOfLines={1} className="flex-1 text-sm font-plex-medium text-[#18181B]">
          Custom date range
        </Text>
        {period.kind === 'custom' && <Icon as={Check} size={16} className="text-brand" />}
      </Pressable>
    </>
  );

  const customContent = (
    <>
      <View className="flex-row items-center justify-between px-1 pb-1">
        <Pressable
          onPress={() => setView('list')}
          className="flex-row items-center gap-1.5 py-1 web:cursor-pointer">
          <Icon as={ChevronLeft} size={14} className="text-[#656565]" />
          <Text className="text-xs font-plex-medium text-[#656565]">Back</Text>
        </Pressable>
        <Text className="text-xs font-plex-medium text-[#656565]">
          {customFrom ? formatDateInput(customFrom) : 'Start date'}
          {'  →  '}
          {customTo ? formatDateInput(customTo) : 'End date'}
        </Text>
      </View>
      <CalendarMonth
        visibleMonth={visibleMonth}
        onPrevMonth={() =>
          setVisibleMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
        }
        onNextMonth={() =>
          setVisibleMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
        }
        from={fromISODate(customFrom)}
        to={fromISODate(customTo)}
        onSelectDay={handleSelectDay}
      />
      <Pressable
        onPress={applyCustomRange}
        disabled={!customFrom || !customTo}
        className={cn(
          'mx-1 mt-2 items-center rounded-lg py-2.5 web:cursor-pointer',
          customFrom && customTo ? 'bg-brand' : 'bg-[#E4E4E7]'
        )}>
        <Text
          className={cn(
            'text-sm font-plex-semibold',
            customFrom && customTo ? 'text-white' : 'text-[#9A9A9A]'
          )}>
          Apply
        </Text>
      </Pressable>
    </>
  );

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={openPicker}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        // 50 = the 34px avatar that sets the switcher's/user menu's height + their py-2 padding
        // (8+8) — RN's `minHeight` is border-box (padding included), so this has to be the
        // *total* target box height, not just the avatar size, to actually match them.
        style={[CHIP_STYLE, { minHeight: 50 }, hovered && CHIP_HOVER_STYLE]}
        className={cn(CHIP_CLASS, className)}>
        <Text numberOfLines={1} className="text-sm font-plex-semibold text-[#18181B]">
          {periodTriggerLabel(period, today)}
        </Text>
        {/* Pinned to the box's right edge (not just trailing the label) so extra width — e.g.
            the full-width mobile trigger — reads as a normal dropdown, chevron flush right. */}
        <View className="ml-auto">
          <Chevron size={16} color="#656565" />
        </View>
      </Pressable>

      {open && isMobile && (
        <Portal name="period-selector-sheet">
          <Pressable
            onPress={close}
            accessibilityLabel="Close period picker"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 40,
              backgroundColor: 'rgba(0,0,0,0.3)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 50,
              maxHeight: windowHeight * 0.85,
            }}
            className="rounded-t-2xl bg-white shadow-lg">
            <View className="items-center pb-2 pt-3">
              <View className="h-1 w-10 rounded-full bg-[#E4E4E7]" />
            </View>
            <View className="flex-row items-center justify-between px-6 pb-4">
              <Text className="text-lg font-plex-semibold text-[#18181B]">
                {view === 'list' ? 'Select period' : 'Custom date range'}
              </Text>
            </View>
            <ScrollView contentContainerClassName="gap-1 px-4 pb-6" keyboardShouldPersistTaps="handled">
              {view === 'list' ? listContent : customContent}
            </ScrollView>
          </View>
        </Portal>
      )}

      {open && !isMobile && (
        <Portal name="period-selector-dropdown">
          <Pressable
            onPress={close}
            accessibilityLabel="Close period picker"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}
          />
          <View
            style={{
              position: 'absolute',
              top: anchor.top,
              left: anchor.left,
              width: view === 'list' ? PANEL_WIDTH : CUSTOM_PANEL_WIDTH,
              zIndex: 50,
            }}
            className="rounded-2xl border border-[#E4E4E7] bg-white shadow-lg">
            {/* Same flyout, swapped content — the container just grows/shrinks to fit whichever
                view is active instead of opening a second popover. */}
            <View className="gap-1 p-3">{view === 'list' ? listContent : customContent}</View>
          </View>
        </Portal>
      )}
    </>
  );
}
