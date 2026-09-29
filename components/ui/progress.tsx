import { cn } from '@/lib/utils';
import * as React from 'react';
import { View } from 'react-native';

/** shadcn Progress — a muted track with a filled bar. `value` is 0–100. */
export function Progress({
  value,
  className,
  indicatorClassName,
}: {
  value: number;
  className?: string;
  indicatorClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}>
      <View
        style={{ width: `${clamped}%` }}
        className={cn('h-full rounded-full bg-primary', indicatorClassName)}
      />
    </View>
  );
}
