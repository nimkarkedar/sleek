import { Icon } from '@/components/ui/icon';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { TintedPill } from '@/components/ui/tinted-pill';
import { useToast } from '@/components/ui/toast';
import {
  ClientReports,
  CURRENT_DRAFT_NAME,
  OPEN_DRAFT_COUNT,
} from '@/components/workspace/client-reports';
import { PageTabs } from '@/components/workspace/page-tabs';
import { DEFAULT_LEDGER_ACCOUNT } from '@/components/workspace/report-data';
import { ReportDetailView, type ReportNavSection } from '@/components/workspace/report-detail';
import { periodRange, type Period } from '@/components/workspace/period-selector';
import { SearchBox } from '@/components/workspace/work-queue-filters';
import { TONE_HEX } from '@/lib/tone';
import { cn } from '@/lib/utils';
import {
  ArrowLeftRight,
  BookOpen,
  Box,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  Clock,
  CreditCard,
  Inbox,
  Landmark,
  Pencil,
  Scale,
  Table2,
  TrendingUp,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------------------------

type StatusTone = 'success' | 'warning' | 'neutral';

const STATUS_TONE: Record<StatusTone, { color: string; icon: LucideIcon }> = {
  success: { color: TONE_HEX.success, icon: Check },
  // Same amber as the Work Queue's "Documents needed" — this app's "needs a look" color.
  warning: { color: '#D97706', icon: CircleAlert },
  neutral: { color: '#656565', icon: Pencil },
};

type Report = {
  key: string;
  name: string;
  icon: LucideIcon;
  /** `range` — covers the selected period; `asAt` — a snapshot at its end date. */
  periodKind: 'range' | 'asAt';
  figure: string;
  caption: string;
  status?: { tone: StatusTone; label: string };
};

type ReportSection = { key: string; label: string; reports: Report[] };

const SECTIONS: ReportSection[] = [
  {
    key: 'financial-statements',
    label: 'Financial statements',
    reports: [
      {
        key: 'profit-and-loss',
        name: 'Profit and loss',
        icon: TrendingUp,
        periodKind: 'range',
        figure: 'S$48,210',
        caption: 'Net profit',
      },
      {
        key: 'balance-sheet',
        name: 'Balance sheet',
        icon: Scale,
        periodKind: 'asAt',
        figure: 'S$126,258',
        caption: 'Net assets',
        status: { tone: 'success', label: 'Balanced' },
      },
      {
        key: 'cash-flow',
        name: 'Cash flow',
        icon: ArrowLeftRight,
        periodKind: 'range',
        figure: 'S$43,225',
        caption: 'Net change in cash',
      },
    ],
  },
  {
    key: 'ledgers-and-checks',
    label: 'Ledgers and checks',
    reports: [
      {
        key: 'trial-balance',
        name: 'Trial balance',
        icon: Table2,
        periodKind: 'asAt',
        figure: 'S$552,945',
        caption: 'Total debits',
        status: { tone: 'success', label: 'Balanced' },
      },
      {
        key: 'general-ledger',
        name: 'General ledger',
        icon: BookOpen,
        periodKind: 'range',
        figure: '1,284',
        caption: 'Entries in 38 accounts',
      },
      {
        key: 'bank-reconciliation',
        name: 'Bank reconciliation summary',
        icon: Landmark,
        periodKind: 'asAt',
        figure: '1 of 2',
        caption: 'Accounts reconciled',
        status: { tone: 'warning', label: '1 to reconcile' },
      },
    ],
  },
  {
    key: 'debtors-and-creditors',
    label: 'Debtors and creditors',
    reports: [
      {
        key: 'aged-receivables',
        name: 'Aged receivables',
        icon: Clock,
        periodKind: 'asAt',
        figure: 'S$34,120',
        caption: 'Outstanding',
        status: { tone: 'warning', label: '2 customers over 60 days' },
      },
      {
        key: 'aged-payables',
        name: 'Aged payables',
        icon: CreditCard,
        periodKind: 'asAt',
        figure: 'S$9,845',
        caption: 'Outstanding',
        status: { tone: 'neutral', label: '3 open bills' },
      },
    ],
  },
  {
    key: 'schedules',
    label: 'Schedules',
    reports: [
      {
        key: 'prepayments',
        name: 'Prepayments',
        icon: CalendarDays,
        periodKind: 'range',
        figure: 'S$6,400',
        caption: 'Closing balance',
      },
      {
        key: 'directors-loan',
        name: "Director's loan",
        icon: UserRound,
        periodKind: 'range',
        figure: 'S$15,000',
        caption: 'Owed to director',
      },
      {
        key: 'share-capital',
        name: 'Share capital',
        icon: Box,
        periodKind: 'asAt',
        figure: 'S$100,000',
        caption: '100,000 ordinary shares',
      },
    ],
  },
];

const ALL_SECTIONS = 'all';
const TOTAL_REPORTS = SECTIONS.reduce((n, s) => n + s.reports.length, 0);

const NAV_SECTIONS: ReportNavSection[] = SECTIONS.map((s) => ({
  key: s.key,
  label: s.label,
  reports: s.reports.map((r) => ({ key: r.key, name: r.name })),
}));

// Fixed column widths shared by the header row and every data row so they line up.
const COL_PERIOD = { width: 200 };
const COL_FIGURE = { width: 190 };
const COL_STATUS = { width: 240 };
const ICON_TILE_STYLE: ViewStyle = { width: 40, height: 40, backgroundColor: '#EEF4FF' };
// Brand blue as a raw color — the `brand` Tailwind token is a CSS var, not usable as a prop.
const BRAND_HEX = '#2D74E4';

function formatPeriod(kind: Report['periodKind'], period: Period): string {
  const { start, end } = periodRange(period);
  const monthYear = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  if (kind === 'range') return `${monthYear(start)} – ${monthYear(end)}`;
  return `As at ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

// ---------------------------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------------------------

export function ReportsPage({
  period,
  stickyOffset,
  onNavigate,
}: {
  period: Period;
  stickyOffset: number;
  /** Shell navigation — for report links that lead elsewhere (customers, suppliers, banking). */
  onNavigate: (targetKey: string, targetTab?: string) => void;
}) {
  const toast = useToast();
  const [tab, setTab] = React.useState('all');
  const [tabsHeight, setTabsHeight] = React.useState(0);
  // Which report's detail view is open (null = the overview list), and which account the
  // General ledger is showing.
  const [openKey, setOpenKey] = React.useState<string | null>(null);
  const [ledgerAccount, setLedgerAccount] = React.useState(DEFAULT_LEDGER_ACCOUNT);
  const [addedToClient, setAddedToClient] = React.useState<Set<string>>(new Set());
  // Lifted here so the overview keeps its filter/search when you come back from a report.
  const [sectionKey, setSectionKey] = React.useState(ALL_SECTIONS);
  const [query, setQuery] = React.useState('');

  const openReport = SECTIONS.flatMap((s) => s.reports).find((r) => r.key === openKey);
  const tabs = [
    { value: 'all', label: 'All reports' },
    {
      value: 'client',
      label: 'Client reports',
      count: OPEN_DRAFT_COUNT,
    },
  ];

  function addToClient(report: Report) {
    setAddedToClient((prev) => new Set(prev).add(report.key));
    toast.show({
      title: 'Added to client report',
      description: `${report.name} was added to the draft "${CURRENT_DRAFT_NAME}".`,
      icon: Check,
    });
  }

  return (
    <>
      <PageTabs
        value={tab}
        onValueChange={setTab}
        options={tabs}
        stickyOffset={stickyOffset}
        onLayoutHeight={setTabsHeight}
      />
      {tab === 'client' ? (
        <ClientReports
          stickyOffset={stickyOffset + tabsHeight}
          draftEdited={addedToClient.size > 0}
        />
      ) : openReport ? (
        <ReportDetailView
          key={openReport.key}
          reportKey={openReport.key}
          reportName={openReport.name}
          sections={NAV_SECTIONS}
          period={period}
          ledgerAccount={ledgerAccount}
          addedToClient={addedToClient.has(openReport.key)}
          onSelectReport={setOpenKey}
          onBack={() => setOpenKey(null)}
          onOpenAccount={(code) => {
            setLedgerAccount(code);
            setOpenKey('general-ledger');
          }}
          onNavigate={onNavigate}
          onAddToClient={() => addToClient(openReport)}
        />
      ) : (
        <AllReports
          period={period}
          stickyOffset={stickyOffset + tabsHeight}
          sectionKey={sectionKey}
          onSectionChange={setSectionKey}
          query={query}
          onQueryChange={setQuery}
          onOpenReport={(report) => setOpenKey(report.key)}
        />
      )}
    </>
  );
}

function AllReports({
  period,
  stickyOffset,
  sectionKey,
  onSectionChange: setSectionKey,
  query,
  onQueryChange: setQuery,
  onOpenReport,
}: {
  period: Period;
  stickyOffset: number;
  sectionKey: string;
  onSectionChange: (key: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onOpenReport: (report: Report) => void;
}) {
  const q = query.trim().toLowerCase();
  const visibleSections = SECTIONS.filter(
    (s) => sectionKey === ALL_SECTIONS || s.key === sectionKey
  )
    .map((s) => ({ ...s, reports: s.reports.filter((r) => r.name.toLowerCase().includes(q)) }))
    .filter((s) => s.reports.length > 0);

  return (
    <View className="bg-white md:rounded-3xl md:border md:border-[#E4E4E7] md:shadow-sm md:shadow-black/5">
      {/* Sticky below the title + tabs, same as the Work Queue filter bar. */}
      <View
        style={{ position: 'sticky', top: stickyOffset, zIndex: 8 } as ViewStyle}
        className="gap-3 border-b border-border bg-white px-6 py-4 md:flex-row md:items-center md:justify-between md:rounded-t-3xl md:px-4">
        <SectionFilter value={sectionKey} onValueChange={setSectionKey} />
        <SearchBox value={query} onChangeText={setQuery} placeholder="Search reports" />
      </View>

      <View className="md:overflow-hidden md:rounded-b-3xl">
        {/* Desktop-only header row, same treatment as the Work Queue table's. */}
        <View className="hidden flex-row items-center gap-4 bg-muted px-4 py-2.5 md:flex">
          <Text className="flex-1 font-plex-semibold text-xs uppercase tracking-wide text-muted-foreground">
            Report
          </Text>
          <Text
            style={COL_PERIOD}
            className="font-plex-semibold text-xs uppercase tracking-wide text-muted-foreground">
            Period
          </Text>
          <Text
            style={COL_FIGURE}
            className="text-right font-plex-semibold text-xs uppercase tracking-wide text-muted-foreground">
            Key figure
          </Text>
          <Text
            style={COL_STATUS}
            className="font-plex-semibold text-xs uppercase tracking-wide text-muted-foreground">
            Status
          </Text>
          <View style={{ width: 16 }} />
        </View>

        {visibleSections.length === 0 ? (
          <View className="items-center gap-2 px-6 py-16">
            <Icon as={Inbox} size={28} className="text-muted-foreground" />
            <Text className="text-sm text-muted-foreground">No reports match your search.</Text>
          </View>
        ) : (
          visibleSections.map((section, sectionIndex) => (
            <View key={section.key}>
              <View
                style={{ backgroundColor: '#FAFAFA' }}
                className={cn(
                  'border-b border-border px-6 py-3 md:px-4',
                  sectionIndex > 0 && 'border-t'
                )}>
                <Text className="font-plex-semibold text-sm text-foreground">{section.label}</Text>
              </View>
              {section.reports.map((report, i) => (
                <ReportRow
                  key={report.key}
                  report={report}
                  period={period}
                  isLast={i === section.reports.length - 1}
                  onPress={() => onOpenReport(report)}
                />
              ))}
            </View>
          ))
        )}
      </View>
    </View>
  );
}

/** shadcn Select, with the trigger showing the current section plus how many reports it holds
 * (e.g. "All sections 11"). */
function SectionFilter({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) {
  const options = [
    { value: ALL_SECTIONS, label: 'All sections', count: TOTAL_REPORTS },
    ...SECTIONS.map((s) => ({ value: s.key, label: s.label, count: s.reports.length })),
  ];
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <Select
      value={{ value: current.value, label: current.label }}
      onValueChange={(o) => o && onValueChange(o.value)}>
      <SelectTrigger aria-label="Filter by section" className="h-10 w-auto self-start sm:h-10">
        <View className="flex-row items-center gap-3 pr-1">
          <Text className="font-plex-semibold text-sm text-foreground">{current.label}</Text>
          <Text className="text-sm text-muted-foreground">{current.count}</Text>
        </View>
      </SelectTrigger>
      <SelectContent align="start" className="w-64">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} label={`${o.label} (${o.count})`} />
        ))}
      </SelectContent>
    </Select>
  );
}

function ReportRow({
  report,
  period,
  isLast,
  onPress,
}: {
  report: Report;
  period: Period;
  isLast: boolean;
  onPress: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  const periodLabel = formatPeriod(report.periodKind, period);
  const status = report.status && (
    <TintedPill
      label={report.status.label}
      icon={STATUS_TONE[report.status.tone].icon}
      color={STATUS_TONE[report.status.tone].color}
    />
  );

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      accessibilityLabel={`Open ${report.name}`}
      style={{ backgroundColor: hovered ? '#FAFAFA' : 'transparent' }}
      className={cn(
        'flex-row items-center gap-4 px-6 py-4 web:cursor-pointer md:px-4',
        !isLast && 'border-b border-border'
      )}>
      <View className="min-w-0 flex-1 flex-row items-center gap-4">
        <View style={ICON_TILE_STYLE} className="items-center justify-center rounded-xl">
          <Icon as={report.icon} size={18} color={BRAND_HEX} />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-base text-foreground" numberOfLines={2}>
            {report.name}
          </Text>
          {/* Mobile folds Period and Status under the name instead of their own columns. */}
          <Text className="text-sm text-muted-foreground md:hidden">{periodLabel}</Text>
          {status && <View className="pt-1 md:hidden">{status}</View>}
        </View>
      </View>
      <Text style={COL_PERIOD} className="hidden text-sm text-muted-foreground md:flex">
        {periodLabel}
      </Text>
      <View className="items-end gap-0.5 md:w-[190px]">
        <Text className="font-plex-semibold text-base text-foreground">{report.figure}</Text>
        <Text className="text-right text-xs text-muted-foreground md:text-sm">
          {report.caption}
        </Text>
      </View>
      <View style={COL_STATUS} className="hidden md:flex">
        {status}
      </View>
      <Icon as={ChevronRight} size={16} className="text-muted-foreground" />
    </Pressable>
  );
}
