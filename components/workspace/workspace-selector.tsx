import { Chevron } from '@/components/icons/nav-icons';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { type Company, type Scope } from '@/lib/companies';
import { CHIP_CLASS, CHIP_HOVER_STYLE, CHIP_STYLE } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Portal } from '@rn-primitives/portal';
import { Check, Search, Users, X } from 'lucide-react-native';
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
 * the mobile layout (top bar + drawer) and the picker should behave like a native bottom sheet. */
const MOBILE_BREAKPOINT = 768;

export function CompanyAvatar({ company, size = 34 }: { company: Company; size?: number }) {
  return (
    <View
      style={{ width: size, height: size, backgroundColor: company.logoColor ?? '#18181B' }}
      className="items-center justify-center rounded-lg">
      <Text className="text-xs font-plex-semibold text-white">{company.initial}</Text>
    </View>
  );
}

function AllClientsAvatar({ size = 34 }: { size?: number }) {
  return (
    <View
      style={{ width: size, height: size, backgroundColor: '#18181B' }}
      className="items-center justify-center rounded-lg">
      <Icon as={Users} size={16} className="text-white" />
    </View>
  );
}

function PickerRow({
  avatar,
  label,
  isSelected,
  onPress,
  height = ROW_HEIGHT,
}: {
  avatar: React.ReactNode;
  label: string;
  isSelected: boolean;
  onPress: () => void;
  height?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ height }}
      className={cn(
        'flex-row items-center gap-3 rounded-lg px-3 web:cursor-pointer',
        isSelected ? 'bg-[#F0F0F1]' : 'web:hover:bg-[#F5F5F5]'
      )}>
      {avatar}
      <Text numberOfLines={1} className="flex-1 text-sm font-plex-medium text-[#18181B]">
        {label}
      </Text>
      {isSelected && <Icon as={Check} size={16} className="text-brand" />}
    </Pressable>
  );
}

function SearchField({ value, onChangeText }: { value: string; onChangeText: (v: string) => void }) {
  return (
    <View className="flex-row items-center gap-2.5 rounded-lg bg-[#F4F4F5] px-3.5 py-3">
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

type WorkspaceSelectorProps = {
  /** The companies this persona can pick from — a client's own (usually just one), or the full
   * accountant roster. */
  companies: Company[];
  scope: Scope;
  onScopeChange: (scope: Scope) => void;
  /** Pins an "All clients" option above the list — accountant only. */
  allowAllClients: boolean;
  /** Overrides the trigger's width classes — e.g. full-width in the mobile top bar. */
  className?: string;
};

export function WorkspaceSelector({
  companies,
  scope,
  onScopeChange,
  allowAllClients,
  className,
}: WorkspaceSelectorProps) {
  const triggerRef = React.useRef<View>(null);
  const [open, setOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [anchor, setAnchor] = React.useState({ top: 0, left: 0 });
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isMobile = windowWidth < MOBILE_BREAKPOINT;

  const selectedCompany =
    scope.kind === 'company' ? companies.find((c) => c.id === scope.companyId) : undefined;

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [companies, query]);

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

  function select(next: Scope) {
    onScopeChange(next);
    close();
  }

  const triggerLabel =
    scope.kind === 'all-clients' ? 'All clients' : (selectedCompany ?? companies[0])?.name;

  const list = (
    <>
      {allowAllClients && (
        <PickerRow
          avatar={<AllClientsAvatar size={30} />}
          label="All clients"
          isSelected={scope.kind === 'all-clients'}
          onPress={() => select({ kind: 'all-clients' })}
          height={isMobile ? 56 : ROW_HEIGHT}
        />
      )}
      {filtered.length === 0 ? (
        <Text className="px-3 py-6 text-center text-sm text-[#656565]">No companies found</Text>
      ) : (
        filtered.map((company) => (
          <PickerRow
            key={company.id}
            avatar={<CompanyAvatar company={company} size={30} />}
            label={company.name}
            isSelected={scope.kind === 'company' && scope.companyId === company.id}
            onPress={() => select({ kind: 'company', companyId: company.id })}
            height={isMobile ? 56 : ROW_HEIGHT}
          />
        ))
      )}
    </>
  );

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={openPicker}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={[CHIP_STYLE, hovered && CHIP_HOVER_STYLE]}
        className={cn(CHIP_CLASS, className)}>
        {scope.kind === 'all-clients' ? (
          <AllClientsAvatar size={34} />
        ) : (
          <CompanyAvatar company={selectedCompany ?? companies[0]} size={34} />
        )}
        <Text numberOfLines={1} className="text-sm font-plex-semibold text-[#18181B]">
          {triggerLabel}
        </Text>
        {/* Pinned to the box's right edge (not just trailing the label) so extra width — e.g.
            the full-width mobile trigger — reads as a normal dropdown, chevron flush right. */}
        <View className="ml-auto">
          <Chevron size={16} color="#656565" />
        </View>
      </Pressable>

      {open && isMobile && (
        <Portal name="workspace-selector-sheet">
          <Pressable
            onPress={close}
            accessibilityLabel="Close workspace picker"
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
            <View className="flex-row items-center justify-between px-6 pb-4">
              <Text className="text-lg font-plex-semibold text-[#18181B]">Switch workspace</Text>
              <Pressable
                onPress={close}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={8}
                className="web:cursor-pointer">
                <Icon as={X} size={20} className="text-[#656565]" />
              </Pressable>
            </View>
            <View className="px-6 pb-4">
              <SearchField value={query} onChangeText={setQuery} />
            </View>
            <ScrollView contentContainerClassName="gap-1 px-4 pb-6" keyboardShouldPersistTaps="handled">
              {list}
            </ScrollView>
          </View>
        </Portal>
      )}

      {open && !isMobile && (
        <Portal name="workspace-selector-dropdown">
          <Pressable
            onPress={close}
            accessibilityLabel="Close workspace picker"
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
            <View className="mx-4 mb-3 mt-4">
              <SearchField value={query} onChangeText={setQuery} />
            </View>

            <ScrollView
              style={{ maxHeight: ROW_HEIGHT * VISIBLE_ROWS }}
              contentContainerClassName="gap-1 px-3 pb-3"
              showsVerticalScrollIndicator>
              {list}
            </ScrollView>
          </View>
        </Portal>
      )}
    </>
  );
}
