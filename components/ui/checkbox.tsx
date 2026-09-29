import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

/** Visual-only checkbox square — pair with a `Pressable` for the tap target (see `WorkList`)
 * so callers control the accessibility role/state/hit-slop themselves.
 *
 * `tone="success"` (default) is the to-do list's "done" tick; `tone="primary"` is shadcn's
 * standard form checkbox, for settings and selections. */
export function Checkbox({
  checked,
  tone = 'success',
  size = 'default',
}: {
  checked: boolean;
  tone?: 'success' | 'primary';
  size?: 'default' | 'sm';
}) {
  const filled = tone === 'success' ? 'border-success bg-success' : 'border-primary bg-primary';
  return (
    // The small size is a direct style — arbitrary-value classes (`h-[18px]`) don't compile
    // reliably in this project's NativeWind setup.
    <View
      style={size === 'sm' ? { width: 18, height: 18 } : undefined}
      className={cn(
        'items-center justify-center border-2',
        size === 'sm' ? 'rounded' : 'h-6 w-6 rounded-md',
        checked ? filled : 'border-[#D4D4D8] bg-white'
      )}>
      {checked && (
        <Icon as={Check} size={size === 'sm' ? 12 : 14} strokeWidth={3} className="text-white" />
      )}
    </View>
  );
}

/** A labelled form checkbox — the whole row is the tap target. */
export function CheckboxField({
  checked,
  onCheckedChange,
  label,
  disabled,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Pressable
      onPress={() => onCheckedChange(!checked)}
      disabled={disabled}
      role="checkbox"
      aria-checked={checked}
      accessibilityState={{ checked, disabled }}
      className={cn(
        'flex-row items-center gap-3 self-start web:cursor-pointer',
        disabled && 'opacity-50',
        className
      )}>
      <Checkbox checked={checked} tone="primary" size="sm" />
      <Text className="text-sm text-foreground">{label}</Text>
    </Pressable>
  );
}
