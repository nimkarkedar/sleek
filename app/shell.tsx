import { CompanySwitcher } from '@/components/accountant/company-switcher';
import { DashboardStats } from '@/components/accountant/dashboard-stats';
import { DashboardTodos } from '@/components/accountant/dashboard-todos';
import { Chevron, NavigationIcon, type NavIconName } from '@/components/icons/nav-icons';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { SleekLogo } from '@/components/logos/sleek-logo';
import { SleekOneLogo } from '@/components/logos/sleek-one-logo';
import { COMPANIES, formatLastVisited } from '@/lib/companies';
import { CHIP_CLASS, CHIP_STYLE } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Portal } from '@rn-primitives/portal';
import { Link, useLocalSearchParams } from 'expo-router';
import { Menu, X } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

type NavItem = { key: string; label: string; icon: NavIconName };

const NAV_CLIENT: NavItem[] = [
  { key: 'home', label: 'Dashboard', icon: 'home' },
  { key: 'getpaid', label: 'Get Paid', icon: 'getpaid' },
  { key: 'spend', label: 'Spend', icon: 'spend' },
  { key: 'banking', label: 'Banking', icon: 'banking' },
  { key: 'books', label: 'Books', icon: 'books' },
  { key: 'reports', label: 'Reports', icon: 'reports' },
];

const NAV_ACCOUNTANT: NavItem[] = [
  { key: 'home', label: 'Dashboard', icon: 'home' },
  { key: 'workqueue', label: 'Work Queue', icon: 'workqueue' },
  { key: 'clients', label: 'Clients', icon: 'clients' },
  { key: 'banking', label: 'Banking', icon: 'banking' },
  { key: 'books', label: 'Books', icon: 'books' },
  { key: 'reports', label: 'Reports', icon: 'reports' },
];

export default function AppShellScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isAcct = mode === 'accountant';
  const nav = isAcct ? NAV_ACCOUNTANT : NAV_CLIENT;

  const [active, setActive] = React.useState(nav[0].key);
  const [selectedCompanyId, setSelectedCompanyId] = React.useState(COMPANIES[0].id);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    if (!nav.some((n) => n.key === active)) setActive(nav[0].key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAcct]);

  const activeLabel = nav.find((n) => n.key === active)?.label ?? nav[0].label;
  const selectedCompany = COMPANIES.find((c) => c.id === selectedCompanyId) ?? COMPANIES[0];
  const isAcctDashboard = isAcct && active === 'home';
  // Work Queue's count is per-client — swapping companies in the switcher updates it live.
  const navBadges: Partial<Record<string, number>> | undefined = isAcct
    ? { workqueue: selectedCompany.workQueueCount }
    : undefined;

  function selectNav(key: string) {
    setActive(key);
    setDrawerOpen(false);
  }

  return (
    <View className="flex-1 bg-background md:flex-row">
      {/* DESKTOP SIDEBAR — locked as-is, hidden below the md breakpoint */}
      <View
        className={cn(
          'hidden h-full w-[248px] flex-col border-r md:flex',
          isAcct ? 'bg-brand border-white/[0.16]' : 'border-[#E4E4E7] bg-[#FAFAFA]'
        )}>
        <SidebarNav
          isAcct={isAcct}
          nav={nav}
          active={active}
          onSelect={setActive}
          badges={navBadges}
        />
      </View>

      {/* MOBILE TOP BAR — replaces the sidebar below the md breakpoint */}
      <View className={cn('flex md:hidden', isAcct ? 'bg-brand' : 'bg-[#FAFAFA]')}>
        <View className="flex-row items-center justify-between px-5 py-4">
          <Link href="/" asChild>
            <Pressable className="flex-row items-center gap-2.5 web:cursor-pointer">
              {isAcct ? (
                <SleekOneLogo height={24} />
              ) : (
                <>
                  <View className="h-7 w-7 items-center justify-center rounded-md bg-[#18181B]">
                    <Text className="text-xs font-plex-semibold text-white">C</Text>
                  </View>
                  <Text className="text-base font-plex-semibold text-[#18181B]">
                    Company name
                  </Text>
                </>
              )}
            </Pressable>
          </Link>
          <Pressable
            onPress={() => setDrawerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Open navigation menu"
            hitSlop={8}
            className="web:cursor-pointer">
            <Icon as={Menu} size={22} className={isAcct ? 'text-white' : 'text-[#18181B]'} />
          </Pressable>
        </View>
        {isAcct && (
          <View className="px-5 pb-4">
            <CompanySwitcher
              value={selectedCompanyId}
              onChange={setSelectedCompanyId}
              className="w-full"
            />
          </View>
        )}
      </View>

      {/* MOBILE DRAWER — same nav content as the desktop sidebar, as a dismissable overlay */}
      {drawerOpen && (
        <Portal name="mobile-nav-drawer">
          <Pressable
            onPress={() => setDrawerOpen(false)}
            accessibilityLabel="Close navigation menu"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 60,
              backgroundColor: 'rgba(0,0,0,0.3)',
            }}
          />
          <View
            style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 280, zIndex: 61 }}
            className={cn('flex-col', isAcct ? 'bg-brand' : 'bg-[#FAFAFA]')}>
            <View className="flex-row items-center justify-end px-5 pt-5">
              <Pressable
                onPress={() => setDrawerOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close navigation menu"
                hitSlop={8}
                className="web:cursor-pointer">
                <Icon as={X} size={22} className={isAcct ? 'text-white' : 'text-[#18181B]'} />
              </Pressable>
            </View>
            <SidebarNav
              isAcct={isAcct}
              nav={nav}
              active={active}
              onSelect={selectNav}
              badges={navBadges}
            />
          </View>
        </Portal>
      )}

      {/* MAIN */}
      <View className="flex-1 bg-background">
        {/* Header row — company switcher/title + user menu — desktop only, unchanged */}
        <View
          className={cn(
            'hidden flex-row items-center justify-between px-7 md:flex',
            isAcct ? 'py-5' : 'h-[72px]',
            !isAcct && 'border-b border-[#E4E4E7]'
          )}>
          {isAcct ? (
            <CompanySwitcher value={selectedCompanyId} onChange={setSelectedCompanyId} />
          ) : (
            <Text className={TITLE_CLASS}>{activeLabel}</Text>
          )}
          <UserMenu />
        </View>

        {/* Title row — always shown for accountant (desktop + mobile); for client, desktop
            already shows the title inline in the row above, so this is mobile-only there */}
        <View
          className={cn(
            'border-b border-[#E4E4E7] px-5 py-5 md:px-7',
            !isAcct && 'md:hidden'
          )}>
          <Text className={TITLE_CLASS}>{activeLabel}</Text>
          {isAcctDashboard && (
            <Text className="mt-1 text-sm text-[#656565]">
              {formatLastVisited(selectedCompany.lastVisitedDaysAgo)}
            </Text>
          )}
        </View>

        {/* Content canvas — a real ScrollView, not a plain View: web body scroll is disabled
            app-wide (see +html.tsx), so anything taller than the viewport needs its own
            scrollable region or it's simply unreachable. Capped width so cards/tables don't
            stretch edge-to-edge on wide monitors; left-aligned to stay under the title/chips
            above rather than floating centered. */}
        <ScrollView className="flex-1 bg-background" contentContainerClassName="items-start">
          <View className="w-full max-w-[1280px] gap-6 p-5 md:p-6">
            {isAcctDashboard && (
              <>
                <DashboardStats />
                <DashboardTodos onNavigate={setActive} />
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const TITLE_CLASS = 'text-2xl font-plex-bold tracking-tight text-[#18181B]';

/** Brand link + nav list + footer — rendered by both the persistent desktop sidebar and the
 * mobile drawer overlay so the two never drift out of sync. */
function SidebarNav({
  isAcct,
  nav,
  active,
  onSelect,
  badges,
}: {
  isAcct: boolean;
  nav: NavItem[];
  active: string;
  onSelect: (key: string) => void;
  badges?: Partial<Record<string, number>>;
}) {
  return (
    <>
      <Link href="/" asChild>
        <Pressable className="flex-row items-center gap-2.5 px-5 pt-5 pb-[18px] web:cursor-pointer">
          {isAcct ? (
            <SleekOneLogo height={26} />
          ) : (
            <>
              <View className="h-[30px] w-[30px] items-center justify-center rounded-md bg-[#18181B]">
                <Text className="text-xs font-plex-semibold text-white">C</Text>
              </View>
              <Text numberOfLines={1} className="flex-1 text-base font-plex-semibold text-[#18181B]">
                Company name
              </Text>
            </>
          )}
        </Pressable>
      </Link>

      <ScrollView className="flex-1" contentContainerClassName="gap-0.5 px-3 py-1">
        {nav.map((item) => {
          const isActive = item.key === active;
          return (
            <Pressable
              key={item.key}
              onPress={() => onSelect(item.key)}
              className={cn(
                'flex-row items-center gap-3 rounded-lg px-3 py-[9px] web:cursor-pointer',
                isActive
                  ? isAcct
                    ? 'bg-white/[0.18]'
                    : 'bg-[#EDEDEF]'
                  : isAcct
                    ? 'web:hover:bg-white/10'
                    : 'web:hover:bg-[#F1F1F2]'
              )}>
              <NavigationIcon
                name={item.icon}
                size={18}
                color={
                  isActive
                    ? isAcct
                      ? '#FFFFFF'
                      : '#18181B'
                    : isAcct
                      ? 'rgba(255,255,255,0.85)'
                      : '#3F3F46'
                }
              />
              <Text
                className={cn(
                  'text-sm',
                  isActive ? 'font-plex-semibold' : 'font-plex-medium',
                  isActive
                    ? isAcct
                      ? 'text-white'
                      : 'text-[#18181B]'
                    : isAcct
                      ? 'text-white/85'
                      : 'text-[#3F3F46]'
                )}>
                {item.label}
              </Text>
              {!!badges?.[item.key] && (
                <View className="ml-auto h-6 min-w-[24px] items-center justify-center rounded-full bg-white px-1.5">
                  <Text className="text-xs font-plex-bold text-[#18181B]">{badges[item.key]}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {!isAcct && (
        <View className="flex-row items-center gap-2 border-t border-[#E4E4E7] px-5 py-3.5">
          <Text className="text-[10px] font-plex-semibold uppercase tracking-wide text-[#656565]">
            Powered by
          </Text>
          <SleekLogo height={13} />
        </View>
      )}
    </>
  );
}

function UserMenu() {
  return (
    <Pressable className={CHIP_CLASS} style={CHIP_STYLE}>
      <View className="h-[34px] w-[34px] items-center justify-center rounded-full bg-[#18181B]">
        <Text className="text-xs font-plex-semibold text-white">UN</Text>
      </View>
      <View>
        <Text className="text-sm font-plex-semibold leading-tight text-[#18181B]">User Name</Text>
        <Text className="text-xs leading-tight text-[#656565]">Profile of the user</Text>
      </View>
      <Chevron size={16} color="#656565" />
    </Pressable>
  );
}
