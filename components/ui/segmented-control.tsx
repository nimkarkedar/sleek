import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

export type SegmentedControlOption = {
  value: string;
  label: string;
  count?: number;
  icon?: LucideIcon;
};

/** Two looks, one component:
 *
 * `variant="pill"` (default) — page tabs. Solid dark tab for the active option (same
 * `bg-[#18181B]` badge color already used for nav item counts, just inverted — a light count
 * bubble on a dark tab here instead of the other way around) with plain, unboxed text for
 * inactive tabs — no shared track/border, since a light track blended into this app's gray page
 * canvas and read as barely-there.
 *
 * `variant="track"` — an in-form choice (shadcn Tabs list look): a muted track with the active
 * option as a white segment. Used inside white cards, where the track does read.
 *
 * `rounded-md`, not `rounded-full` — every other button-sized element in this system (`Button`,
 * `Checkbox`, the `CHIP_STYLE` trigger chips) uses a modest ~8px radius; `rounded-full` here is
 * reserved for genuinely circular things (avatars, the small count bubble below), not
 * button-sized rectangles.
 *
 * Padding is applied to every tab regardless of active state (only the background/text color
 * change), so selecting a tab never shifts its neighbours. Counts are always shown too, styled to
 * read against whichever background they're on. */
export function SegmentedControl({
  value,
  onValueChange,
  options,
  variant = 'pill',
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SegmentedControlOption[];
  variant?: 'pill' | 'track';
  className?: string;
}) {
  const track = variant === 'track';
  return (
    <View
      role="tablist"
      className={cn(
        'flex-row items-center self-start',
        track ? 'gap-1 rounded-lg bg-muted p-1' : 'gap-2',
        className
      )}>
      {options.map((option) => {
        const active = option.value === value;
        const textColor = track
          ? active
            ? 'text-foreground'
            : 'text-muted-foreground'
          : active
            ? 'text-white'
            : 'text-muted-foreground';
        return (
          <Pressable
            key={option.value}
            onPress={() => onValueChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            className={cn(
              'flex-row items-center gap-2 rounded-md web:cursor-pointer',
              track ? 'px-3 py-1.5' : 'px-4 py-2.5',
              active && (track ? 'bg-white shadow-sm shadow-black/5' : 'bg-[#18181B]')
            )}>
            {option.icon && <Icon as={option.icon} size={16} className={textColor} />}
            <Text className={cn('font-plex-semibold text-sm', textColor)}>{option.label}</Text>
            {option.count != null && (
              <View
                className={cn(
                  'h-6 min-w-[24px] items-center justify-center rounded-full px-1.5',
                  active && !track ? 'bg-white' : 'bg-muted'
                )}>
                <Text
                  className={cn(
                    'font-plex-semibold text-xs',
                    active && !track ? 'text-[#18181B]' : 'text-muted-foreground'
                  )}>
                  {option.count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
