import { AttentionRing } from '@/components/ui/attention-ring';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { TintedPill } from '@/components/ui/tinted-pill';
import { useToast } from '@/components/ui/toast';
import { ClientReportBuilder } from '@/components/workspace/client-report-builder';
import {
  clientReportName,
  defaultTemplates,
  newClientReport,
  seedClientReports,
  seedTemplates,
  type ClientReport,
  type ClientReportType,
  type ReportPeriod,
  type TemplatePage,
  type Templates,
} from '@/components/workspace/client-report-data';
import { ClientReports, CountSelect, latestFor } from '@/components/workspace/client-reports';
import { PageTabs } from '@/components/workspace/page-tabs';
import { PanelStickyTop } from '@/components/workspace/panel-nav';
import { periodRange, type Period } from '@/components/workspace/period-selector';
import {
  DEFAULT_LEDGER_ACCOUNT,
  REPORT_SECTIONS,
  type ReportMeta,
  type Tone,
} from '@/components/workspace/report-data';
import { ReportDetailView, type ReportNavSection } from '@/components/workspace/report-detail';
import { TemplatesPage } from '@/components/workspace/templates-page';
import { SearchBox } from '@/components/workspace/work-queue-filters';
import type { Company } from '@/lib/companies';
import { BRAND_HEX, MUTED_HEX, TONE_HEX, WARNING_HEX } from '@/lib/tone';
import { CARD_CLASS } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import {
  Check,
  ChevronRight,
  CircleAlert,
  Inbox,
  Pencil,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

const STATUS_TONE: Record<Tone, { color: string; icon: LucideIcon }> = {
  success: { color: TONE_HEX.success, icon: Check },
  warning: { color: WARNING_HEX, icon: CircleAlert },
  neutral: { color: MUTED_HEX, icon: Pencil },
};

const ALL_SECTIONS = 'all';
const TOTAL_REPORTS = REPORT_SECTIONS.reduce((n, s) => n + s.reports.length, 0);

const NAV_SECTIONS: ReportNavSection[] = REPORT_SECTIONS.map((s) => ({
  key: s.key,
  label: s.label,
  reports: s.reports.map((r) => ({ key: r.key, name: r.name })),
}));

// Fixed column widths shared by the header row and every data row so they line up.
const COL_PERIOD = { width: 200 };
const COL_FIGURE = { width: 190 };
const COL_STATUS = { width: 240 };

function formatPeriod(kind: ReportMeta['periodKind'], period: Period): string {
  const { start, end } = periodRange(period);
  const monthYear = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  if (kind === 'range') return `${monthYear(start)} – ${monthYear(end)}`;
  return `As at ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

type Tab = 'all' | 'client' | 'templates';
type ClientData = { templates: Templates | null; reports: ClientReport[] };

/** Asks before leaving with unsaved template changes. Returns true when it has taken over — it
 * calls `proceed` itself once the user decides. The shell calls this before switching entity or
 * page. */
export type LeaveGuard = (proceed: () => void) => boolean;

// ---------------------------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------------------------

export function ReportsPage({
  company,
  period,
  stickyOffset,
  onNavigate,
  leaveGuardRef,
}: {
  company: Company;
  period: Period;
  stickyOffset: number;
  /** Shell navigation — for report links that lead elsewhere (customers, suppliers, banking). */
  onNavigate: (targetKey: string, targetTab?: string) => void;
  leaveGuardRef: React.MutableRefObject<LeaveGuard | null>;
}) {
  const toast = useToast();
  const [tab, setTab] = React.useState<Tab>('all');
  const [tabsHeight, setTabsHeight] = React.useState(0);

  // Templates and client reports per client — each client keeps its own while you switch.
  const [store, setStore] = React.useState<Record<string, ClientData>>({});
  const seeded = React.useMemo<ClientData>(() => {
    const templates = seedTemplates(company);
    return { templates, reports: seedClientReports(company, templates) };
  }, [company]);
  const data = store[company.id] ?? seeded;
  const update = (fn: (d: ClientData) => ClientData) =>
    setStore((prev) => ({ ...prev, [company.id]: fn(prev[company.id] ?? seeded) }));

  // All reports: which report's viewer is open (null = the list), and which account the
  // General ledger shows. Filter/search are lifted here so they survive opening a report.
  const [openKey, setOpenKey] = React.useState<string | null>(null);
  const [ledgerAccount, setLedgerAccount] = React.useState(DEFAULT_LEDGER_ACCOUNT);
  const [sectionKey, setSectionKey] = React.useState(ALL_SECTIONS);
  const [query, setQuery] = React.useState('');

  // Client reports: the open report, if any.
  const [openClientId, setOpenClientId] = React.useState<string | null>(null);

  // Templates: the page shown, the report a fix link came from, and the edits in progress.
  const [templatePage, setTemplatePage] = React.useState<TemplatePage>('ma-general');
  const [returnToId, setReturnToId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<{ companyId: string; templates: Templates } | null>(
    null
  );
  const [pendingLeave, setPendingLeave] = React.useState<(() => void) | null>(null);

  const baseline = React.useMemo(
    () => data.templates ?? defaultTemplates(company),
    [data.templates, company]
  );
  const editing = draft?.companyId === company.id ? draft.templates : baseline;
  const firstRun = !data.templates;
  const dirty = tab === 'templates' && JSON.stringify(editing) !== JSON.stringify(baseline);

  // A different client's reports are a different list — close whatever was open.
  React.useEffect(() => {
    setOpenClientId(null);
    setReturnToId(null);
  }, [company.id]);

  const guard: LeaveGuard = (proceed) => {
    if (!dirty) return false;
    setPendingLeave(() => proceed);
    return true;
  };
  React.useEffect(() => {
    leaveGuardRef.current = guard;
  });
  React.useEffect(
    () => () => {
      leaveGuardRef.current = null;
    },
    [leaveGuardRef]
  );

  /** Every way out of Templates inside Reports goes through here. */
  function leave(proceed: () => void) {
    if (!guard(proceed)) proceed();
  }

  function openTemplates(page: TemplatePage, returnId: string | null = null) {
    setDraft({ companyId: company.id, templates: baseline });
    setTemplatePage(page);
    setReturnToId(returnId);
    setTab('templates');
  }

  function saveTemplates(): boolean {
    const wasFirstRun = firstRun;
    update((d) => ({ ...d, templates: editing }));
    setDraft({ companyId: company.id, templates: editing });
    return wasFirstRun;
  }

  function selectTab(next: Tab) {
    if (next === tab) {
      // Tapping the current tab returns to its list.
      if (next === 'all') setOpenKey(null);
      if (next === 'client') setOpenClientId(null);
      return;
    }
    if (next === 'templates') {
      openTemplates(templatePage);
      return;
    }
    leave(() => setTab(next));
  }

  // --- Client reports ------------------------------------------------------------------------

  const draftCount = data.reports.filter((r) => r.status === 'draft').length;
  const openClient = data.reports.find((r) => r.id === openClientId);
  const returnReport = data.reports.find((r) => r.id === returnToId);

  function patchReport(id: string, patch: Partial<ClientReport>) {
    update((d) => ({ ...d, reports: d.reports.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  }

  function createReport(type: ClientReportType, period: ReportPeriod) {
    const templates = data.templates;
    if (!templates) return;
    const existing = latestFor(data.reports, type, period);
    const report = newClientReport(
      type,
      period,
      templates,
      existing ? existing.version + 1 : 1,
      existing
    );
    update((d) => {
      // A new version sits right above the one it replaces; a new period goes to the top.
      const at = existing ? d.reports.findIndex((r) => r.id === existing.id) : 0;
      const reports = [...d.reports];
      reports.splice(Math.max(at, 0), 0, report);
      return { ...d, reports };
    });
    setOpenClientId(report.id);
    setTab('client');
  }

  // --- All reports ---------------------------------------------------------------------------

  const lastSent = data.reports
    .filter((r) => r.type === 'ma' && r.status === 'sent' && r.lockedOn)
    .sort((a, b) => b.period.end.localeCompare(a.period.end))[0];

  function toggleInTemplate(report: ReportMeta) {
    const templates = data.templates;
    if (!templates) return;
    const included = templates.ma.contents.some((c) => c.key === report.key && c.included);
    const setIncluded = (contents: ClientReport['contents'], value: boolean) =>
      contents.map((c) => (c.key === report.key ? { ...c, included: value } : c));
    const openDraft = data.reports.find((r) => r.type === 'ma' && r.status === 'draft');

    update((d) => ({
      templates: { ...templates, ma: { ...templates.ma, contents: setIncluded(templates.ma.contents, !included) } },
      reports:
        !included && openDraft
          ? d.reports.map((r) =>
              r.id === openDraft.id ? { ...r, contents: setIncluded(r.contents, true) } : r
            )
          : d.reports,
    }));
    toast.show({
      title: included ? 'Removed from management accounts' : 'Added to management accounts',
      description: included
        ? `${report.name} won't be in new packs.`
        : openDraft
          ? `Also added to the ${clientReportName(openDraft)} draft.`
          : undefined,
      icon: Check,
    });
  }

  const openReport = REPORT_SECTIONS.flatMap((s) => s.reports).find((r) => r.key === openKey);
  const showSetupHint = firstRun && tab !== 'templates';

  const templatesTab = (
    <View className="flex-row items-center gap-3">
      {showSetupHint && (
        <Text className="hidden text-sm text-muted-foreground sm:flex">Set up templates first</Text>
      )}
      {showSetupHint ? (
        <AttentionRing>
          <TemplatesTab active={false} onPress={() => selectTab('templates')} />
        </AttentionRing>
      ) : (
        <TemplatesTab active={tab === 'templates'} onPress={() => selectTab('templates')} />
      )}
    </View>
  );

  return (
    <PanelStickyTop.Provider value={stickyOffset + tabsHeight}>
      <PageTabs
        value={tab}
        onValueChange={(v) => selectTab(v as Tab)}
        options={[
          { value: 'all', label: 'All reports' },
          { value: 'client', label: 'Client reports', count: draftCount || undefined },
        ]}
        stickyOffset={stickyOffset}
        onLayoutHeight={setTabsHeight}
        trailing={templatesTab}
      />

      {tab === 'templates' ? (
        <TemplatesPage
          key={company.id}
          company={company}
          templates={editing}
          onChange={(templates) => setDraft({ companyId: company.id, templates })}
          page={templatePage}
          onPageChange={setTemplatePage}
          returnTo={
            returnReport
              ? {
                  label: clientReportName(returnReport),
                  onPress: () =>
                    leave(() => {
                      setOpenClientId(returnReport.id);
                      setTab('client');
                    }),
                }
              : null
          }
          firstRun={firstRun}
          dirty={dirty}
          onDiscard={() => setDraft({ companyId: company.id, templates: baseline })}
          onSave={() => {
            if (saveTemplates()) {
              setOpenClientId(null);
              setTab('client');
            } else {
              toast.show({ title: 'Templates saved', icon: Check });
            }
          }}
        />
      ) : tab === 'client' ? (
        openClient && data.templates ? (
          <ClientReportBuilder
            key={openClient.id}
            report={openClient}
            company={company}
            templates={data.templates}
            onBack={() => setOpenClientId(null)}
            onChange={(patch) => patchReport(openClient.id, patch)}
            onNewVersion={() => createReport(openClient.type, openClient.period)}
            onFixInTemplates={(page) => openTemplates(page, openClient.id)}
            onNavigate={onNavigate}
          />
        ) : (
          <ClientReports
            company={company}
            stickyOffset={stickyOffset + tabsHeight}
            templates={data.templates}
            reports={data.reports}
            onOpen={setOpenClientId}
            onCreate={createReport}
            onSetUpTemplates={() => openTemplates('ma-general')}
            onEditTemplate={(type) => openTemplates(type === 'ma' ? 'ma-general' : 'fs-entity')}
          />
        )
      ) : openReport ? (
        <ReportDetailView
          key={openReport.key}
          reportKey={openReport.key}
          reportName={openReport.name}
          sections={NAV_SECTIONS}
          period={period}
          ledgerAccount={ledgerAccount}
          inTemplate={
            data.templates
              ? data.templates.ma.contents.some((c) => c.key === openReport.key && c.included)
              : null
          }
          lastSent={
            lastSent
              ? { name: clientReportName(lastSent), lockedOn: lastSent.lockedOn! }
              : null
          }
          onSelectReport={setOpenKey}
          onBack={() => setOpenKey(null)}
          onOpenAccount={(code) => {
            setLedgerAccount(code);
            setOpenKey('general-ledger');
          }}
          onNavigate={onNavigate}
          onToggleTemplate={() => toggleInTemplate(openReport)}
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

      <LeaveDialog
        open={!!pendingLeave}
        firstRun={firstRun}
        onKeepEditing={() => setPendingLeave(null)}
        onDiscard={() => {
          const proceed = pendingLeave;
          setPendingLeave(null);
          setDraft(null);
          proceed?.();
        }}
        onSave={() => {
          const proceed = pendingLeave;
          setPendingLeave(null);
          saveTemplates();
          proceed?.();
        }}
      />
    </PanelStickyTop.Provider>
  );
}

/** The right-aligned Templates tab — same pill as the page tabs, black when open. */
function TemplatesTab({ active, onPress }: { active: boolean; onPress: () => void }) {
  return (
    <SegmentedControl
      value={active ? 'templates' : ''}
      onValueChange={onPress}
      options={[{ value: 'templates', label: 'Templates', icon: SlidersHorizontal }]}
    />
  );
}

function LeaveDialog({
  open,
  firstRun,
  onKeepEditing,
  onDiscard,
  onSave,
}: {
  open: boolean;
  firstRun: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
  onSave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onKeepEditing()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save changes to templates?</DialogTitle>
          <DialogDescription>
            {firstRun
              ? 'Client reports can be created once templates are saved.'
              : 'Your changes will be lost if you leave without saving.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onPress={onKeepEditing}>
            <Text>Keep editing</Text>
          </Button>
          <Button variant="outline" onPress={onDiscard}>
            <Text>Discard</Text>
          </Button>
          <Button onPress={onSave}>
            <Text>Save changes</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------------------------
// All reports
// ---------------------------------------------------------------------------------------------

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
  onOpenReport: (report: ReportMeta) => void;
}) {
  const q = query.trim().toLowerCase();
  const showSectionRows = sectionKey === ALL_SECTIONS;
  const visibleSections = REPORT_SECTIONS.filter(
    (s) => sectionKey === ALL_SECTIONS || s.key === sectionKey
  )
    .map((s) => ({ ...s, reports: s.reports.filter((r) => r.name.toLowerCase().includes(q)) }))
    .filter((s) => s.reports.length > 0);

  return (
    <View className={CARD_CLASS}>
      {/* Sticky below the title + tabs, same as the Work Queue filter bar. */}
      <View
        style={{ position: 'sticky', top: stickyOffset, zIndex: 8 } as ViewStyle}
        className="gap-3 border-b border-border bg-white px-6 py-4 md:flex-row md:items-center md:justify-between md:rounded-t-3xl md:px-4">
        <CountSelect
          label="Filter by section"
          value={sectionKey}
          onValueChange={setSectionKey}
          options={[
            { value: ALL_SECTIONS, label: 'All sections', count: TOTAL_REPORTS },
            ...REPORT_SECTIONS.map((s) => ({ value: s.key, label: s.label, count: s.reports.length })),
          ]}
        />
        <SearchBox value={query} onChangeText={setQuery} placeholder="Search reports" />
      </View>

      <View className="md:overflow-hidden md:rounded-b-3xl">
        {/* Desktop-only header row, same treatment as the Work Queue table's. */}
        <View className="hidden flex-row items-center gap-4 bg-muted px-4 py-2.5 md:flex">
          <Text className="flex-1 font-plex-semibold text-sm text-muted-foreground">Report</Text>
          <Text style={COL_PERIOD} className="font-plex-semibold text-sm text-muted-foreground">
            Period
          </Text>
          <Text
            style={COL_FIGURE}
            className="text-right font-plex-semibold text-sm text-muted-foreground">
            Key figure
          </Text>
          <Text style={COL_STATUS} className="font-plex-semibold text-sm text-muted-foreground">
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
              {showSectionRows && (
                <View
                  className={cn(
                    'border-b border-border bg-muted px-6 py-3 md:px-4',
                    sectionIndex > 0 && 'border-t'
                  )}>
                  <Text className="font-plex-semibold text-sm text-foreground">{section.label}</Text>
                </View>
              )}
              {section.reports.map((report, i) => (
                <ReportRow
                  key={report.key}
                  report={report}
                  period={period}
                  isLast={
                    i === section.reports.length - 1 &&
                    (showSectionRows || sectionIndex === visibleSections.length - 1)
                  }
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

function ReportRow({
  report,
  period,
  isLast,
  onPress,
}: {
  report: ReportMeta;
  period: Period;
  isLast: boolean;
  onPress: () => void;
}) {
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
      accessibilityRole="button"
      accessibilityLabel={`Open ${report.name}`}
      className={cn(
        'flex-row items-center gap-4 px-6 py-4 web:cursor-pointer web:hover:bg-muted md:px-4',
        !isLast && 'border-b border-border'
      )}>
      <View className="min-w-0 flex-1 flex-row items-center gap-4">
        <View
          style={{ width: 40, height: 40 }}
          className="items-center justify-center rounded-xl bg-brand-subtle">
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
