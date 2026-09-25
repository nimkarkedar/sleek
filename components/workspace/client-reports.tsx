import { Button } from '@/components/ui/button';
import { DateBadge } from '@/components/ui/date-badge';
import { Icon } from '@/components/ui/icon';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { TintedPill } from '@/components/ui/tinted-pill';
import { useToast } from '@/components/ui/toast';
import { SearchBox } from '@/components/workspace/work-queue-filters';
import { TONE_HEX } from '@/lib/tone';
import { cn } from '@/lib/utils';
import {
  Check,
  ChevronRight,
  FileText,
  Inbox,
  Pencil,
  Plus,
  type LucideIcon,
} from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------------------------

type ClientReportStatus = 'draft' | 'sent' | 'signed' | 'not-started';

const STATUS: Record<ClientReportStatus, { label: string; color: string; icon: LucideIcon }> = {
  draft: { label: 'Draft', color: '#656565', icon: Pencil },
  sent: { label: 'Sent', color: TONE_HEX.success, icon: Check },
  signed: { label: 'Signed', color: TONE_HEX.success, icon: Check },
  'not-started': { label: 'Not started', color: '#656565', icon: Pencil },
};

type ClientReport = {
  key: string;
  /** Date tile: small caption on top, main value below. */
  periodTop: string;
  periodBottom: string;
  name: string;
  recipient: string;
  lastActivity: string;
  status: ClientReportStatus;
};

const CLIENT_REPORTS: ClientReport[] = [
  {
    key: 'ma-2027-03',
    periodTop: '2027',
    periodBottom: 'Mar',
    name: 'Management accounts, March 2027',
    recipient: 'Jane Tan, Director',
    lastActivity: 'Edited 2 days ago',
    status: 'draft',
  },
  {
    key: 'ma-2027-02',
    periodTop: '2027',
    periodBottom: 'Feb',
    name: 'Management accounts, February 2027',
    recipient: 'Jane Tan, Director',
    lastActivity: 'Sent 8 Mar 2027',
    status: 'sent',
  },
  {
    key: 'ma-2027-01',
    periodTop: '2027',
    periodBottom: 'Jan',
    name: 'Management accounts, January 2027',
    recipient: 'Jane Tan, Director',
    lastActivity: 'Sent 6 Feb 2027',
    status: 'sent',
  },
  {
    key: 'fs-fy2026',
    periodTop: 'FY',
    periodBottom: '26',
    name: 'Financial statements, FY2026',
    recipient: 'Both directors',
    lastActivity: 'Signed 22 Jul 2026',
    status: 'signed',
  },
  {
    key: 'fs-fy2027',
    periodTop: 'FY',
    periodBottom: '27',
    name: 'Financial statements, FY2027',
    recipient: 'Both directors',
    lastActivity: 'After year-end close',
    status: 'not-started',
  },
];

/** The draft that "Add to client report" (on any report in All reports) adds to. */
export const CURRENT_DRAFT_NAME = CLIENT_REPORTS.find((r) => r.status === 'draft')!.name;

/** Shown as the Client reports tab count — the drafts still being put together. */
export const OPEN_DRAFT_COUNT = CLIENT_REPORTS.filter((r) => r.status === 'draft').length;

const ALL = 'all';

// Shared by the header row and every data row so the columns line up.
const COL_PERIOD = { width: 72 };
const COL_RECIPIENT = { width: 200 };
const COL_ACTIVITY = { width: 200 };
const COL_STATUS = { width: 150 };

// ---------------------------------------------------------------------------------------------
// Tab
// ---------------------------------------------------------------------------------------------

export function ClientReports({
  stickyOffset,
  draftEdited,
}: {
  stickyOffset: number;
  /** A report was just added to the current draft — its "last activity" reflects that. */
  draftEdited: boolean;
}) {
  const toast = useToast();
  const [status, setStatus] = React.useState<string>(ALL);
  const [query, setQuery] = React.useState('');

  const q = query.trim().toLowerCase();
  const reports = CLIENT_REPORTS.map((r) =>
    draftEdited && r.status === 'draft' ? { ...r, lastActivity: 'Edited just now' } : r
  ).filter(
    (r) =>
      (status === ALL || r.status === status) &&
      (r.name.toLowerCase().includes(q) || r.recipient.toLowerCase().includes(q))
  );

  // Neither the client report view nor the builder is designed yet — acknowledge the click.
  function comingSoon(title: string, description: string) {
    toast.show({ title, description, icon: FileText });
  }

  return (
    <View className="bg-white md:rounded-3xl md:border md:border-[#E4E4E7] md:shadow-sm md:shadow-black/5">
      {/* Sticky below the title + tabs, same as the All reports filter bar. */}
      <View
        style={{ position: 'sticky', top: stickyOffset, zIndex: 8 } as ViewStyle}
        className="gap-3 border-b border-border bg-white px-6 py-4 md:flex-row md:items-center md:justify-between md:rounded-t-3xl md:px-4">
        <StatusFilter value={status} onValueChange={setStatus} />
        <View className="flex-row items-center gap-2">
          <SearchBox value={query} onChangeText={setQuery} placeholder="Search client reports" />
          <Button
            onPress={() =>
              comingSoon('New client report', 'Building a client report is coming soon.')
            }>
            <Icon as={Plus} size={16} />
            <Text>New client report</Text>
          </Button>
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

        {reports.length === 0 ? (
          <View className="items-center gap-2 px-6 py-16">
            <Icon as={Inbox} size={28} className="text-muted-foreground" />
            <Text className="text-sm text-muted-foreground">No client reports match.</Text>
          </View>
        ) : (
          reports.map((report, i) => (
            <ClientReportRow
              key={report.key}
              report={report}
              isLast={i === reports.length - 1}
              onPress={() => comingSoon(report.name, 'The client report view is coming soon.')}
            />
          ))
        )}
      </View>
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
      className={cn(
        'font-plex-semibold text-xs uppercase tracking-wide text-muted-foreground',
        className
      )}>
      {children}
    </Text>
  );
}

/** shadcn Select filtering by status, trigger showing the count — e.g. "All client reports 5". */
function StatusFilter({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (value: string) => void;
}) {
  const options = [
    { value: ALL, label: 'All client reports', count: CLIENT_REPORTS.length },
    ...(Object.keys(STATUS) as ClientReportStatus[]).map((s) => ({
      value: s,
      label: STATUS[s].label,
      count: CLIENT_REPORTS.filter((r) => r.status === s).length,
    })),
  ];
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <Select
      value={{ value: current.value, label: current.label }}
      onValueChange={(o) => o && onValueChange(o.value)}>
      <SelectTrigger aria-label="Filter by status" className="h-10 w-auto self-start sm:h-10">
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
  const [hovered, setHovered] = React.useState(false);
  const meta = STATUS[report.status];
  const pill = <TintedPill label={meta.label} icon={meta.icon} color={meta.color} />;

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
      <View style={COL_PERIOD}>
        <DateBadge top={report.periodTop} bottom={report.periodBottom} />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <Text className="text-base text-foreground" numberOfLines={2}>
          {report.name}
        </Text>
        {/* Mobile folds recipient, activity and status under the name. */}
        <Text className="text-sm text-muted-foreground md:hidden">
          {report.recipient} · {report.lastActivity}
        </Text>
        <View className="pt-1 md:hidden">{pill}</View>
      </View>
      <Text style={COL_RECIPIENT} className="hidden text-base text-muted-foreground md:flex">
        {report.recipient}
      </Text>
      <Text style={COL_ACTIVITY} className="hidden text-base text-muted-foreground md:flex">
        {report.lastActivity}
      </Text>
      <View style={COL_STATUS} className="hidden md:flex">
        {pill}
      </View>
      <Icon as={ChevronRight} size={16} className="text-muted-foreground" />
    </Pressable>
  );
}
