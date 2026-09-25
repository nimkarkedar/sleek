import { Text } from '@/components/ui/text';
import * as React from 'react';
import { View } from 'react-native';

/** Square date tile — small muted caption on top ("SEP 26", "2027", "FY"), the main value
 * below ("22", "Mar", "26"). Used for transaction dates in the Work Queue and report periods in
 * Client reports.
 *
 * Two separately-padded sections with a full-bleed divider between them (not a short centered
 * line inside shared padding); `overflow-hidden` keeps the divider's edges from poking past the
 * rounding. */
export function DateBadge({ top, bottom }: { top: string; bottom: string }) {
  return (
    <View className="w-14 overflow-hidden rounded-xl bg-muted">
      <View className="items-center px-2 py-1.5">
        <Text className="font-plex-semibold text-[10px] uppercase text-muted-foreground">
          {top}
        </Text>
      </View>
      <View className="h-px w-full bg-white" />
      <View className="items-center px-2 py-1.5">
        <Text className="font-plex-semibold text-base leading-none text-foreground">{bottom}</Text>
      </View>
    </View>
  );
}
