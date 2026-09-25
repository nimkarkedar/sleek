import { ActivityBanner } from '@/components/workspace/activity-banner';
import { DashboardStats } from '@/components/workspace/dashboard-stats';
import {
  DEFAULT_PERIOD,
  PeriodSelector,
  type Period,
} from '@/components/workspace/period-selector';
import { WorkList } from '@/components/workspace/work-list';
import { PlaceholderCard, TabbedPlaceholderPage } from '@/components/workspace/page-tabs';
import { DEMO_MODE, PersonaSwitcher } from '@/components/workspace/persona-switcher';
import { ReportsPage } from '@/components/workspace/reports-page';
import { WorkQueuePage } from '@/components/workspace/transactions-table';
import { CompanyAvatar, WorkspaceSelector } from '@/components/workspace/workspace-selector';
import { Chevron, NavigationIcon } from '@/components/icons/nav-icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { SleekOneLogo } from '@/components/logos/sleek-one-logo';
import {
  buildNav,
  firstNavigableKey,
  getAccessDenial,
  hasDesignedDashboard,
  navigableKeys,
  type NavNode,
} from '@/lib/permissions';
import { DEFAULT_PERSONA_ID, findPersona } from '@/lib/personas';
import { CLIENT_COMPANIES, COMPANIES, type Company, type Scope } from '@/lib/companies';
import { ScrollEndProvider, useScrollEndBus } from '@/lib/scroll-end';
import { CHIP_CLASS, CHIP_HOVER_STYLE, CHIP_STYLE } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { Portal } from '@rn-primitives/portal';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { LifeBuoy, Lock, LogOut, Menu, Settings, UserRound, X } from 'lucide-react-native';
import * as React from 'react';
import {
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
  ScrollView,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

export default function AppShellScreen() {
  const router = useRouter();
  const {
    persona: personaParam,
    currency,
    email,
  } = useLocalSearchParams<{
    persona?: string;
    currency?: string;
    email?: string;
  }>();
  // Set by the login page (and the demo persona switcher); anything missing/unknown opens as
  // the default persona rather than an empty nav.
  const persona = findPersona(personaParam) ?? findPersona(DEFAULT_PERSONA_ID)!;
  const role = persona.role;
  const isAcct = role === 'accountant';

  const [scope, setScope] = React.useState<Scope>({ kind: 'company', companyId: COMPANIES[0].id });
  const [active, setActive] = React.useState('home');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [period, setPeriod] = React.useState<Period>(DEFAULT_PERIOD);
  // Measured, not a guessed pixel constant — the sticky title row's actual height (it varies by
  // font metrics/breakpoint), so pages with their own sticky headers below it (Work Queue's
  // tabs + filter bar) know exactly where to stick without a rendering gap or overlap.
  const [titleRowHeight, setTitleRowHeight] = React.useState(0);
  // Which Work Queue tab to land on — set by whatever navigated here (e.g. the "documents to
  // upload" to-do item wants the Documents tab, not the default Pending transactions one).
  // WorkQueuePage only reads this once, on mount, and it only mounts fresh each time `active`
  // becomes 'work' (it's conditionally rendered, not just hidden) — so there's no risk of a
  // stale tab leaking into a later, unrelated visit to Work Queue as long as every navigation
  // goes through `navigate` below, which always sets this (to a tab, or back to undefined).
  const [workQueueInitialTab, setWorkQueueInitialTab] = React.useState<string | undefined>(
    undefined
  );

  // What this persona can see — every show/hide rule lives in lib/permissions.ts.
  const nav = buildNav(persona.value, { portfolioScope: scope.kind !== 'company' });
  const mainNav = nav.filter((n) => n.placement === 'main');
  const bottomNav = nav.filter((n) => n.placement === 'bottom');
  const isKnownKey = (key: string) => navigableKeys(nav).includes(key);

  const toast = useToast();

  function navigate(targetKey: string, targetTab?: string) {
    // In-page shortcuts (dashboard banner, to-do list) can point at a page or tab this persona
    // can't see — explain why instead of opening it (or silently doing nothing).
    const denial = getAccessDenial(persona.value, nav, targetKey, targetTab);
    if (denial) {
      toast.show({ ...denial, icon: Lock });
      return;
    }
    setActive(targetKey);
    setWorkQueueInitialTab(targetTab);
  }

  // The shell owns the one page-level ScrollView every page's content sits inside — this bus
  // lets a deep-in-the-tree paginated list (e.g. the Work Queue table) subscribe to "near the
  // bottom" without the shell needing to know what "more" means for whatever page is active.
  const { subscribe, notify } = useScrollEndBus();
  const handleScroll = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      if (contentSize.height - (contentOffset.y + layoutMeasurement.height) < 600) notify();
    },
    [notify]
  );

  // The current page can disappear out from under us (persona switch, or dropping to the
  // all-clients scope) — land on the first thing still visible instead of a hidden page.
  React.useEffect(() => {
    if (!isKnownKey(active)) navigate(firstNavigableKey(nav));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona.value, scope.kind]);

  const activeNode = nav.find((n) => n.key === active);
  const activeLabel =
    activeNode?.label ??
    nav
      .filter((n) => n.kind === 'group')
      .flatMap((n) => n.children)
      .find((c) => c.key === active)?.label ??
    'Dashboard';
  const selectedCompany =
    scope.kind === 'company'
      ? (COMPANIES.find((c) => c.id === scope.companyId) ?? COMPANIES[0])
      : undefined;
  const navBadges: Partial<Record<string, number>> = Object.fromEntries(
    nav.map((n) => [n.key, n.badge])
  );

  function setPersona(personaId: string) {
    router.setParams({ persona: personaId });
  }

  function selectNav(key: string) {
    navigate(key);
    setDrawerOpen(false);
  }

  const userMenuProps = {
    name: email || 'User Name',
    subtitle: [persona.label, currency].filter(Boolean).join(' · '),
    // Demo has no session to end — logging out just returns to the login screen.
    onLogout: () => router.replace('/'),
  };

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
          <UserMenu {...userMenuProps} />
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
              <UserMenu {...userMenuProps} />
            </View>
            <NavList
              nav={mainNav}
              bottomNav={bottomNav}
              active={active}
              onSelect={selectNav}
              badges={navBadges}
            />
            {DEMO_MODE && (
              <PersonaSwitcher personaId={persona.value} onPersonaChange={setPersona} />
            )}
            {!isAcct && <PoweredByFooter />}
          </View>
        </Portal>
      )}

      {/* BODY — nav column and content column, both starting right below the top bar so they
          share the same top edge. */}
      <View className="flex-1 flex-row">
        {/* NAV COLUMN — hidden below the md breakpoint; the drawer covers nav on mobile. */}
        <View className="hidden w-[240px] flex-col md:flex">
          <NavList
            nav={mainNav}
            bottomNav={bottomNav}
            active={active}
            onSelect={navigate}
            badges={navBadges}
          />
          {DEMO_MODE && <PersonaSwitcher personaId={persona.value} onPersonaChange={setPersona} />}
          {!isAcct && <PoweredByFooter />}
        </View>

        {/* CONTENT COLUMN */}
        <View className="flex-1">
          {/* Content canvas — a real ScrollView, not a plain View: web body scroll is disabled
              app-wide (see +html.tsx), so anything taller than the viewport needs its own
              scrollable region or it's simply unreachable. Capped width so cards/tables don't
              stretch edge-to-edge on wide monitors; left-aligned to stay under the title
              above rather than floating centered. */}
          <ScrollView
            className="flex-1 bg-[#F4F5FA]"
            contentContainerClassName="items-start"
            onScroll={handleScroll}
            scrollEventThrottle={200}>
            <ScrollEndProvider subscribe={subscribe}>
              {/* Sticky, not a static row above the ScrollView — this is what makes the white
                card visually scroll in underneath the title as the page scrolls, instead of
                the title and canvas just being two independent stacked blocks. Opaque bg is
                required so the card is actually occluded once it scrolls behind this. */}
              <View
                onLayout={(e) => setTitleRowHeight(e.nativeEvent.layout.height)}
                style={{ position: 'sticky', top: 0, zIndex: 10 } as ViewStyle}
                className="w-full bg-[#F4F5FA]">
                {/* Same max-w-[1280px] cap as the content wrapper right below, with a matching
                  right inset (md:pr-4 mirrors the wrapper's own md:p-4) — so on wide viewports,
                  where the white card doesn't stretch to the screen edge, this row's right-hand
                  content lines up with the card's actual right edge instead of drifting out to
                  the true viewport edge past it. */}
                <View className="w-full max-w-[1280px] flex-row items-center justify-between px-6 pb-3 pt-2 md:pb-3 md:pl-8 md:pr-4 md:pt-1">
                  <Text style={TITLE_STYLE} className={TITLE_CLASS}>
                    {activeLabel}
                  </Text>
                </View>
              </View>
              {/* md:pl-8 (not the symmetric md:p-4 this used to be) so every page's white card
                gets its left border at the same 32px inset the title row/tabs already use —
                fixed once here instead of each page individually nudging its own card over to
                compensate. Right side unchanged: md:pr-4 already matched the title row's own
                right inset. */}
              <View className="w-full max-w-[1280px] p-0 pb-16 md:pb-20 md:pl-8 md:pr-4 md:pt-4">
                {/* Dashboard gets the shared padded white "foreground" card — everything else
                  (nav, header) sits on the gray canvas; this is the one surface that pops
                  forward, giving the page a layered look instead of one flat plane. Mobile
                  drops the card chrome (rounding, border, shadow, outer inset) entirely and
                  just runs the white content flush edge to edge — the floating-card look only
                  reads as intentional when there's enough width to show the gray margin around
                  it; on a phone it was just eating space. */}
                {active === 'home' && selectedCompany && (
                  <View className="gap-7 bg-white p-6 md:rounded-3xl md:border md:border-[#E4E4E7] md:p-8 md:shadow-sm md:shadow-black/5">
                    {!hasDesignedDashboard(persona.value) ? (
                      <Text className="py-10 text-center text-sm text-[#656565]">
                        This dashboard is yet to be discussed and designed.
                      </Text>
                    ) : (
                      <>
                        {/* Keyed by company id so switching companies remounts it (resetting its
                      dismissed state and picking new random actions) — nothing else about
                      switching companies would otherwise unmount this component. */}
                        <ActivityBanner
                          key={selectedCompany.id}
                          company={selectedCompany}
                          onNavigate={navigate}
                        />
                        <DashboardStats companyId={selectedCompany.id} />
                        {isAcct && (
                          <WorkList
                            role={role}
                            company={selectedCompany}
                            onNavigate={navigate}
                            showHeading
                          />
                        )}
                      </>
                    )}
                  </View>
                )}
                {/* Work Queue owns its own layout — tabs sit above its white card, not nested
                  inside it, and the card itself gets no padding (the table runs flush) — so it
                  renders directly here rather than sharing Dashboard's padded card wrapper. */}
                {active === 'work' && selectedCompany && activeNode && (
                  <WorkQueuePage
                    company={selectedCompany}
                    tabs={activeNode.children}
                    stickyOffset={titleRowHeight}
                    initialTab={workQueueInitialTab}
                  />
                )}
                {/* Other tabbed destinations (Get Paid, Spend, ...) — the persona's visible tabs
                  over a placeholder, since none of these pages have real content yet. Keyed by
                  page so moving between two tabbed pages starts each on its own first tab. */}
                {active !== 'work' && activeNode?.kind === 'tabs' && (
                  <TabbedPlaceholderPage
                    key={active}
                    tabs={activeNode.children}
                    stickyOffset={titleRowHeight}
                    initialTab={workQueueInitialTab}
                  />
                )}
                {/* Placeholder for every other nav destination (Ledger's sub-items, Clients) —
                  none of these have real content built yet. Without this, landing on one is
                  just a title over empty gray canvas, which reads as "did my click even do
                  anything?" rather than "this page isn't designed yet." */}
                {active === 'ledger-reports' && (
                  <ReportsPage
                    period={period}
                    stickyOffset={titleRowHeight}
                    onNavigate={navigate}
                  />
                )}
                {active !== 'home' &&
                  active !== 'ledger-reports' &&
                  activeNode?.kind !== 'tabs' && <PlaceholderCard title={activeLabel} />}
              </View>
            </ScrollEndProvider>
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
        className={cn('flex-row items-center web:cursor-pointer', compact ? '' : 'px-6 pb-6 pt-6')}>
        {/* 10% up from the original 18/20 — top-left brand mark only, not the footer's. */}
        <SleekOneLogo height={compact ? 20 : 22} />
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
    <View className={cn('flex-row items-center', compact ? 'gap-3' : 'gap-3.5 px-6 pb-6 pt-6')}>
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
    <Link href={{ pathname: '/shell', params: { persona: DEFAULT_PERSONA_ID } }} asChild>
      <Pressable
        accessibilityRole="link"
        className="flex-row items-center justify-between border-t border-[#E4E4E7] px-6 py-4 web:cursor-pointer">
        <Text className="font-plex-semibold text-[10px] uppercase leading-none tracking-wide text-[#656565]">
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
 * overlay so the two never drift out of sync. `bottomNav` (Settings) is pinned below the
 * scrolling list rather than scrolling with it. */
function NavList({
  nav,
  bottomNav = [],
  active,
  onSelect,
  badges,
}: {
  nav: NavNode[];
  bottomNav?: NavNode[];
  active: string;
  onSelect: (key: string) => void;
  badges?: Partial<Record<string, number>>;
}) {
  const allNav = [...nav, ...bottomNav];
  const isGroup = (n: NavNode) => n.kind === 'group';
  // Auto-expand whichever group (if any) contains the active child — otherwise landing
  // directly on "Chart of accounts" would show it selected inside a collapsed, seemingly-empty
  // Ledger section. A plain useState initializer only runs once at mount, so a *later*
  // navigation into a child (e.g. clicking "View details" on the dashboard banner, which
  // jumps straight to Ledger → Adjustments from elsewhere) wouldn't expand it — this needs to
  // re-run whenever `active` changes, not just on first render.
  const [expanded, setExpanded] = React.useState<Set<string>>(
    () =>
      new Set(
        allNav
          .filter((n) => isGroup(n) && n.children.some((c) => c.key === active))
          .map((n) => n.key)
      )
  );

  React.useEffect(() => {
    const parent = allNav.find((n) => isGroup(n) && n.children.some((c) => c.key === active));
    if (parent && !expanded.has(parent.key)) {
      setExpanded((prev) => new Set(prev).add(parent.key));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function toggleExpanded(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function renderItem(item: NavNode) {
    const hasSubItems = isGroup(item);
    const isExpanded = expanded.has(item.key);
    // A group parent reads as "active" whenever one of its children is, even though the
    // parent itself isn't a navigable page.
    const isActive =
      item.key === active || (hasSubItems && item.children.some((c) => c.key === active));
    return (
      <React.Fragment key={item.key}>
        <Pressable
          onPress={() => (hasSubItems ? toggleExpanded(item.key) : onSelect(item.key))}
          className={cn(
            'flex-row items-center gap-3 rounded-lg px-3.5 py-3 web:cursor-pointer',
            // White for the open page (and on hover). A group header whose child is open stays
            // unfilled — the white goes on the open child row instead.
            item.key === active ? 'bg-white' : 'web:hover:bg-white'
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
              isActive ? 'font-plex-semibold text-brand' : 'font-plex-regular text-[#3F3F46]'
            )}>
            {item.label}
          </Text>
          <View className="ml-auto flex-row items-center gap-2">
            {!!badges?.[item.key] && (
              <View className="h-6 min-w-[24px] items-center justify-center rounded-full bg-[#18181B] px-1.5">
                <Text className="font-plex-semibold text-xs text-white">{badges[item.key]}</Text>
              </View>
            )}
            {hasSubItems && (
              <View style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}>
                <Chevron size={16} color="#656565" />
              </View>
            )}
          </View>
        </Pressable>
        {hasSubItems &&
          isExpanded &&
          item.children.map((sub) => {
            const subActive = sub.key === active;
            return (
              <Pressable
                key={sub.key}
                onPress={() => onSelect(sub.key)}
                // Indented past the parent's icon column (18px icon + 12px gap + 14px
                // padding = 44) via inline style, not an arbitrary `pl-[44px]` class — this
                // project's NativeWind setup doesn't compile those reliably.
                style={{ paddingLeft: 44 }}
                className={cn(
                  'rounded-lg py-2.5 pr-3.5 web:cursor-pointer',
                  subActive ? 'bg-white' : 'web:hover:bg-white'
                )}>
                <Text
                  className={cn(
                    'text-sm',
                    subActive ? 'font-plex-semibold text-brand' : 'font-plex-regular text-[#3F3F46]'
                  )}>
                  {sub.label}
                </Text>
              </Pressable>
            );
          })}
      </React.Fragment>
    );
  }

  return (
    <>
      <ScrollView className="flex-1" contentContainerClassName="gap-1 px-4 pb-2">
        {nav.map(renderItem)}
      </ScrollView>
      {bottomNav.length > 0 && <View className="gap-1 px-4 pb-2">{bottomNav.map(renderItem)}</View>}
    </>
  );
}

/** Top-right account chip + menu — kept to the essentials: who you're signed in as, two
 * placeholder account links, and Log out (the only item that does anything in this demo). */
function UserMenu({
  name,
  subtitle,
  onLogout,
}: {
  name: string;
  subtitle: string;
  onLogout: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Pressable
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          accessibilityLabel="Account menu"
          className={CHIP_CLASS}
          style={[CHIP_STYLE, hovered && CHIP_HOVER_STYLE]}>
          {/* Sized via inline style, not a `w-[34px] h-[34px]` class — arbitrary-value Tailwind
              classes don't compile reliably in this project's NativeWind setup, same issue fixed
              elsewhere (see CompanyAvatar). Using the class here made this avatar collapse to its
              text content's natural size instead of a true 34px circle. */}
          <View
            style={{ width: 34, height: 34 }}
            className="items-center justify-center rounded-full bg-[#18181B]">
            <Text className="font-plex-semibold text-xs text-white">{initials(name)}</Text>
          </View>
          <View className="shrink">
            <Text
              numberOfLines={1}
              className="font-plex-semibold text-sm leading-tight text-[#18181B]">
              {name}
            </Text>
            <Text numberOfLines={1} className="text-xs leading-tight text-[#656565]">
              {subtitle}
            </Text>
          </View>
          <Chevron size={16} color="#656565" />
        </Pressable>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-56">
        <DropdownMenuLabel>
          <Text numberOfLines={1} className="font-plex-semibold text-sm text-[#18181B]">
            {name}
          </Text>
          {'\n'}
          <Text numberOfLines={1} className="text-xs text-muted-foreground">
            {subtitle}
          </Text>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Placeholders — no profile, app settings or help pages exist in this prototype yet.
            "App settings" is personal preferences, separate from the sidebar's company-level
            Settings. */}
        <DropdownMenuItem>
          <Icon as={UserRound} size={16} className="text-muted-foreground" />
          <Text>Profile</Text>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Icon as={Settings} size={16} className="text-muted-foreground" />
          <Text>App settings</Text>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Icon as={LifeBuoy} size={16} className="text-muted-foreground" />
          <Text>Help &amp; support</Text>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onPress={onLogout}>
          <Icon as={LogOut} size={16} className="text-muted-foreground" />
          <Text>Log out</Text>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** "jane.doe@acme.com" → "JD"; "User Name" → "UN". */
function initials(name: string): string {
  const words = name
    .split('@')[0]
    .split(/[\s._-]+/)
    .filter(Boolean);
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || 'U';
}
