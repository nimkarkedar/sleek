/**
 * Demo content for each report's detail view — transcribed from the product reference screens.
 * Figures are fixed (not seeded per company) so the statements always tie out: P&L net profit
 * = balance sheet current-year earnings = cash flow's starting line, trial balance debits =
 * credits, and every aged/schedule total matches its row on the Reports overview.
 */

import {
  ArrowLeftRight,
  BookOpen,
  Box,
  CalendarDays,
  Clock,
  CreditCard,
  Landmark,
  Scale,
  Table2,
  TrendingUp,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';

// ---------------------------------------------------------------------------------------------
// The 11 reports, in their four sections — the one list All reports, the viewer, templates and
// client reports all read from.
// ---------------------------------------------------------------------------------------------

export type Tone = 'success' | 'warning' | 'neutral';

export type ReportMeta = {
  key: string;
  name: string;
  icon: LucideIcon;
  /** `range` — covers the selected period; `asAt` — a snapshot at its end date. */
  periodKind: 'range' | 'asAt';
  figure: string;
  caption: string;
  status?: { tone: Tone; label: string };
};

export type ReportSection = { key: string; label: string; reports: ReportMeta[] };

export const REPORT_SECTIONS: ReportSection[] = [
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

export const ALL_REPORTS: ReportMeta[] = REPORT_SECTIONS.flatMap((s) => s.reports);

export function reportName(key: string): string {
  return ALL_REPORTS.find((r) => r.key === key)?.name ?? key;
}

export const ACCOUNTS: Record<string, string> = {
  '090': 'Business account',
  '091': 'Business savings',
  '200': 'Sales',
  '260': 'Other revenue',
  '270': 'Interest income',
  '310': 'Cost of goods sold',
  '400': 'Advertising',
  '404': 'Bank fees',
  '412': 'Consulting & accounting',
  '416': 'Depreciation',
  '433': 'Insurance',
  '453': 'Office expenses',
  '469': 'Rent',
  '477': 'Salaries',
  '478': 'CPF contributions',
  '485': 'Subscriptions',
  '610': 'Accounts receivable',
  '620': 'Prepayments',
  '720': 'Computer equipment',
  '721': 'Accumulated depreciation',
  '800': 'Accounts payable',
  '820': 'GST payable',
  '835': "Director's loan",
  '960': 'Retained earnings',
  '970': 'Share capital',
  '980': 'Current year earnings',
};

/** A table cell: a number (formatted, negatives in brackets), text, a status pill, or `null`
 * for "nothing here" (rendered as a dash). */
export type Cell = number | string | null | { pill: { label: string; tone: Tone } };

/** What a row's label links to. */
export type RowLink =
  { kind: 'account'; code: string } | { kind: 'customer' } | { kind: 'supplier' };

export type Row =
  | { kind: 'section'; label: string }
  | { kind: 'line'; label: string; code?: string; link?: RowLink; cells: Cell[] }
  /** Bold running total inside the table. */
  | { kind: 'subtotal'; label: string; cells: Cell[] }
  /** The statement's bottom line — bold on a shaded band. */
  | { kind: 'total'; label: string; cells: Cell[] };

/** `{FY}` / `{PRIOR_FY}` in a label are replaced with the selected period's financial years. */
export type Column = { label: string; align?: 'left' | 'right'; muted?: boolean; flex?: number };

export type ReportDetail = {
  /** How the subtitle describes the period. */
  periodKind: 'yearEnding' | 'asAt' | 'range';
  /** Shows the Compare control; the last cell of every row is the prior-year figure. */
  comparable?: boolean;
  columns: Column[];
  rows: Row[];
};

const acct = (code: string, cells: Cell[]): Row => ({
  kind: 'line',
  label: ACCOUNTS[code],
  code,
  link: { kind: 'account', code },
  cells,
});

const FY: Column[] = [
  { label: '{FY}', align: 'right' },
  { label: '{PRIOR_FY}', align: 'right' },
];

export const REPORT_DETAILS: Record<string, ReportDetail> = {
  'profit-and-loss': {
    periodKind: 'yearEnding',
    comparable: true,
    columns: [{ label: 'Account', flex: 1 }, ...FY],
    rows: [
      { kind: 'section', label: 'Income' },
      acct('200', [412600, 365200]),
      acct('260', [3150, 2480]),
      acct('270', [420, 310]),
      { kind: 'subtotal', label: 'Total income', cells: [416170, 367990] },
      { kind: 'section', label: 'Cost of sales' },
      acct('310', [186300, 171900]),
      { kind: 'subtotal', label: 'Gross profit', cells: [229870, 196090] },
      { kind: 'section', label: 'Operating expenses' },
      acct('400', [12450, 9800]),
      acct('404', [1120, 980]),
      acct('412', [8400, 7900]),
      acct('416', [2100, 1600]),
      acct('433', [3600, 3450]),
      acct('453', [9870, 8300]),
      acct('469', [36000, 36000]),
      acct('477', [89400, 88000]),
      acct('478', [12480, 11200]),
      acct('485', [6240, 5110]),
      { kind: 'subtotal', label: 'Total operating expenses', cells: [181660, 172340] },
      { kind: 'total', label: 'Net profit', cells: [48210, 23750] },
    ],
  },
  'balance-sheet': {
    periodKind: 'asAt',
    comparable: true,
    columns: [{ label: 'Account', flex: 1 }, ...FY],
    rows: [
      { kind: 'section', label: 'Current assets' },
      acct('090', [82713, 41200]),
      acct('091', [25000, 23288]),
      acct('610', [34120, 29400]),
      acct('620', [6400, 4800]),
      { kind: 'subtotal', label: 'Total current assets', cells: [148233, 98688] },
      { kind: 'section', label: 'Non-current assets' },
      acct('720', [14800, 12300]),
      acct('721', [-5200, -3100]),
      { kind: 'subtotal', label: 'Total non-current assets', cells: [9600, 9200] },
      { kind: 'subtotal', label: 'Total assets', cells: [157833, 107888] },
      { kind: 'section', label: 'Current liabilities' },
      acct('800', [9845, 8900]),
      acct('820', [6730, 5940]),
      acct('835', [15000, 15000]),
      { kind: 'subtotal', label: 'Total liabilities', cells: [31575, 29840] },
      { kind: 'total', label: 'Net assets', cells: [126258, 78048] },
      { kind: 'section', label: 'Equity' },
      acct('970', [100000, 100000]),
      acct('960', [-21952, -45702]),
      acct('980', [48210, 23750]),
      { kind: 'total', label: 'Total equity', cells: [126258, 78048] },
    ],
  },
  'cash-flow': {
    periodKind: 'yearEnding',
    columns: [
      { label: 'Activity', flex: 1 },
      { label: '{FY}', align: 'right' },
    ],
    rows: [
      { kind: 'section', label: 'Operating activities' },
      { kind: 'line', label: 'Net profit', cells: [48210] },
      { kind: 'line', label: 'Add back depreciation', cells: [2100] },
      { kind: 'line', label: 'Increase in receivables', cells: [-4720] },
      { kind: 'line', label: 'Increase in prepayments', cells: [-1600] },
      { kind: 'line', label: 'Increase in payables', cells: [945] },
      { kind: 'line', label: 'Increase in GST payable', cells: [790] },
      { kind: 'subtotal', label: 'Net cash from operating activities', cells: [45725] },
      { kind: 'section', label: 'Investing activities' },
      { kind: 'line', label: 'Purchase of computer equipment', cells: [-2500] },
      { kind: 'subtotal', label: 'Net cash from investing activities', cells: [-2500] },
      { kind: 'section', label: 'Financing activities' },
      { kind: 'line', label: "Director's loan movement", cells: [null] },
      { kind: 'subtotal', label: 'Net cash from financing activities', cells: [null] },
      { kind: 'total', label: 'Net change in cash', cells: [43225] },
      { kind: 'line', label: 'Cash at start of year', cells: [64488] },
      { kind: 'subtotal', label: 'Cash at end of year', cells: [107713] },
    ],
  },
  'trial-balance': {
    periodKind: 'asAt',
    columns: [
      { label: 'Account', flex: 1 },
      { label: 'Debit', align: 'right' },
      { label: 'Credit', align: 'right' },
    ],
    rows: [
      acct('090', [82713, null]),
      acct('091', [25000, null]),
      acct('610', [34120, null]),
      acct('620', [6400, null]),
      acct('720', [14800, null]),
      acct('721', [null, 5200]),
      acct('800', [null, 9845]),
      acct('820', [null, 6730]),
      acct('835', [null, 15000]),
      acct('970', [null, 100000]),
      acct('960', [21952, null]),
      acct('200', [null, 412600]),
      acct('260', [null, 3150]),
      acct('270', [null, 420]),
      acct('310', [186300, null]),
      acct('400', [12450, null]),
      acct('404', [1120, null]),
      acct('412', [8400, null]),
      acct('416', [2100, null]),
      acct('433', [3600, null]),
      acct('453', [9870, null]),
      acct('469', [36000, null]),
      acct('477', [89400, null]),
      acct('478', [12480, null]),
      acct('485', [6240, null]),
      { kind: 'total', label: 'Total', cells: [552945, 552945] },
    ],
  },
  'bank-reconciliation': {
    periodKind: 'asAt',
    columns: [
      { label: 'Bank account', flex: 1 },
      { label: 'Ledger balance', align: 'right' },
      { label: 'Bank balance', align: 'right' },
      { label: 'Difference', align: 'right' },
      { label: 'Status', align: 'right', flex: 1 },
    ],
    rows: [
      acct('090', [82713, 82713, null, { pill: { label: 'Reconciled', tone: 'success' } }]),
      acct('091', [
        25000,
        25180,
        180,
        { pill: { label: '4 lines to reconcile', tone: 'warning' } },
      ]),
    ],
  },
  'aged-receivables': {
    periodKind: 'asAt',
    columns: [
      { label: 'Customer', flex: 1 },
      { label: 'Current', align: 'right' },
      { label: '1 month', align: 'right' },
      { label: '2 months', align: 'right' },
      { label: '3 months', align: 'right' },
      { label: 'Older', align: 'right' },
      { label: 'Total', align: 'right' },
    ],
    rows: [
      {
        kind: 'line',
        label: 'Harbour Café',
        link: { kind: 'customer' },
        cells: [8200, 4200, null, null, null, 12400],
      },
      {
        kind: 'line',
        label: 'Lumen Studio',
        link: { kind: 'customer' },
        cells: [9320, null, null, null, null, 9320],
      },
      {
        kind: 'line',
        label: 'Northpoint Retail',
        link: { kind: 'customer' },
        cells: [null, null, 3000, 4200, null, 7200],
      },
      {
        kind: 'line',
        label: 'Kopi & Co',
        link: { kind: 'customer' },
        cells: [null, null, null, null, 5200, 5200],
      },
      { kind: 'total', label: 'Total', cells: [17520, 4200, 3000, 4200, 5200, 34120] },
    ],
  },
  'aged-payables': {
    periodKind: 'asAt',
    columns: [
      { label: 'Supplier', flex: 1 },
      { label: 'Current', align: 'right' },
      { label: '1 month', align: 'right' },
      { label: '2 months', align: 'right' },
      { label: '3 months', align: 'right' },
      { label: 'Older', align: 'right' },
      { label: 'Total', align: 'right' },
    ],
    rows: [
      {
        kind: 'line',
        label: 'Grain Supply Co',
        link: { kind: 'supplier' },
        cells: [5420, null, null, null, null, 5420],
      },
      {
        kind: 'line',
        label: 'Pixel Hosting',
        link: { kind: 'supplier' },
        cells: [1285, null, null, null, null, 1285],
      },
      {
        kind: 'line',
        label: 'Office Hub',
        link: { kind: 'supplier' },
        cells: [null, 3140, null, null, null, 3140],
      },
      { kind: 'total', label: 'Total', cells: [6705, 3140, null, null, null, 9845] },
    ],
  },
  prepayments: {
    periodKind: 'yearEnding',
    columns: [
      { label: 'Item', flex: 1 },
      { label: 'Opening', align: 'right' },
      { label: 'Additions', align: 'right' },
      { label: 'Released', align: 'right' },
      { label: 'Closing', align: 'right' },
    ],
    rows: [
      { kind: 'line', label: 'Annual insurance policy', cells: [3000, 3600, 3000, 3600] },
      { kind: 'line', label: 'Accounting software licence', cells: [1800, 4800, 3800, 2800] },
      { kind: 'total', label: 'Total', cells: [4800, 8400, 6800, 6400] },
    ],
  },
  'directors-loan': {
    periodKind: 'yearEnding',
    columns: [
      { label: 'Director', flex: 1 },
      { label: 'Opening', align: 'right' },
      { label: 'Advances', align: 'right' },
      { label: 'Repayments', align: 'right' },
      { label: 'Closing', align: 'right' },
    ],
    rows: [
      { kind: 'line', label: 'Tan Wei Ming (director)', cells: [15000, null, null, 15000] },
      { kind: 'total', label: 'Total', cells: [15000, null, null, 15000] },
    ],
  },
  'share-capital': {
    periodKind: 'asAt',
    columns: [
      { label: 'Class', flex: 1 },
      { label: 'Opening', align: 'right' },
      { label: 'Issued', align: 'right' },
      { label: 'Bought back', align: 'right' },
      { label: 'Closing', align: 'right' },
    ],
    rows: [
      { kind: 'line', label: 'Ordinary shares (100,000)', cells: [100000, null, null, 100000] },
      { kind: 'total', label: 'Total', cells: [100000, null, null, 100000] },
    ],
  },
};

/** General ledger entries per account, as `[dayOffsetFromPeriodStart, description, reference,
 * amount]` — dates are relative so they follow the selected period. Only the bank account has
 * entries in this demo; other accounts show an explanatory empty state. */
export const LEDGER_ENTRIES: Record<
  string,
  { opening: number; entries: [number, string, string, number][] }
> = {
  '090': {
    opening: 41200,
    entries: [
      [2, 'Harbour Café payment', 'INV-0412', 6400],
      [4, 'Rent April', 'BILL-2231', -3000],
      [11, 'Grain Supply Co', 'BILL-2240', -4180],
      [29, 'Salaries April', 'PAY-04', -7450],
    ],
  },
};

export const DEFAULT_LEDGER_ACCOUNT = '090';
