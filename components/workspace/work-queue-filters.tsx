import { Chevron } from '@/components/icons/nav-icons';
import { Icon } from '@/components/ui/icon';
import { Sheet, SheetHeader, useSheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import {
  NEEDS_YOU_STATUSES,
  STATUS_META,
  WAITING_ON_US_STATUSES,
  type StatusFilterValue,
} from '@/lib/transaction-status';
import { CHIP_CLASS, CHIP_HOVER_STYLE, CHIP_STYLE } from '@/lib/ui-classes';
import { cn, hexToRgba } from '@/lib/utils';
import { Portal } from '@rn-primitives/portal';
import { Inbox, Search, SlidersHorizontal, type LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';

const DROPDOWN_WIDTH = 260;
const FILTER_PANEL_WIDTH = 400;
// The filter dropdown's own "select all" state isn't a real row status (see
// lib/transaction-status.ts), so it needs a color of its own rather than reading one off
// STATUS_META — reuses the same brand blue already established for icon-color usage elsewhere.
const NEEDS_ATTENTION_COLOR = '#2D74E4';

function filterLabel(value: StatusFilterValue): string {
  return value === 'needs-attention' ? 'Needs attention' : STATUS_META[value].label;
}

function filterColor(value: StatusFilterValue): string {
  return value === 'needs-attention' ? NEEDS_ATTENTION_COLOR : STATUS_META[value].color;
}

function FilterOptionRow({
  label,
  color,
  icon,
  selected,
  onPress,
}: {
  label: string;
  color: string | null;
  icon?: LucideIcon;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitem"
      style={selected ? { backgroundColor: hexToRgba(NEEDS_ATTENTION_COLOR, 0.08) } : undefined}
      className={cn(
        'flex-row items-center gap-3 rounded-lg px-3 py-2.5 web:cursor-pointer',
        !selected && 'web:hover:bg-muted'
      )}>
      {icon ? (
        <Icon as={icon} size={16} className="text-muted-foreground" />
      ) : (
        <View
          style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color ?? '#A1A1AA' }}
        />
      )}
      <Text
        className={cn(
          'flex-1 text-sm',
          selected ? 'font-plex-bold text-foreground' : 'font-plex-medium text-foreground'
        )}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Same desktop-dropdown mechanics as `WorkspaceSelector`/`PeriodSelector` — measure the
 * trigger's on-screen position, render the panel through a Portal at that anchor so it isn't
 * clipped by the table's own rounded-corner `overflow-hidden`. */
function StatusFilterDropdown({
  value,
  onValueChange,
  totalCount,
}: {
  value: StatusFilterValue;
  onValueChange: (value: StatusFilterValue) => void;
  totalCount: number;
}) {
  const triggerRef = React.useRef<View>(null);
  const [open, setOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const [anchor, setAnchor] = React.useState({ top: 0, left: 0 });

  function openMenu() {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ top: y + height + 8, left: x });
      setOpen(true);
    });
  }

  function select(next: StatusFilterValue) {
    onValueChange(next);
    setOpen(false);
  }

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={openMenu}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={[CHIP_STYLE, hovered && CHIP_HOVER_STYLE]}
        className={CHIP_CLASS}>
        <View
          style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: filterColor(value) }}
        />
        <Text className="text-sm font-plex-semibold text-foreground">{filterLabel(value)}</Text>
        {value === 'needs-attention' && (
          <Text className="text-sm text-muted-foreground">{totalCount}</Text>
        )}
        <Chevron size={16} color="#656565" />
      </Pressable>

      {open && (
        <Portal name="work-queue-status-filter">
          <Pressable
            onPress={() => setOpen(false)}
            accessibilityLabel="Close filter menu"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}
          />
          <View
            style={{
              position: 'absolute',
              top: anchor.top,
              left: anchor.left,
              width: DROPDOWN_WIDTH,
              zIndex: 50,
            }}
            className="gap-0.5 rounded-2xl border border-border bg-white p-2 shadow-lg">
            <Text className="px-3 pb-1 pt-2 text-xs font-plex-semibold uppercase tracking-wide text-muted-foreground">
              Needs you
            </Text>
            <FilterOptionRow
              label="Needs attention"
              color={NEEDS_ATTENTION_COLOR}
              selected={value === 'needs-attention'}
              onPress={() => select('needs-attention')}
            />
            {NEEDS_YOU_STATUSES.map((status) => (
              <FilterOptionRow
                key={status}
                label={STATUS_META[status].label}
                color={STATUS_META[status].color}
                selected={value === status}
                onPress={() => select(status)}
              />
            ))}
            <View className="my-1 border-t border-border" />
            <Text className="px-3 pb-1 pt-2 text-xs font-plex-semibold uppercase tracking-wide text-muted-foreground">
              Waiting on us
            </Text>
            {WAITING_ON_US_STATUSES.map((status) => (
              <FilterOptionRow
                key={status}
                label={STATUS_META[status].label}
                color={STATUS_META[status].color}
                selected={value === status}
                onPress={() => select(status)}
              />
            ))}
            <View className="my-1 border-t border-border" />
            {/* Functionally the same as "Needs attention" for now — see StatusFilterValue. */}
            <FilterOptionRow
              label="All items"
              color={null}
              icon={Inbox}
              selected={false}
              onPress={() => select('needs-attention')}
            />
          </View>
        </Portal>
      )}
    </>
  );
}

function SearchBox({ value, onChangeText }: { value: string; onChangeText: (v: string) => void }) {
  return (
    <View className="min-w-0 flex-1 flex-row items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 md:min-w-[220px] md:flex-none">
      <Icon as={Search} size={16} className="text-muted-foreground" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search transactions"
        placeholderTextColor="#9A9A9A"
        className="flex-1 font-sans text-sm text-foreground web:outline-none"
        style={Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : undefined}
      />
    </View>
  );
}

/** Icon-only trigger for a second, currently-empty Sheet — "more filters," design TBD. Reuses
 * the exact same Sheet the compliance-updates panel uses instead of a second bespoke
 * Portal+Animated implementation. */
function FiltersPanelButton() {
  const sheet = useSheet(FILTER_PANEL_WIDTH);
  return (
    <>
      <Pressable
        onPress={sheet.open}
        accessibilityRole="button"
        accessibilityLabel="More filters"
        className="h-10 w-10 items-center justify-center rounded-lg border border-border bg-white web:cursor-pointer">
        <Icon as={SlidersHorizontal} size={16} className="text-foreground" />
      </Pressable>
      <Sheet
        name="work-queue-filters-panel"
        mounted={sheet.mounted}
        translateX={sheet.translateX}
        overlayOpacity={sheet.overlayOpacity}
        onClose={sheet.close}
        width={FILTER_PANEL_WIDTH}>
        <SheetHeader eyebrow="Filters" onClose={sheet.close} />
        <View className="border-b border-border" />
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-sm text-muted-foreground">More filters coming soon.</Text>
        </View>
      </Sheet>
    </>
  );
}

export function WorkQueueFilterBar({
  value,
  onValueChange,
  totalCount,
  query,
  onQueryChange,
}: {
  value: StatusFilterValue;
  onValueChange: (value: StatusFilterValue) => void;
  totalCount: number;
  query: string;
  onQueryChange: (value: string) => void;
}) {
  return (
    <View className="gap-3 border-b border-border px-6 py-4 md:flex-row md:items-center md:justify-between md:px-4">
      <StatusFilterDropdown value={value} onValueChange={onValueChange} totalCount={totalCount} />
      <View className="flex-row items-center gap-2">
        <SearchBox value={query} onChangeText={onQueryChange} />
        <FiltersPanelButton />
      </View>
    </View>
  );
}
