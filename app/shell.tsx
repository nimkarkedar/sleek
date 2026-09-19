import { DashboardStats } from '@/components/workspace/dashboard-stats';
import { DEFAULT_PERIOD, PeriodSelector, type Period } from '@/components/workspace/period-selector';
import { WorkList } from '@/components/workspace/work-list';
import { CompanyAvatar, WorkspaceSelector } from '@/components/workspace/workspace-selector';
import { Chevron, NavigationIcon, type NavIconName } from '@/components/icons/nav-icons';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { SleekOneLogo } from '@/components/logos/sleek-one-logo';
import { CLIENT_COMPANIES, COMPANIES, type Company, type Scope } from '@/lib/companies';
import { CHIP_CLASS, CHIP_HOVER_STYLE, CHIP_STYLE } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Portal } from '@rn-primitives/portal';
import { Link, useLocalSearchParams } from 'expo-router';
import { Menu, X } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View, type TextStyle, type ViewStyle } from 'react-native';

type NavItem = {
  key: string;
  label: string;
  icon: NavIconName;
  /** Only ever visible to accountants. */
  accountantOnly?: boolean;
  /** Hidden at the "all clients" portfolio scope — these are per-company modules. */
  companyScoped?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Dashboard', icon: 'home' },
  { key: 'work', label: 'Work Queue', icon: 'workqueue' },
  { key: 'clients', label: 'Clients', icon: 'clients', accountantOnly: true },
  { key: 'getpaid', label: 'Get Paid', icon: 'getpaid', companyScoped: true },
  { key: 'spend', label: 'Spend', icon: 'spend', companyScoped: true },
  { key: 'banking', label: 'Banking', icon: 'banking', companyScoped: true },
  { key: 'books', label: 'Books', icon: 'books', companyScoped: true },
  { key: 'reports', label: 'Reports', icon: 'reports', companyScoped: true },
];

export default function AppShellScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const role: 'client' | 'accountant' = mode === 'accountant' ? 'accountant' : 'client';
  const isAcct = role === 'accountant';

  const [scope, setScope] = React.useState<Scope>({ kind: 'company', companyId: COMPANIES[0].id });
  const [active, setActive] = React.useState('home');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [period, setPeriod] = React.useState<Period>(DEFAULT_PERIOD);

  const nav = NAV_ITEMS.filter(
    (item) =>
      (!item.accountantOnly || isAcct) && (!item.companyScoped || scope.kind === 'company')
  );

  React.useEffect(() => {
    if (!nav.some((n) => n.key === active)) setActive('home');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAcct, scope.kind]);

  const activeLabel = nav.find((n) => n.key === active)?.label ?? 'Dashboard';
  const selectedCompany =
    scope.kind === 'company' ? (COMPANIES.find((c) => c.id === scope.companyId) ?? COMPANIES[0]) : undefined;
  const navBadges: Partial<Record<string, number>> | undefined =
    selectedCompany && isAcct ? { work: selectedCompany.workQueueCount } : undefined;

  function selectNav(key: string) {
    setActive(key);
    setDrawerOpen(false);
  }

  const selectorProps = {
    companies: isAcct ? COMPANIES : CLIENT_COMPANIES,
    scope,
    onScopeChange: setScope,
    allowAllClients: isAcct,
  };

  return (
    <View className="flex-1 bg-[#F4F5FA]">
      {/* DESKTOP TOP BAR — spans both columns below, so the brand sits above the nav column and
          the switcher/user menu sit above the content column, both starting at the same y as
          their column. Hidden below the md breakpoint in favor of the mobile top bar. */}
      <View className="hidden flex-row items-center md:flex">
        <View className="w-[240px] shrink-0">
          {isAcct ? <Brand /> : <CompanyBrand company={selectedCompany!} />}
        </View>
        <View className="flex-1 flex-row items-center justify-between px-8 py-5">
          <View className="flex-row items-center gap-3">
            {isAcct && (
              <>
                <WorkspaceSelector {...selectorProps} />
                <Text className="text-sm text-[#656565]">for</Text>
              </>
            )}
            <PeriodSelector period={period} onPeriodChange={setPeriod} />
          </View>
          <UserMenu />
        </View>
      </View>

      {/* MOBILE TOP BAR — replaces the desktop top bar below the md breakpoint. User menu lives
          in the drawer instead of its own row here — three stacked rows (brand/hamburger, user
          menu, switcher) before the page title even starts was too much. */}
      <View className="flex bg-[#F4F5FA] md:hidden">
        <View className="flex-row items-center justify-between px-6 py-5">
          {isAcct ? <Brand compact /> : <CompanyBrand company={selectedCompany!} compact />}
          <Pressable
            onPress={() => setDrawerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Open navigation menu"
            hitSlop={8}
            className="web:cursor-pointer">
            <Icon as={Menu} size={22} className="text-[#18181B]" />
          </Pressable>
        </View>
        <View className="gap-2 px-6 pb-3">
          {isAcct && <WorkspaceSelector {...selectorProps} className="w-full" />}
          <PeriodSelector period={period} onPeriodChange={setPeriod} className="w-full" />
        </View>
      </View>

      {/* MOBILE DRAWER — user menu + nav list; brand + switcher are already visible in the top bar */}
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
            className="flex-col bg-[#F4F5FA]">
            <View className="flex-row items-center justify-end px-6 pt-6">
              <Pressable
                onPress={() => setDrawerOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close navigation menu"
                hitSlop={8}
                className="web:cursor-pointer">
                <Icon as={X} size={22} className="text-[#18181B]" />
              </Pressable>
            </View>
            <View className="px-6 pb-4">
              <UserMenu />
            </View>
            <NavList nav={nav} active={active} onSelect={selectNav} badges={navBadges} />
            {!isAcct && <PoweredByFooter />}
          </View>
        </Portal>
      )}

      {/* BODY — nav column and content column, both starting right below the top bar so they
          share the same top edge. */}
      <View className="flex-1 flex-row">
        {/* NAV COLUMN — hidden below the md breakpoint; the drawer covers nav on mobile. */}
        <View className="hidden w-[240px] flex-col md:flex">
          <NavList nav={nav} active={active} onSelect={setActive} badges={navBadges} />
          {!isAcct && <PoweredByFooter />}
        </View>

        {/* CONTENT COLUMN */}
        <View className="flex-1">
          {/* Content canvas — a real ScrollView, not a plain View: web body scroll is disabled
              app-wide (see +html.tsx), so anything taller than the viewport needs its own
              scrollable region or it's simply unreachable. Capped width so cards/tables don't
              stretch edge-to-edge on wide monitors; left-aligned to stay under the title
              above rather than floating centered. */}
          <ScrollView className="flex-1 bg-[#F4F5FA]" contentContainerClassName="items-start">
            {/* Sticky, not a static row above the ScrollView — this is what makes the white
                card visually scroll in underneath the title as the page scrolls, instead of
                the title and canvas just being two independent stacked blocks. Opaque bg is
                required so the card is actually occluded once it scrolls behind this. */}
            <View
              style={{ position: 'sticky', top: 0, zIndex: 10 } as ViewStyle}
              className="w-full bg-[#F4F5FA] px-6 pb-3 pt-2 md:px-8 md:pb-3 md:pt-1">
              <Text style={TITLE_STYLE} className={TITLE_CLASS}>
                {activeLabel}
              </Text>
            </View>
            <View className="w-full max-w-[1280px] p-3 md:p-4">
              {/* The white "foreground" card — everything else (nav, header) sits on the gray
                  canvas; this is the one surface that pops forward, giving the page a layered
                  look instead of one flat plane. */}
              <View className="gap-7 rounded-3xl border border-[#E4E4E7] bg-white p-6 shadow-sm shadow-black/5 md:p-8">
                {/* Dashboard is the only page with real content right now — Work Queue, Clients,
                    and the all-clients portfolio views are all empty on purpose, awaiting design. */}
                {active === 'home' && selectedCompany && (
                  <>
                    <DashboardStats companyId={selectedCompany.id} />
                    {isAcct && (
                      <WorkList
                        role={role}
                        company={selectedCompany}
                        onNavigate={setActive}
                        showHeading
                      />
                    )}
                  </>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const TITLE_CLASS = 'font-plex-bold tracking-tight text-[#18181B]';
// 1.8rem — arbitrary-value Tailwind classes (`text-[1.8rem]`) don't compile reliably in this
// project's NativeWind setup, so the size is set directly via style instead.
const TITLE_STYLE: TextStyle = { fontSize: 28.8 };

function Brand({ compact }: { compact?: boolean }) {
  return (
    <Link href="/" asChild>
      <Pressable
        className={cn(
          'flex-row items-center web:cursor-pointer',
          compact ? '' : 'px-6 pt-6 pb-6'
        )}>
        <SleekOneLogo height={compact ? 18 : 20} />
      </Pressable>
    </Link>
  );
}

/** Client's workspace anchor — a company only ever has itself in scope, so there's nothing to
 * switch to. Rendered as a static identity row (no chevron, no press state), not a dropdown, so
 * it doesn't imply an affordance that isn't there. Replaces the Sleek wordmark for this persona:
 * the company is the brand the client recognizes, not Sleek. */
function CompanyBrand({ company, compact }: { company: Company; compact?: boolean }) {
  return (
    <View
      className={cn(
        'flex-row items-center',
        compact ? 'gap-3' : 'gap-3.5 px-6 pt-6 pb-6'
      )}>
      <CompanyAvatar company={company} size={compact ? 28 : 34} />
      <Text
        numberOfLines={1}
        className={cn('font-plex-bold text-[#18181B]', compact ? 'text-base' : 'text-lg')}>
        {company.name}
      </Text>
    </View>
  );
}

/** Client-only sidebar footer — Sleek is the underlying software, not the company's own brand,
 * so it stays a quiet attribution (light, bordered, same weight as the nav) rather than a loud
 * blue block competing with the rest of the sidebar. Demo-only: the logo doubles as a shortcut
 * into Sleek accountant mode, since this prototype has no real auth/account-switching to hang
 * that jump off of. */
function PoweredByFooter() {
  return (
    <Link href={{ pathname: '/shell', params: { mode: 'accountant' } }} asChild>
      <Pressable
        accessibilityRole="link"
        className="flex-row items-center justify-between border-t border-[#E4E4E7] px-6 py-4 web:cursor-pointer">
        <Text className="text-[10px] font-plex-semibold uppercase leading-none tracking-wide text-[#656565]">
          Powered by
        </Text>
        {/* The wordmark's viewBox includes a smile flourish that hangs well below the letters'
            own baseline, so box-centering the whole SVG against the caption makes the letters
            read as sitting too high. Nudge down so the letter baseline (not the full bounding
            box) lines up with the caption's. */}
        <View style={{ transform: [{ translateY: 2 }] }}>
          <SleekOneLogo height={16} />
        </View>
      </Pressable>
    </Link>
  );
}

/** Nav item list — rendered by both the persistent desktop sidebar and the mobile drawer
 * overlay so the two never drift out of sync. */
function NavList({
  nav,
  active,
  onSelect,
  badges,
}: {
  nav: NavItem[];
  active: string;
  onSelect: (key: string) => void;
  badges?: Partial<Record<string, number>>;
}) {
  return (
    <ScrollView className="flex-1" contentContainerClassName="gap-1 px-4 pb-2">
      {nav.map((item) => {
        const isActive = item.key === active;
        return (
          <Pressable
            key={item.key}
            onPress={() => onSelect(item.key)}
            className={cn(
              'flex-row items-center gap-3 rounded-lg px-3.5 py-3 web:cursor-pointer',
              !isActive && 'web:hover:bg-[#F1F1F2]'
            )}>
            <NavigationIcon
              name={item.icon}
              size={18}
              color={isActive ? '#2D74E4' : '#3F3F46'}
              filled={isActive}
            />
            <Text
              className={cn(
                'text-base',
                isActive ? 'font-plex-bold text-brand' : 'font-plex-medium text-[#3F3F46]'
              )}>
              {item.label}
            </Text>
            {!!badges?.[item.key] && (
              <View className="ml-auto h-6 min-w-[24px] items-center justify-center rounded-full bg-[#18181B] px-1.5">
                <Text className="text-xs font-plex-bold text-white">{badges[item.key]}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function UserMenu() {
  const [hovered, setHovered] = React.useState(false);
  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      className={CHIP_CLASS}
      style={[CHIP_STYLE, hovered && CHIP_HOVER_STYLE]}>
      {/* Sized via inline style, not a `w-[34px] h-[34px]` class — arbitrary-value Tailwind
          classes don't compile reliably in this project's NativeWind setup, same issue fixed
          elsewhere (see CompanyAvatar). Using the class here made this avatar collapse to its
          text content's natural size instead of a true 34px circle. */}
      <View
        style={{ width: 34, height: 34 }}
        className="items-center justify-center rounded-full bg-[#18181B]">
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
