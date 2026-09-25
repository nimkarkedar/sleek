import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { TintedPill } from '@/components/ui/tinted-pill';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { periodRange, type Period } from '@/components/workspace/period-selector';
import {
  ACCOUNTS,
  LEDGER_ENTRIES,
  REPORT_DETAILS,
  type Cell,
  type Column,
  type ReportDetail,
  type Row,
  type RowLink,
  type Tone,
} from '@/components/workspace/report-data';
import { TONE_HEX } from '@/lib/tone';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Check,
  CircleAlert,
  Download,
  Inbox,
  Plus,
  type LucideIcon,
} from 'lucide-react-native';
import * as React from 'react';
import { Pressable, ScrollView, View, useWindowDimensions, type TextStyle } from 'react-native';

export type ReportNavSection = {
  key: string;
  label: string;
  reports: { key: string; name: string }[];
};

const TONE: Record<Tone, { color: string; icon: LucideIcon }> = {
  success: { color: TONE_HEX.success, icon: Check },
  warning: { color: '#D97706', icon: CircleAlert },
  neutral: { color: '#656565', icon: CircleAlert },
};

// Aligned figures — digits share one width so columns of numbers line up.
const NUMERIC: TextStyle = { fontVariant: ['tabular-nums'] };
const NUMERIC_COL_WIDTH = 132;
const CODE_WIDTH = 44;

function formatCell(value: number | string | null): string {
  if (value === null) return '–';
  if (typeof value === 'string') return value;
  const abs = Math.abs(value).toLocaleString('en-US');
  return value < 0 ? `(${abs})` : abs;
}

/** The month the last client report went out — the one before this. */
function lastMonthName(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return d.toLocaleDateString('en-GB', { month: 'long' });
}

function longDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function subtitle(kind: ReportDetail['periodKind'], period: Period): string {
  const { start, end } = periodRange(period);
  if (kind === 'asAt') return `As at ${longDate(end)}`;
  if (kind === 'range') return `${longDate(start)} to ${longDate(end)}`;
  const days = (end.getTime() - start.getTime()) / 86_400_000;
  return `For the ${days > 360 ? 'year' : 'period'} ending ${longDate(end)}`;
}

function resolveColumnLabel(label: string, period: Period): string {
  const fy = periodRange(period).end.getFullYear();
  return label.replace('{PRIOR_FY}', `FY${fy - 1}`).replace('{FY}', `FY${fy}`);
}

// ---------------------------------------------------------------------------------------------
// Detail view
// ---------------------------------------------------------------------------------------------

export function ReportDetailView({
  reportKey,
  reportName,
  sections,
  period,
  ledgerAccount,
  addedToClient,
  onSelectReport,
  onBack,
  onOpenAccount,
  onNavigate,
  onAddToClient,
}: {
  reportKey: string;
  reportName: string;
  sections: ReportNavSection[];
  period: Period;
  /** Which account the General ledger shows. */
  ledgerAccount: string;
  addedToClient: boolean;
  onSelectReport: (key: string) => void;
  onBack: () => void;
  onOpenAccount: (code: string) => void;
  onNavigate: (targetKey: string, targetTab?: string) => void;
  onAddToClient: () => void;
}) {
  const toast = useToast();
  const [compare, setCompare] = React.useState<'prior-year' | 'none'>('prior-year');
  const [figures, setFigures] = React.useState<'live' | 'sent'>('live');

  const isLedger = reportKey === 'general-ledger';
  const detail = isLedger ? buildLedgerDetail(ledgerAccount, period) : REPORT_DETAILS[reportKey];
  if (!detail) return null;
  const showPrior = !!detail.comparable && compare === 'prior-year';

  function handleLink(link: RowLink) {
    if (link.kind === 'account') onOpenAccount(link.code);
    else if (link.kind === 'customer') onNavigate('getpaid', 'customers');
    else onNavigate('spend', 'suppliers');
  }

  return (
    <View className="bg-white md:flex-row md:rounded-3xl md:border md:border-[#E4E4E7] md:shadow-sm md:shadow-black/5">
      <ReportNav
        sections={sections}
        activeKey={reportKey}
        onSelect={onSelectReport}
        onBack={onBack}
      />

      <View className="min-w-0 flex-1 gap-6 p-6 md:p-8">
        {/* Mobile has no side list, so the way back sits above the title instead. */}
        <Pressable
          onPress={onBack}
          accessibilityRole="link"
          className="flex-row items-center gap-2 self-start web:cursor-pointer md:hidden">
          <Icon as={ArrowLeft} size={16} className="text-foreground" />
          <Text className="font-plex-semibold text-base text-foreground">All reports</Text>
        </Pressable>

        <View className="gap-1">
          <Text variant="h3">{reportName}</Text>
          <Text className="text-base text-muted-foreground">
            {subtitle(detail.periodKind, period)}
          </Text>
        </View>

        <View className="flex-row flex-wrap items-center gap-2">
          {detail.comparable && (
            <ToolbarSelect
              label="Compare"
              value={compare}
              options={[
                { value: 'prior-year', label: 'Prior year' },
                { value: 'none', label: 'None' },
              ]}
              onValueChange={(v) => setCompare(v as typeof compare)}
            />
          )}
          <ToolbarSelect
            label="Figures"
            value={figures}
            options={[
              { value: 'live', label: 'Live' },
              { value: 'sent', label: `As sent in ${lastMonthName()} client report` },
            ]}
            onValueChange={(v) => setFigures(v as typeof figures)}
          />
          <Button
            variant="outline"
            onPress={() =>
              toast.show({
                title: `Export ${reportName}`,
                description: 'Exporting to PDF and Excel is coming soon.',
                icon: Download,
              })
            }>
            <Icon as={Download} size={16} />
            <Text>Export</Text>
          </Button>
          {addedToClient ? (
            <Button variant="outline" disabled>
              <Icon as={Check} size={16} />
              <Text>Added to client report</Text>
            </Button>
          ) : (
            <Button onPress={onAddToClient}>
              <Icon as={Plus} size={16} />
              <Text>Add to client report</Text>
            </Button>
          )}
        </View>

        {isLedger && (
          <Text className="text-base text-muted-foreground">
            Showing {ledgerAccount} {ACCOUNTS[ledgerAccount]}. Choose another account from any
            report line.
          </Text>
        )}

        {detail.rows.length === 0 ? (
          <View className="items-center gap-2 rounded-2xl border border-border px-6 py-12">
            <Icon as={Inbox} size={28} className="text-muted-foreground" />
            <Text className="text-center text-base text-muted-foreground">
              Detailed entries for {ledgerAccount} {ACCOUNTS[ledgerAccount]} aren't loaded in this
              demo.
            </Text>
          </View>
        ) : (
          <StatementTable
            columns={showPrior || !detail.comparable ? detail.columns : detail.columns.slice(0, -1)}
            rows={detail.rows}
            dropLastCell={!!detail.comparable && !showPrior}
            period={period}
            onLink={handleLink}
          />
        )}

        {reportKey === 'bank-reconciliation' && (
          <Button
            variant="outline"
            className="self-start"
            onPress={() => onNavigate('banking', 'reconciliation')}>
            <Text>Reconcile in Banking</Text>
          </Button>
        )}
      </View>
    </View>
  );
}

/** General ledger for one account, built from its entries with a running balance. */
function buildLedgerDetail(code: string, period: Period): ReportDetail {
  const data = LEDGER_ENTRIES[code];
  const { start } = periodRange(period);
  const dateLabel = (offset: number) => {
    const d = new Date(start);
    d.setDate(d.getDate() + offset);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const rows: Row[] = [];
  if (data) {
    let balance = data.opening;
    rows.push({
      kind: 'line',
      label: dateLabel(0),
      cells: ['Opening balance', '', data.opening, balance],
    });
    for (const [offset, description, reference, amount] of data.entries) {
      balance += amount;
      rows.push({
        kind: 'line',
        label: dateLabel(offset),
        cells: [description, reference, amount, balance],
      });
    }
  }
  return {
    periodKind: 'range',
    columns: [
      { label: 'Date' },
      { label: 'Description', flex: 1 },
      { label: 'Reference', muted: true },
      { label: 'Amount', align: 'right' },
      { label: 'Balance', align: 'right' },
    ],
    rows,
  };
}

// ---------------------------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------------------------

function ReportNav({
  sections,
  activeKey,
  onSelect,
  onBack,
}: {
  sections: ReportNavSection[];
  activeKey: string;
  onSelect: (key: string) => void;
  onBack: () => void;
}) {
  return (
    <View style={{ width: 260 }} className="hidden gap-1 border-r border-border p-4 md:flex">
      <Pressable
        onPress={onBack}
        accessibilityRole="link"
        className="flex-row items-center gap-2 rounded-lg px-3 py-2.5 web:cursor-pointer web:hover:bg-muted">
        <Icon as={ArrowLeft} size={16} className="text-foreground" />
        <Text className="font-plex-semibold text-base text-foreground">All reports</Text>
      </Pressable>
      {sections.map((section, i) => (
        <View
          key={section.key}
          className={cn('gap-0.5 pt-3', i > 0 && 'mt-2 border-t border-border')}>
          <Text className="px-3 pb-1 pt-1 text-sm text-muted-foreground">{section.label}</Text>
          {section.reports.map((report) => {
            const active = report.key === activeKey;
            return (
              <Pressable
                key={report.key}
                onPress={() => onSelect(report.key)}
                accessibilityRole="link"
                accessibilityState={{ selected: active }}
                className={cn(
                  'rounded-lg px-3 py-2.5 web:cursor-pointer',
                  active ? 'bg-muted' : 'web:hover:bg-muted'
                )}>
                <Text
                  className={cn(
                    'text-base',
                    active ? 'font-plex-semibold text-brand' : 'font-plex-regular text-foreground'
                  )}>
                  {report.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** shadcn Select whose trigger reads "<label>  <value>", e.g. "Compare  Prior year". */
function ToolbarSelect({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onValueChange: (value: string) => void;
}) {
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <Select
      value={{ value: current.value, label: current.label }}
      onValueChange={(o) => o && onValueChange(o.value)}>
      <SelectTrigger aria-label={label} className="h-10 w-auto sm:h-10">
        <View className="flex-row items-center gap-2 pr-1">
          <Text className="text-sm text-muted-foreground">{label}</Text>
          <Text className="font-plex-semibold text-sm text-foreground">{current.label}</Text>
        </View>
      </SelectTrigger>
      <SelectContent align="start" className="w-64">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} label={o.label} />
        ))}
      </SelectContent>
    </Select>
  );
}

function StatementTable({
  columns,
  rows,
  dropLastCell,
  period,
  onLink,
}: {
  columns: Column[];
  rows: Row[];
  /** Drop each row's last (prior-year) cell when comparison is off. */
  dropLastCell: boolean;
  period: Period;
  onLink: (link: RowLink) => void;
}) {
  // Wide tables (aged reports, the ledger) scroll sideways on a phone instead of squashing.
  // Desktop: columns share the width proportionally so every table fits the card. Phone: fixed
  // widths, and the table scrolls sideways instead of squashing figures together.
  const compact = useWindowDimensions().width < 768;
  const colStyle = (col: Column, i: number) => columnStyle(col, i, compact);
  const minWidth = compact
    ? 32 + (columns.length - 1) * 16 + columns.reduce((sum, c, i) => sum + fixedWidth(c, i), 0)
    : undefined;
  const cellsOf = (cells: Cell[]) => (dropLastCell ? cells.slice(0, -1) : cells);

  return (
    <View className="overflow-hidden rounded-2xl border border-border">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ minWidth, flex: 1 }}>
          {/* Header row — same treatment as the Work Queue and Reports overview tables. */}
          <View className="flex-row items-center gap-4 bg-muted px-4 py-2.5">
            {columns.map((col, i) => (
              <Text
                key={i}
                style={colStyle(col, i)}
                className={cn(
                  'font-plex-semibold text-xs uppercase tracking-wide text-muted-foreground',
                  col.align === 'right' && 'text-right'
                )}>
                {resolveColumnLabel(col.label, period)}
              </Text>
            ))}
          </View>

          {rows.map((row, r) => {
            const isLast = r === rows.length - 1;
            if (row.kind === 'section') {
              return (
                <View
                  key={r}
                  style={{ backgroundColor: '#FAFAFA' }}
                  className="border-t border-border px-4 py-3">
                  <Text className="font-plex-semibold text-base text-foreground">{row.label}</Text>
                </View>
              );
            }
            const strong = row.kind !== 'line';
            return (
              <View
                key={r}
                className={cn(
                  'flex-row items-center gap-4 border-t border-border px-4 py-3',
                  row.kind === 'total' && 'bg-muted',
                  isLast && 'rounded-b-2xl'
                )}>
                <View style={colStyle(columns[0], 0)} className="flex-row items-center gap-3">
                  {row.kind === 'line' && row.code && (
                    <Text
                      style={[NUMERIC, { width: CODE_WIDTH }]}
                      className="text-base text-muted-foreground">
                      {row.code}
                    </Text>
                  )}
                  {row.kind === 'line' && row.link ? (
                    <Pressable
                      onPress={() => onLink(row.link!)}
                      accessibilityRole="link"
                      className="shrink web:cursor-pointer">
                      <Text className="text-base text-brand web:hover:underline">{row.label}</Text>
                    </Pressable>
                  ) : (
                    <Text
                      className={cn(
                        'shrink text-base text-foreground',
                        strong ? 'font-plex-semibold' : 'font-plex-regular'
                      )}>
                      {row.label}
                    </Text>
                  )}
                </View>
                {cellsOf(row.cells).map((cell, c) => {
                  const col = columns[c + 1];
                  if (!col) return null;
                  const style = colStyle(col, c + 1);
                  if (cell && typeof cell === 'object') {
                    const tone = TONE[cell.pill.tone];
                    return (
                      <View
                        key={c}
                        style={style}
                        className={cn('flex-row', col.align === 'right' && 'justify-end')}>
                        <TintedPill label={cell.pill.label} icon={tone.icon} color={tone.color} />
                      </View>
                    );
                  }
                  return (
                    <Text
                      key={c}
                      style={[
                        style,
                        typeof cell === 'number' || cell === null ? NUMERIC : undefined,
                      ]}
                      className={cn(
                        'text-base',
                        col.align === 'right' && 'text-right',
                        col.muted ? 'text-muted-foreground' : 'text-foreground',
                        strong ? 'font-plex-semibold' : 'font-plex-regular'
                      )}>
                      {formatCell(cell)}
                    </Text>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

/** Phone widths: label columns wider, figure columns a fixed numeric width. */
function fixedWidth(col: Column, index: number): number {
  if (col.flex) return index === 0 ? 200 : 170;
  return index === 0 ? 120 : NUMERIC_COL_WIDTH;
}

/** Desktop: weighted share of the row (label/status columns 2.4×, figure columns 1×). */
function columnStyle(col: Column, index: number, compact: boolean) {
  if (compact) return { width: fixedWidth(col, index) };
  return { flex: col.flex ? 2.4 : 1, minWidth: 0 };
}
