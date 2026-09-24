import { computeTodoCounts } from '@/components/workspace/work-list';
import { WorkQueueFilterBar } from '@/components/workspace/work-queue-filters';
import { Icon } from '@/components/ui/icon';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { type Company } from '@/lib/companies';
import { useOnScrollEnd } from '@/lib/scroll-end';
import { createRng, formatMoney, randomInt } from '@/lib/seeded-random';
import {
  STATUS_META,
  type StatusFilterValue,
  type TransactionStatus,
} from '@/lib/transaction-status';
import { cn, hexToRgba } from '@/lib/utils';
import { ChevronRight, Inbox, Landmark } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

export type { StatusFilterValue, TransactionStatus };

// Weighted so "documents needed" dominates, roughly matching the reference table — the other six
// statuses are real but rarer.
const STATUS_POOL: TransactionStatus[] = [
  'documents-needed',
  'documents-needed',
  'documents-needed',
  'documents-needed',
  'amount-unmatched',
  'amount-unmatched',
  'check-documents',
  'document-removed',
  'system-error',
  'processing',
  'reconciling',
];

type BankAccount = { bank: string; last4: string; color: string };

// SGD only — an earlier pass mixed in HKD/IDR/AUD accounts, which was a mistake; every account
// here is Singapore-only for now.
const BANK_ACCOUNTS: BankAccount[] = [
  { bank: 'OCBC', last4: '0001', color: '#E4231D' },
  { bank: 'DBS', last4: '6674', color: '#B3121B' },
  { bank: 'UOB', last4: '2280', color: '#003DA5' },
];

// "Small" (card-sized) vs "large" (transfer-sized) magnitude ranges, in SGD.
const AMOUNT_RANGE = { small: [15, 3500] as [number, number], large: [200, 250000] as [number, number] };

const COUNTERPARTIES = [
  'XYZ Company Pte Ltd',
  'Ang Mo Kio Supplies',
  'Tanjong Freight Services',
  'Marina Bay Consultants',
  'Orchard Retail Group',
  'Bugis Creative Agency',
  'Clementi Tech Ventures',
  'Jurong Industrial Supplies',
];

const MERCHANTS = [
  'Lazada Singapore',
  'Grab Business',
  'Amazon Web Services',
  'Singtel Business',
  'Shopee Singapore',
  'Microsoft 365',
  'Google Workspace',
];

const MONTHS = ['June', 'July', 'August', 'September', 'October'];

export type Transaction = {
  id: string;
  description: string;
  bank: BankAccount;
  amount: number;
  daysAgo: number;
  status: TransactionStatus;
};

function pick<T>(rng: () => number, options: T[]): T {
  return options[randomInt(rng, 0, options.length - 1)];
}

const TXN_KINDS = ['paynow-to', 'paynow-from', 'card', 'giro', 'transfer', 'cheque', 'stripe'] as const;

function buildTransaction(
  rng: () => number,
  id: string,
  forcedStatus: TransactionStatus | undefined
): Transaction {
  const kind = pick(rng, [...TXN_KINDS]);
  const bank = pick(rng, BANK_ACCOUNTS);

  let description: string;
  let sign: 1 | -1;
  let magnitude: [number, number];

  switch (kind) {
    case 'paynow-to':
      description = `PayNow transfer to ${pick(rng, COUNTERPARTIES)}`;
      sign = -1;
      magnitude = AMOUNT_RANGE.large;
      break;
    case 'paynow-from':
      description = `PayNow transfer from ${pick(rng, COUNTERPARTIES)}`;
      sign = 1;
      magnitude = AMOUNT_RANGE.large;
      break;
    case 'card':
      description = `Debit card — ${pick(rng, MERCHANTS)}`;
      sign = -1;
      magnitude = AMOUNT_RANGE.small;
      break;
    case 'giro':
      description = `GIRO — ${pick(rng, MERCHANTS)}`;
      sign = rng() < 0.5 ? 1 : -1;
      magnitude = AMOUNT_RANGE.large;
      break;
    case 'transfer':
      description = `Transfer to ${pick(rng, COUNTERPARTIES)}`;
      sign = -1;
      magnitude = AMOUNT_RANGE.large;
      break;
    case 'cheque':
      description = `Cheque deposit ${randomInt(rng, 100000, 999999)}`;
      sign = 1;
      magnitude = AMOUNT_RANGE.large;
      break;
    case 'stripe':
      description = `Stripe payout — ${pick(rng, MONTHS)} settlement`;
      sign = -1;
      magnitude = AMOUNT_RANGE.small;
      break;
  }

  // Cents-precision draw, so amounts don't all land on round numbers.
  const amount = (sign * randomInt(rng, magnitude[0] * 100, magnitude[1] * 100)) / 100;

  return {
    id,
    description,
    bank,
    amount,
    daysAgo: randomInt(rng, 0, 45),
    status: forcedStatus ?? pick(rng, STATUS_POOL),
  };
}

/** Seeded per company + tab — same company always shows the same rows, and switching tabs
 * doesn't reshuffle the other tab's data. `count` comes from the exact same
 * `computeTodoCounts` the Work Queue nav badge and "To do for the day" list use, so this table
 * can never show a row count that disagrees with what the rest of the app already promised. */
function generateTransactions(company: Company, tabKey: string, count: number): Transaction[] {
  const rng = createRng(`${company.id}:transactions:${tabKey}`);
  const rows = Array.from({ length: count }, (_, i) => buildTransaction(rng, `${tabKey}-${i}`, undefined));
  return rows.sort((a, b) => a.daysAgo - b.daysAgo);
}

function formatAmount(amount: number): string {
  const sign = amount < 0 ? '−' : '+';
  return `${sign}S$${formatMoney(Math.abs(amount))}`;
}

function dateParts(daysAgo: number): { month: string; year: string; day: number } {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    year: date.toLocaleDateString('en-US', { year: '2-digit' }),
    day: date.getDate(),
  };
}

function DateBadge({ daysAgo }: { daysAgo: number }) {
  const { month, year, day } = dateParts(daysAgo);
  return (
    // Square, ~56x56 — two separately-padded sections with a full-bleed divider between them
    // (not a short centered line inside shared padding); `overflow-hidden` keeps the divider's
    // edges from poking past the rounding. Padding trimmed down from an earlier pass that made
    // this noticeably taller than it is wide.
    <View className="w-14 overflow-hidden rounded-xl bg-muted">
      <View className="items-center px-2 py-1.5">
        <Text className="text-[10px] font-plex-semibold uppercase text-muted-foreground">
          {month} {year}
        </Text>
      </View>
      <View className="h-px w-full bg-white" />
      <View className="items-center px-2 py-1.5">
        <Text className="text-base font-plex-bold leading-none text-foreground">{day}</Text>
      </View>
    </View>
  );
}

function BankAccountLabel({ bank }: { bank: BankAccount }) {
  return (
    <View className="flex-row items-center gap-2">
      <View
        style={{ width: 20, height: 20, backgroundColor: bank.color }}
        className="items-center justify-center rounded-full">
        <Icon as={Landmark} size={12} className="text-white" />
      </View>
      <Text className="text-sm text-muted-foreground">
        {bank.bank} · {bank.last4}
      </Text>
    </View>
  );
}

function StatusPill({ status }: { status: TransactionStatus }) {
  const meta = STATUS_META[status];
  return (
    <View
      style={{ backgroundColor: hexToRgba(meta.color, 0.12) }}
      className="flex-row items-center gap-1.5 self-start rounded-md px-2.5 py-1.5">
      <Icon as={meta.icon} size={14} color={meta.color} />
      <Text style={{ color: meta.color }} className="text-sm font-plex-medium">
        {meta.label}
      </Text>
    </View>
  );
}

/** Desktop table row — DATE / DESCRIPTION / BANK ACCOUNT / AMOUNT / STATUS columns, plus a
 * trailing chevron since the whole row is clickable (destination TBD — "will design later"). */
function DesktopTransactionRow({ txn, isLast }: { txn: Transaction; isLast: boolean }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <Pressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="button"
      style={{ backgroundColor: hovered ? '#FAFAFA' : 'transparent' }}
      className={cn('hidden flex-row items-center gap-4 px-6 py-4 web:cursor-pointer md:flex md:px-4', !isLast && 'border-b border-border')}>
      <View className="w-16">
        <DateBadge daysAgo={txn.daysAgo} />
      </View>
      <Text className="flex-1 text-base font-plex-regular text-foreground" numberOfLines={2}>
        {txn.description}
      </Text>
      <View className="w-[150px]">
        <BankAccountLabel bank={txn.bank} />
      </View>
      <Text className="w-[130px] text-right text-base font-plex-semibold text-foreground">
        {formatAmount(txn.amount)}
      </Text>
      <View className="w-[170px]">
        <StatusPill status={txn.status} />
      </View>
      <Icon as={ChevronRight} size={16} className="text-muted-foreground" />
    </Pressable>
  );
}

/** Mobile card — identity block on top, a status-tinted footer strip (label + amount + chevron)
 * below, so status reads as the row's "current state" rather than one more inline detail. */
function MobileTransactionCard({ txn }: { txn: Transaction }) {
  const meta = STATUS_META[txn.status];
  return (
    <Pressable
      accessibilityRole="button"
      className="overflow-hidden rounded-2xl border border-border bg-white web:cursor-pointer md:hidden">
      <View className="flex-row items-start gap-3 p-4">
        <DateBadge daysAgo={txn.daysAgo} />
        <View className="flex-1 gap-1.5">
          <Text className="text-base font-plex-regular text-foreground" numberOfLines={2}>
            {txn.description}
          </Text>
          <BankAccountLabel bank={txn.bank} />
        </View>
      </View>
      <View
        style={{ backgroundColor: hexToRgba(meta.color, 0.12) }}
        className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center gap-1.5">
          <Icon as={meta.icon} size={14} color={meta.color} />
          <Text style={{ color: meta.color }} className="text-sm font-plex-medium">
            {meta.label}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Text className="text-base font-plex-bold text-foreground">{formatAmount(txn.amount)}</Text>
          <Icon as={ChevronRight} size={16} className="text-muted-foreground" />
        </View>
      </View>
    </Pressable>
  );
}

const PAGE_SIZE = 10;

function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  const [visibleCount, setVisibleCount] = React.useState(Math.min(PAGE_SIZE, transactions.length));

  // Reset to the first page whenever the underlying list changes (e.g. the filter/tab changes)
  // instead of carrying over a `visibleCount` that belonged to a different, differently-sized
  // list.
  React.useEffect(() => {
    setVisibleCount(Math.min(PAGE_SIZE, transactions.length));
  }, [transactions]);

  const loadMore = React.useCallback(() => {
    setVisibleCount((count) => Math.min(count + PAGE_SIZE, transactions.length));
  }, [transactions.length]);

  useOnScrollEnd(loadMore);

  if (transactions.length === 0) {
    return (
      <View className="items-center gap-2 px-6 py-16">
        <Icon as={Inbox} size={28} className="text-muted-foreground" />
        <Text className="text-sm text-muted-foreground">No transactions match this filter.</Text>
      </View>
    );
  }

  const visible = transactions.slice(0, visibleCount);

  return (
    <View>
      {/* Desktop-only header row — mobile cards carry their own labels inline. */}
      <View className="hidden flex-row items-center gap-4 bg-muted px-6 py-2.5 md:flex md:px-4">
        <Text className="w-16 text-xs font-plex-semibold uppercase tracking-wide text-muted-foreground">
          Date
        </Text>
        <Text className="flex-1 text-xs font-plex-semibold uppercase tracking-wide text-muted-foreground">
          Description
        </Text>
        <Text className="w-[150px] text-xs font-plex-semibold uppercase tracking-wide text-muted-foreground">
          Bank account
        </Text>
        <Text className="w-[130px] text-right text-xs font-plex-semibold uppercase tracking-wide text-muted-foreground">
          Amount
        </Text>
        <Text className="w-[170px] text-xs font-plex-semibold uppercase tracking-wide text-muted-foreground">
          Status
        </Text>
        <View style={{ width: 16 }} />
      </View>

      <View className="hidden md:flex">
        {visible.map((txn, index) => (
          <DesktopTransactionRow key={txn.id} txn={txn} isLast={index === visible.length - 1} />
        ))}
      </View>

      <View className="gap-3 p-4 md:hidden">
        {visible.map((txn) => (
          <MobileTransactionCard key={txn.id} txn={txn} />
        ))}
      </View>
    </View>
  );
}

const TABS = [
  { key: 'pending-transactions', label: 'Pending transactions' },
  { key: 'documents', label: 'Documents' },
] as const;

export type WorkQueueTabKey = (typeof TABS)[number]['key'];

function isWorkQueueTabKey(value: string | undefined): value is WorkQueueTabKey {
  return TABS.some((t) => t.key === value);
}

export function WorkQueuePage({
  company,
  stickyOffset,
  initialTab,
}: {
  company: Company;
  /** The page title row's measured height — this page's own sticky tabs/filter bar stack
   * directly below it, not at the viewport's very top. */
  stickyOffset: number;
  /** Set by whatever navigated here — e.g. the "documents to upload" to-do item wants this
   * page to open straight on the Documents tab, not the default. Loosely typed as `string` by
   * the caller (shell.tsx tracks it as generic nav state), so it's validated here rather than
   * trusted — an unrecognized value just falls back to the default tab. */
  initialTab?: string;
}) {
  const [tab, setTab] = React.useState<WorkQueueTabKey>(
    isWorkQueueTabKey(initialTab) ? initialTab : 'pending-transactions'
  );
  const [statusFilter, setStatusFilter] = React.useState<StatusFilterValue>('needs-attention');
  const [query, setQuery] = React.useState('');
  const [tabsHeight, setTabsHeight] = React.useState(0);
  const counts = React.useMemo(() => computeTodoCounts(company), [company]);

  const allTransactions = React.useMemo(() => {
    if (tab !== 'pending-transactions') return [];
    return generateTransactions(company, 'pending-transactions', counts.pendingTransactions);
  }, [company, tab, counts]);

  const filtered = React.useMemo(() => {
    let rows = allTransactions;
    if (statusFilter !== 'needs-attention') {
      rows = rows.filter((t) => t.status === statusFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) rows = rows.filter((t) => t.description.toLowerCase().includes(q));
    return rows;
  }, [allTransactions, statusFilter, query]);

  return (
    <>
      {/* Tabs sit on the gray canvas, above the white box — not nested inside it. Sticky right
          below the title row (not at the viewport top): stacked sticky elements within the same
          scroll container each just need a `top` past whatever sticky layer(s) come before
          them. Opaque bg for the same reason the title row needs one — otherwise table rows
          scrolling underneath would show through once this is pinned. */}
      <View
        onLayout={(e) => setTabsHeight(e.nativeEvent.layout.height)}
        style={{ position: 'sticky', top: stickyOffset, zIndex: 9 } as ViewStyle}
        className="mb-4 bg-[#F4F5FA] px-6 py-1 md:px-0">
        <SegmentedControl
          value={tab}
          onValueChange={(value) => setTab(value as WorkQueueTabKey)}
          options={TABS.map((t) => ({
            value: t.key,
            label: t.label,
            count: t.key === 'documents' ? counts.documents : counts.pendingTransactions,
          }))}
        />
      </View>

      {/* The box's left border now lines up with the title/tabs via the shared page wrapper's
          own md:pl-8 (app/shell.tsx) — no page-specific margin needed here anymore. */}
      <View className="bg-white md:rounded-3xl md:border md:border-[#E4E4E7] md:shadow-sm md:shadow-black/5">
        {tab === 'documents' ? (
          <View className="items-center gap-2 px-6 py-16">
            <Icon as={Inbox} size={28} className="text-muted-foreground" />
            <Text className="text-sm text-muted-foreground">Documents view is coming soon.</Text>
          </View>
        ) : (
          <>
            {/* Third sticky layer, stacked below the title + tabs. */}
            <View
              style={
                {
                  position: 'sticky',
                  top: stickyOffset + tabsHeight,
                  zIndex: 8,
                } as ViewStyle
              }
              className="bg-white md:rounded-t-3xl">
              <WorkQueueFilterBar
                value={statusFilter}
                onValueChange={setStatusFilter}
                totalCount={allTransactions.length}
                query={query}
                onQueryChange={setQuery}
              />
            </View>
            {/* Clipped only around the table, with rounded bottom corners matching the box —
                the filter row above stays unclipped so its dropdown can escape the box. Flush,
                no inner padding/border of its own — no more box-within-a-box. */}
            <View className="md:overflow-hidden md:rounded-b-3xl">
              <TransactionsTable transactions={filtered} />
            </View>
          </>
        )}
      </View>
    </>
  );
}
