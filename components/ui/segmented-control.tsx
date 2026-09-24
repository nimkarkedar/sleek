import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { Pressable, View } from 'react-native';

export type SegmentedControlOption = {
  value: string;
  label: string;
  count?: number;
};

/** Solid dark tab for the active option (same `bg-[#18181B]` badge color already used for nav
 * item counts, just inverted — a light count bubble on a dark tab here instead of the other way
 * around) with plain, unboxed text for inactive tabs — no shared track/border, since a light
 * track blended into this app's gray page canvas and read as barely-there.
 *
 * `rounded-md`, not `rounded-full` — every other button-sized element in this system (`Button`,
 * `Checkbox`, the `CHIP_STYLE` trigger chips) uses a modest ~8px radius; `rounded-full` here is
 * reserved for genuinely circular things (avatars, the small count bubble below), not
 * button-sized rectangles. A full pill on something this size reads as the "bulging stadium
 * pill" look already rejected once for the header chips.
 *
 * Padding is applied to every tab regardless of active state (only the background/text color
 * change) — this used to be padding+background only on the active tab, which changed each
 * tab's own footprint on selection and shifted the other tab sideways. Counts are always shown
 * too, not just on the active tab, styled to read against whichever background they're on
 * (light bubble on the dark active tab, muted bubble on inactive text). */
export function SegmentedControl({
  value,
  onValueChange,
  options,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SegmentedControlOption[];
  className?: string;
}) {
  return (
    <View className={cn('flex-row items-center gap-2 self-start', className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onValueChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            className={cn(
              'flex-row items-center gap-2 rounded-md px-4 py-2.5 web:cursor-pointer',
              active && 'bg-[#18181B]'
            )}>
            <Text
              className={cn(
                'text-sm font-plex-medium',
                active ? 'text-white' : 'text-muted-foreground'
              )}>
              {option.label}
            </Text>
            {option.count != null && (
              <View
                className={cn(
                  'h-6 min-w-[24px] items-center justify-center rounded-full px-1.5',
                  active ? 'bg-white' : 'bg-muted'
                )}>
                <Text
                  className={cn(
                    'text-xs font-plex-bold',
                    active ? 'text-[#18181B]' : 'text-muted-foreground'
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
