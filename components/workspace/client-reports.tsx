import { Button } from '@/components/ui/button';
import { DateBadge } from '@/components/ui/date-badge';
import {
  Dialog,
  DialogContent,
  DialogField,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { TintedPill } from '@/components/ui/tinted-pill';
import {
  clientReportName,
  dateTile,
  periodLabel,
  periodsFor,
  samePeriod,
  templateSummary,
  TYPE_LABEL,
  type ClientReport,
  type ClientReportStatus,
  type ClientReportType,
  type ReportPeriod,
  type Templates,
} from '@/components/workspace/client-report-data';
import { SearchBox } from '@/components/workspace/work-queue-filters';
import type { Company } from '@/lib/companies';
import { MUTED_HEX, TONE_HEX } from '@/lib/tone';
import { CARD_CLASS } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import {
  Check,
  ChevronRight,
  Clock,
  FileText,
  Inbox,
  Lock,
  Pencil,
  Plus,
  Send,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

export const STATUS_META: Record<
  ClientReportStatus,
  { label: string; color: string; icon: LucideIcon }
> = {
  'not-started': { label: 'Not started', color: MUTED_HEX, icon: Clock },
  draft: { label: 'Draft', color: MUTED_HEX, icon: Pencil },
  published: { label: 'Published', color: MUTED_HEX, icon: Lock },
  sent: { label: 'Sent', color: TONE_HEX.success, icon: Check },
  'sent-for-signature': { label: 'Sent for signature', color: MUTED_HEX, icon: Send },
  signed: { label: 'Signed', color: TONE_HEX.success, icon: Check },
};

export function StatusPill({ status }: { status: ClientReportStatus }) {
  const meta = STATUS_META[status];
  return <TintedPill label={meta.label} icon={meta.icon} color={meta.color} />;
}

type Filter = 'all' | 'ma' | 'fs' | 'drafts';

// Shared by the header row and every data row so the columns line up.
const COL_PERIOD = { width: 72 };
const COL_RECIPIENT = { width: 190 };
const COL_ACTIVITY = { width: 230 };
const COL_STATUS = { width: 170 };

// ---------------------------------------------------------------------------------------------
// Tab
// ---------------------------------------------------------------------------------------------

export function ClientReports({
  company,
  stickyOffset,
  templates,
  reports,
  onOpen,
  onCreate,
  onSetUpTemplates,
  onEditTemplate,
}: {
  company: Company;
  stickyOffset: number;
  templates: Templates | null;
  reports: ClientReport[];
  onOpen: (id: string) => void;
  /** Creates a report (or a new version of one) for the period and opens it. */
  onCreate: (type: ClientReportType, period: ReportPeriod) => void;
  onSetUpTemplates: () => void;
  onEditTemplate: (type: ClientReportType) => void;
}) {
  const [filter, setFilter] = React.useState<Filter>('all');
  const [query, setQuery] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);

  if (!templates) {
    return (
      <EmptyCard
        title={`Set up client reports for ${company.name}`}
        action={
          <Button onPress={onSetUpTemplates}>
            <Icon as={SlidersHorizontal} size={16} />
            <Text>Set up templates</Text>
          </Button>
        }
      />
    );
  }

  const newDialog = (
    <NewClientReportDialog
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      templates={templates}
      reports={reports}
      onOpen={(id) => {
        setDialogOpen(false);
        onOpen(id);
      }}
      onCreate={(type, period) => {
        setDialogOpen(false);
        onCreate(type, period);
      }}
      onEditTemplate={(type) => {
        setDialogOpen(false);
        onEditTemplate(type);
      }}
    />
  );

  const newButton = (
    <Button onPress={() => setDialogOpen(true)}>
      <Icon as={Plus} size={16} />
      <Text>New client report</Text>
    </Button>
  );

  if (reports.length === 0) {
    return (
      <>
        <EmptyCard title="Templates are ready" icon={Check} action={newButton} />
        {newDialog}
      </>
    );
  }

  const q = query.trim().toLowerCase();
  const matchesFilter = (r: ClientReport, f: Filter) =>
    f === 'all' || (f === 'drafts' ? r.status === 'draft' : r.type === f);
  const visible = reports.filter(
    (r) =>
      matchesFilter(r, filter) &&
      (clientReportName(r).toLowerCase().includes(q) || r.recipient.toLowerCase().includes(q))
  );
  const filterOptions = (
    [
      ['all', 'All client reports'],
      ['ma', TYPE_LABEL.ma],
      ['fs', TYPE_LABEL.fs],
      ['drafts', 'Drafts'],
    ] as const
  ).map(([value, label]) => ({
    value,
    label,
    count: reports.filter((r) => matchesFilter(r, value)).length,
  }));

  return (
    <View className={CARD_CLASS}>
      {/* Sticky below the title + tabs, same as the All reports filter bar. */}
      <View
        style={{ position: 'sticky', top: stickyOffset, zIndex: 8 } as ViewStyle}
        className="gap-3 border-b border-border bg-white px-6 py-4 md:flex-row md:items-center md:justify-between md:rounded-t-3xl md:px-4">
        <CountSelect
          label="Filter client reports"
          value={filter}
          options={filterOptions}
          onValueChange={(v) => setFilter(v as Filter)}
        />
        <View className="flex-row items-center gap-2">
          <SearchBox value={query} onChangeText={setQuery} placeholder="Search client reports" />
          {newButton}
        </View>
      </View>

      <View className="md:overflow-hidden md:rounded-b-3xl">
        {/* Desktop-only header row, same treatment as the other tables. */}
        <View className="hidden flex-row items-center gap-4 bg-muted px-4 py-2.5 md:flex">
          <HeaderCell style={COL_PERIOD}>Period</HeaderCell>
          <HeaderCell className="flex-1">Report</HeaderCell>
          <HeaderCell style={COL_RECIPIENT}>Recipient</HeaderCell>
          <HeaderCell style={COL_ACTIVITY}>Last activity</HeaderCell>
          <HeaderCell style={COL_STATUS}>Status</HeaderCell>
          <View style={{ width: 16 }} />
        </View>

        {visible.length === 0 ? (
          <View className="items-center gap-2 px-6 py-16">
            <Icon as={Inbox} size={28} className="text-muted-foreground" />
            <Text className="text-sm text-muted-foreground">No client reports match.</Text>
          </View>
        ) : (
          visible.map((report, i) => (
            <ClientReportRow
              key={report.id}
              report={report}
              isLast={i === visible.length - 1}
              onPress={() => onOpen(report.id)}
            />
          ))
        )}
      </View>
      {newDialog}
    </View>
  );
}

function EmptyCard({
  title,
  icon = FileText,
  action,
}: {
  title: string;
  icon?: LucideIcon;
  action: React.ReactNode;
}) {
  return (
    <View className={cn(CARD_CLASS, 'items-center gap-4 px-6 py-20')}>
      <View className="h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon as={icon} size={22} className="text-muted-foreground" />
      </View>
      <Text className="text-center font-plex-semibold text-lg text-foreground">{title}</Text>
      {action}
    </View>
  );
}

function HeaderCell({
  children,
  style,
  className,
}: {
  children: string;
  style?: { width: number };
  className?: string;
}) {
  return (
    <Text
      style={style}
      className={cn('font-plex-semibold text-sm text-muted-foreground', className)}>
      {children}
    </Text>
  );
}

/** shadcn Select whose trigger shows the current option plus its count — e.g. "All client
 * reports 5". Doubles as the filter. */
export function CountSelect({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; count: number }[];
  onValueChange: (value: string) => void;
}) {
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <Select
      value={{ value: current.value, label: current.label }}
      onValueChange={(o) => o && onValueChange(o.value)}>
      <SelectTrigger aria-label={label} className="h-10 w-auto self-start sm:h-10">
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

function ClientReportRow({
  report,
  isLast,
  onPress,
}: {
  report: ClientReport;
  isLast: boolean;
  onPress: () => void;
}) {
  const tile = dateTile(report.period);
  const name = clientReportName(report);
  const pill = <StatusPill status={report.status} />;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${name}`}
      className={cn(
        'flex-row items-center gap-4 px-6 py-4 web:cursor-pointer web:hover:bg-muted md:px-4',
        !isLast && 'border-b border-border'
      )}>
      <View style={COL_PERIOD}>
        <DateBadge top={tile.top} bottom={tile.bottom} />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text className="font-plex-semibold text-base text-foreground" numberOfLines={2}>
          {name}
        </Text>
        {report.version > 1 && (
          <Text className="text-sm text-muted-foreground">Version {report.version}</Text>
        )}
        {/* Mobile folds recipient, activity and status under the name. */}
        <Text className="text-sm text-muted-foreground md:hidden">
          {report.recipient} · {report.lastActivity}
        </Text>
        <View className="pt-1 md:hidden">{pill}</View>
      </View>
      <Text style={COL_RECIPIENT} className="hidden text-base text-foreground md:flex">
        {report.recipient}
      </Text>
      <Text style={COL_ACTIVITY} className="hidden text-base text-foreground md:flex">
        {report.lastActivity}
      </Text>
      <View style={COL_STATUS} className="hidden md:flex">
        {pill}
      </View>
      <Icon as={ChevronRight} size={16} className="text-muted-foreground" />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------------------------
// New client report
// ---------------------------------------------------------------------------------------------

/** The newest version of the report for a type and period, if one exists. */
export function latestFor(
  reports: ClientReport[],
  type: ClientReportType,
  period: ReportPeriod
): ClientReport | undefined {
  return reports
    .filter((r) => r.type === type && samePeriod(r.period, period))
    .sort((a, b) => b.version - a.version)[0];
}

function NewClientReportDialog({
  open,
  onOpenChange,
  templates,
  reports,
  onOpen,
  onCreate,
  onEditTemplate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: Templates;
  reports: ClientReport[];
  onOpen: (id: string) => void;
  onCreate: (type: ClientReportType, period: ReportPeriod) => void;
  onEditTemplate: (type: ClientReportType) => void;
}) {
  const [type, setType] = React.useState<ClientReportType>('ma');
  const periods = periodsFor(type === 'ma' ? templates.ma.frequency : 'yearly');
  const [periodIndex, setPeriodIndex] = React.useState(0);
  const period = periods[Math.min(periodIndex, periods.length - 1)];
  const existing = latestFor(reports, type, period);

  // Open an unfinished report; never change a finished one — make a new version instead.
  const unfinished = existing && (existing.status === 'draft' || existing.status === 'not-started');
  const primaryLabel = unfinished
    ? 'Open'
    : existing
      ? `Create version ${existing.version + 1}`
      : type === 'ma'
        ? 'Create draft'
        : 'Create';

  function submit() {
    if (existing && unfinished) onOpen(existing.id);
    else onCreate(type, period);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New client report</DialogTitle>
        </DialogHeader>

        <SegmentedControl
          variant="track"
          value={type}
          onValueChange={(v) => {
            setType(v as ClientReportType);
            setPeriodIndex(0);
          }}
          options={[
            { value: 'ma', label: TYPE_LABEL.ma },
            { value: 'fs', label: TYPE_LABEL.fs },
          ]}
        />

        <DialogField label="Period">
          <Select
            value={{ value: String(periodIndex), label: periodLabel(period) }}
            onValueChange={(o) => o && setPeriodIndex(Number(o.value))}>
            <SelectTrigger aria-label="Period" className="w-full">
              <Text className="text-sm text-foreground">{periodLabel(period)}</Text>
            </SelectTrigger>
            <SelectContent align="start" className="w-72">
              {periods.map((p, i) => (
                <SelectItem key={p.end} value={String(i)} label={periodLabel(p)} />
              ))}
            </SelectContent>
          </Select>
        </DialogField>

        <View className="gap-1 rounded-lg bg-muted px-4 py-3">
          <Text className="text-sm text-foreground">{templateSummary(type, templates)}</Text>
          <Pressable
            onPress={() => onEditTemplate(type)}
            accessibilityRole="link"
            className="self-start web:cursor-pointer">
            <Text className="text-sm text-brand web:hover:underline">Edit template</Text>
          </Pressable>
        </View>

        <DialogFooter>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            <Text>Cancel</Text>
          </Button>
          <Button onPress={submit}>
            <Text>{primaryLabel}</Text>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
