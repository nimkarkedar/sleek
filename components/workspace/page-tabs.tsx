import { SegmentedControl, type SegmentedControlOption } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import type { NavChild } from '@/lib/permissions';
import * as React from 'react';
import { View, type ViewStyle } from 'react-native';

/** Tab state for a page whose tabs come from the persona-filtered nav. If the selected tab
 * disappears (persona switch) the page falls back to its first visible tab instead of rendering
 * a tab the persona can't see. */
export function useVisibleTab(tabs: NavChild[], initialTab?: string) {
  const [tab, setTab] = React.useState(() =>
    tabs.some((t) => t.key === initialTab) ? initialTab! : tabs[0]?.key
  );
  const current = tabs.some((t) => t.key === tab) ? tab : tabs[0]?.key;
  return [current, setTab] as const;
}

/** Tabs strip on the gray canvas, sticky right below the page title row. Opaque bg so content
 * scrolling underneath doesn't show through once it's pinned. */
export function PageTabs({
  value,
  onValueChange,
  options,
  stickyOffset,
  onLayoutHeight,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SegmentedControlOption[];
  stickyOffset: number;
  onLayoutHeight?: (height: number) => void;
}) {
  return (
    <View
      onLayout={(e) => onLayoutHeight?.(e.nativeEvent.layout.height)}
      style={{ position: 'sticky', top: stickyOffset, zIndex: 9 } as ViewStyle}
      className="mb-4 bg-[#F4F5FA] px-6 py-1 md:px-0">
      <SegmentedControl value={value} onValueChange={onValueChange} options={options} />
    </View>
  );
}

/** Tabbed destination with no real content yet (Get Paid, Spend, Banking, Files, Settings) —
 * the persona-filtered tabs over the same "not designed yet" card untabbed pages use. */
export function TabbedPlaceholderPage({
  tabs,
  stickyOffset,
  initialTab,
}: {
  tabs: NavChild[];
  stickyOffset: number;
  initialTab?: string;
}) {
  const [tab, setTab] = useVisibleTab(tabs, initialTab);
  const label = tabs.find((t) => t.key === tab)?.label ?? '';
  return (
    <>
      <PageTabs
        value={tab}
        onValueChange={setTab}
        options={tabs.map((t) => ({ value: t.key, label: t.label }))}
        stickyOffset={stickyOffset}
      />
      <PlaceholderCard title={label} />
    </>
  );
}

export function PlaceholderCard({ title }: { title: string }) {
  return (
    <View className="items-center gap-2 bg-white px-6 py-16 md:rounded-3xl md:border md:border-[#E4E4E7] md:shadow-sm md:shadow-black/5">
      <Text className="text-base font-plex-semibold text-[#18181B]">{title}</Text>
      <Text className="text-sm text-[#656565]">This page hasn't been designed yet.</Text>
    </View>
  );
}
