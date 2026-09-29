import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { CARD_CLASS } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, useWindowDimensions, View, type ViewStyle } from 'react-native';

/** How far below the top of the page scroller the list pins — the height of the sticky page
 * title and tabs above the card, measured by the page that renders the panel. */
export const PanelStickyTop = React.createContext(0);

/**
 * The Reports two-panel layout — one white card, a list on the left and the selected item on the
 * right. Shared by the report viewer, the client report builder and Templates so all three read
 * as the same place.
 *
 * On phones the list either disappears (the viewer — its back link moves above the title) or
 * stacks above the content (the builder and Templates, where the list *is* the navigation).
 */
export function TwoPanel({
  nav,
  children,
  mobileNav = 'hidden',
}: {
  nav: React.ReactNode;
  children: React.ReactNode;
  mobileNav?: 'hidden' | 'stacked';
}) {
  // From md up the list stays in view while a long report or pack scrolls past it, pinned just
  // below the sticky page title and tabs.
  const wide = useWindowDimensions().width >= 768;
  const top = React.useContext(PanelStickyTop);
  const sticky: ViewStyle | undefined = wide
    ? ({ position: 'sticky', top } as ViewStyle)
    : undefined;
  return (
    <View className={cn(CARD_CLASS, 'md:flex-row')}>
      {/* The column carries the divider at full height; only the list inside it is pinned. */}
      <View
        style={{ width: 280 }}
        className={cn(
          'shrink-0 md:border-r md:border-border',
          mobileNav === 'hidden' ? 'hidden md:flex' : 'w-full border-b border-border md:w-auto md:border-b-0'
        )}>
        <View style={sticky} className="w-full gap-1 p-4">
          {nav}
        </View>
      </View>
      <View className="min-w-0 flex-1">{children}</View>
    </View>
  );
}

/** "← All reports" at the top of a panel list. */
export function PanelBackLink({
  label,
  onPress,
  className,
}: {
  label: string;
  onPress: () => void;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      className={cn(
        'flex-row items-center gap-2 self-start rounded-lg px-3 py-2.5 web:cursor-pointer web:hover:bg-muted',
        className
      )}>
      <Icon as={ArrowLeft} size={16} className="text-foreground" />
      <Text className="font-plex-semibold text-base text-foreground">{label}</Text>
    </Pressable>
  );
}

/** A section header — smaller muted text, set apart from the rows by size and colour alone,
 * with a hairline above every section but the first. */
export function PanelNavSection({
  label,
  first,
  children,
}: {
  label: string;
  first?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View className={cn('gap-0.5', first ? 'pt-2' : 'mt-3 border-t border-border pt-5')}>
      <Text className="px-3 pb-2 font-plex-semibold text-xs text-muted-foreground">{label}</Text>
      {children}
    </View>
  );
}

/** A selectable row. The selected row is the one place besides links that uses brand blue. */
export function PanelNavItem({
  label,
  active,
  onPress,
  muted,
  leading,
  trailing,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  /** Dimmed label — e.g. a report that's left out of a pack. */
  muted?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <View
      className={cn(
        'flex-row items-center gap-2 rounded-lg pr-2',
        active ? 'bg-brand-subtle' : 'web:hover:bg-muted'
      )}>
      {leading && <View className="pl-3">{leading}</View>}
      <Pressable
        onPress={onPress}
        accessibilityRole="link"
        accessibilityState={{ selected: active }}
        className={cn('min-w-0 flex-1 py-2.5 web:cursor-pointer', leading ? 'pl-0' : 'pl-3')}>
        <Text
          className={cn(
            'text-base',
            active
              ? 'font-plex-semibold text-brand'
              : cn('font-plex-regular', muted ? 'text-muted-foreground' : 'text-foreground')
          )}>
          {label}
        </Text>
      </Pressable>
      {trailing}
    </View>
  );
}
