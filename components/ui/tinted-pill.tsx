import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { hexToRgba } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

/** Status pill: icon + label in one semantic color over a 12% tint of it. Used for Work Queue
 * transaction statuses and Reports statuses, so both read as one system. Regular weight — the
 * color and tint already carry the emphasis. Tint is a direct style
 * because opacity-modifier classes (`bg-x/10`) don't compile reliably in this NativeWind setup. */
export function TintedPill({
  label,
  icon,
  color,
}: {
  label: string;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <View
      style={{ backgroundColor: hexToRgba(color, 0.12) }}
      className="flex-row items-center gap-1.5 self-start rounded-md px-2.5 py-1.5">
      <Icon as={icon} size={14} color={color} />
      <Text style={{ color }} className="text-sm">
        {label}
      </Text>
    </View>
  );
}
