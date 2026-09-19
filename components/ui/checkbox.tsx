import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

/** Visual-only checkbox square — pair with a `Pressable` for the tap target (see `WorkList`)
 * so callers control the accessibility role/state/hit-slop themselves. */
export function Checkbox({ checked }: { checked: boolean }) {
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
