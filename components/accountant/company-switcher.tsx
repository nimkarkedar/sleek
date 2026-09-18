import { Chevron } from '@/components/icons/nav-icons';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { COMPANIES, type Company } from '@/lib/companies';
import { CHIP_CLASS, CHIP_STYLE } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Portal } from '@rn-primitives/portal';
import { Check, Search, X } from 'lucide-react-native';
import * as React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

const ROW_HEIGHT = 52;
const VISIBLE_ROWS = 5;
const PANEL_WIDTH = 320;
/** Matches the `md` Tailwind breakpoint used everywhere else in the shell — below this we're on
 * the mobile layout (top bar + drawer) and the switcher should behave like a native picker. */
const MOBILE_BREAKPOINT = 768;

function CompanyAvatar({ company, size = 34 }: { company: Company; size?: number }) {
  return (
    <View
      style={{ width: size, height: size, backgroundColor: company.logoColor ?? '#18181B' }}
      className="items-center justify-center rounded-lg">
      <Text className="text-xs font-plex-semibold text-white">{company.initial}</Text>
    </View>
  );
}

function CompanyRow({
  company,
  isSelected,
  onPress,
  height = ROW_HEIGHT,
}: {
  company: Company;
  isSelected: boolean;
  onPress: () => void;
  height?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ height }}
      className={cn(
        'flex-row items-center gap-3 rounded-lg px-2 web:cursor-pointer',
        isSelected ? 'bg-[#F0F0F1]' : 'web:hover:bg-[#F5F5F5]'
      )}>
      <CompanyAvatar company={company} size={30} />
      <Text numberOfLines={1} className="flex-1 text-sm font-plex-medium text-[#18181B]">
        {company.name}
      </Text>
      {isSelected && <Icon as={Check} size={16} className="text-brand" />}
    </Pressable>
  );
}

function SearchField({ value, onChangeText }: { value: string; onChangeText: (v: string) => void }) {
  return (
    <View className="flex-row items-center gap-2 rounded-lg bg-[#F4F4F5] px-3 py-2.5">
      <Icon as={Search} size={16} className="text-[#656565]" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search company name..."
        placeholderTextColor="#9A9A9A"
        autoFocus={Platform.OS === 'web'}
        className="flex-1 font-sans text-sm text-[#18181B] web:outline-none"
        style={Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : undefined}
      />
    </View>
  );
}

type CompanySwitcherProps = {
  value: string;
  onChange: (id: string) => void;
  /** Overrides the trigger's width classes — e.g. full-width in the mobile top bar. */
  className?: string;
};

export function CompanySwitcher({ value, onChange, className }: CompanySwitcherProps) {
  const triggerRef = React.useRef<View>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [anchor, setAnchor] = React.useState({ top: 0, left: 0 });
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isMobile = windowWidth < MOBILE_BREAKPOINT;

  const selected = COMPANIES.find((c) => c.id === value) ?? COMPANIES[0];

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMPANIES;
    return COMPANIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  function openPicker() {
    if (isMobile) {
      setOpen(true);
      return;
    }
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ top: y + height + 8, left: x });
      setOpen(true);
    });
  }

  function close() {
    setOpen(false);
    setQuery('');
  }

  function select(company: Company) {
    onChange(company.id);
    close();
  }

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={openPicker}
        style={CHIP_STYLE}
        className={cn(CHIP_CLASS, 'py-2.5', className ?? 'min-w-[320px]')}>
        <CompanyAvatar company={selected} />
        <Text numberOfLines={1} className="flex-1 text-sm font-plex-semibold text-[#18181B]">
          {selected.name}
        </Text>
        <Chevron size={16} color="#656565" />
      </Pressable>

      {open && isMobile && (
        <Portal name="company-switcher-sheet">
          <Pressable
            onPress={close}
            accessibilityLabel="Close company picker"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 40,
              backgroundColor: 'rgba(0,0,0,0.3)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 50,
              maxHeight: windowHeight * 0.85,
            }}
            className="rounded-t-2xl bg-white shadow-lg">
            <View className="items-center pb-2 pt-3">
              <View className="h-1 w-10 rounded-full bg-[#E4E4E7]" />
            </View>
            <View className="flex-row items-center justify-between px-5 pb-3">
              <Text className="text-lg font-plex-semibold text-[#18181B]">Select company</Text>
              <Pressable
                onPress={close}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={8}
                className="web:cursor-pointer">
                <Icon as={X} size={20} className="text-[#656565]" />
              </Pressable>
            </View>
            <View className="px-5 pb-3">
              <SearchField value={query} onChangeText={setQuery} />
            </View>
            <ScrollView contentContainerClassName="gap-0.5 px-3 pb-6" keyboardShouldPersistTaps="handled">
              {filtered.length === 0 ? (
                <Text className="px-3 py-6 text-center text-sm text-[#656565]">
                  No companies found
                </Text>
              ) : (
                filtered.map((company) => (
                  <CompanyRow
                    key={company.id}
                    company={company}
                    isSelected={company.id === value}
                    onPress={() => select(company)}
                    height={56}
                  />
                ))
              )}
            </ScrollView>
          </View>
        </Portal>
      )}

      {open && !isMobile && (
        <Portal name="company-switcher-dropdown">
          <Pressable
            onPress={close}
            accessibilityLabel="Close company switcher"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}
          />
          <View
            style={{
              position: 'absolute',
              top: anchor.top,
              left: anchor.left,
              width: PANEL_WIDTH,
              zIndex: 50,
            }}
            className="rounded-2xl border border-[#E4E4E7] bg-white shadow-lg">
            <View className="mx-3 mb-2 mt-3">
              <SearchField value={query} onChangeText={setQuery} />
            </View>

            <ScrollView
              style={{ maxHeight: ROW_HEIGHT * VISIBLE_ROWS }}
              contentContainerClassName="gap-0.5 px-2 pb-2"
              showsVerticalScrollIndicator>
              {filtered.length === 0 ? (
                <Text className="px-3 py-6 text-center text-sm text-[#656565]">
                  No companies found
                </Text>
              ) : (
                filtered.map((company) => (
                  <CompanyRow
                    key={company.id}
                    company={company}
                    isSelected={company.id === value}
                    onPress={() => select(company)}
                  />
                ))
              )}
            </ScrollView>
          </View>
        </Portal>
      )}
    </>
  );
}
