/**
 * Client reports and templates — the demo model behind Reports › Client reports and Templates.
 *
 * Templates are per client: a management accounts (MA) template and a financial statements (FS)
 * template. Client reports are versioned packs built from them. Northwind Trading Co. opens with
 * templates and a history; every other client opens in the first-run state (no templates).
 */
import { ALL_REPORTS, reportName } from '@/components/workspace/report-data';
import type { Company } from '@/lib/companies';
import { createRng, randomInt } from '@/lib/seeded-random';

/** The prototype's "today" — a few days after the Mar 2027 year end, so the March draft has just
 * been created automatically and the FY2027 statements are due. */
export const DEMO_TODAY = new Date(2027, 3, 8);

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_SHORT = MONTHS_LONG.map((m) => m.slice(0, 3));

export function formatDate(d: Date): string {
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function compactDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

// ---------------------------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------------------------

export type Frequency = 'monthly' | 'quarterly' | 'yearly';
export type CompareWith = 'same-last-year' | 'previous' | 'none';

export type ContentItem = { key: string; included: boolean };

export type MaTemplate = {
  fileName: string;
  capitals: boolean;
  frequency: Frequency;
  compareWith: CompareWith;
  comparePeriods: number;
  yearToDate: boolean;
  autoDraft: boolean;
  autoDays: string;
  notifyRole: string;
  recipientName: string;
  recipientEmail: string;
  contents: ContentItem[];
  showCodes: boolean;
  hideZero: boolean;
  amounts: 'whole' | 'cents';
  exportFormat: 'pdf' | 'excel';
};

export type Director = {
  id: string;
  name: string;
  appointed: string;
  resigned?: string;
  signs: boolean;
  /** Added by hand rather than synced from ACRA. */
  manual?: boolean;
};

export type Policy = {
  key: string;
  title: string;
  text: string;
  on: boolean;
  /** Why it's suggested off ("No borrowings this year"). */
  offReason?: string;
  /** Shown in amber when the policy is off but the ledger says it applies. */
  warnIfOff?: string;
};

export type RelatedParty = {
  id: string;
  party: string;
  relationship: string;
  transaction: string;
  terms: string;
};

export type EntityDetails = {
  legalName: string;
  uen: string;
  office: string;
  activity: string;
  incorporated: string;
  yearEnd: string;
};

export type FsTemplate = {
  entity: EntityDetails;
  entityOverridden: boolean;
  compilationSigner: string;
  signingDate: string;
  currency: string;
  firstYear: boolean;
  gstRegistered: boolean;
  dividends: boolean;
  directors: Director[];
  policies: Policy[];
  statementDetail: 'summary' | 'every';
  relatedParties: RelatedParty[];
  /** Disclosures suggested from the ledger, waiting for Add or Dismiss. */
  suggestedParties: RelatedParty[];
  framework: string;
  standard: 'sfrs-se' | 'sfrs' | 'sfrs-i';
  auditExempt: boolean;
  goingConcern: boolean;
  historicalCost: boolean;
};

export type Templates = { ma: MaTemplate; fs: FsTemplate };

export const FILE_NAME_TOKENS = ['Date created', 'Entity', 'Period', 'Report type'] as const;
export const DEFAULT_FILE_NAME = '{Date created} - {Entity} - {Report type} - {Period}';

export const NOTIFY_ROLES = ['Accounting Head', 'Reviewer', 'Preparer'];
export const PRACTICE_SIGNERS = ['Rachel Koh, CA (Singapore)', 'Daniel Wong, CA (Singapore)'];

/** Cover page and commentary, then the 11 reports. */
export const CONTENT_NAMES: Record<string, string> = {
  cover: 'Cover page',
  commentary: 'Commentary',
  ...Object.fromEntries(ALL_REPORTS.map((r) => [r.key, r.name])),
};

const DEFAULT_ON = new Set([
  'cover',
  'commentary',
  'profit-and-loss',
  'balance-sheet',
  'cash-flow',
  'trial-balance',
  'aged-receivables',
  'aged-payables',
  'bank-reconciliation',
]);

const CONTENT_ORDER = [
  'cover',
  'commentary',
  'profit-and-loss',
  'balance-sheet',
  'cash-flow',
  'trial-balance',
  'aged-receivables',
  'aged-payables',
  'bank-reconciliation',
  'general-ledger',
  'prepayments',
  'directors-loan',
  'share-capital',
];

/** The financial statements' fixed statutory structure. */
export const FS_CONTENTS: { key: string; name: string }[] = [
  { key: 'cover', name: 'Cover page' },
  { key: 'directors-statement', name: "Directors' statement" },
  { key: 'compilation-report', name: 'Compilation report' },
  { key: 'financial-position', name: 'Statement of financial position' },
  { key: 'comprehensive-income', name: 'Statement of comprehensive income' },
  { key: 'changes-in-equity', name: 'Statement of changes in equity' },
  { key: 'cash-flows', name: 'Statement of cash flows' },
  { key: 'notes', name: 'Notes to the financial statements' },
];

export const STANDARD_LABEL: Record<FsTemplate['standard'], string> = {
  'sfrs-se': 'SFRS for Small Entities',
  sfrs: 'SFRS',
  'sfrs-i': 'SFRS(I)',
};

type CompanyPeople = { directors: Director[]; recipientName: string; recipientEmail: string };

const FIRST_NAMES = ['Wei Jie', 'Siew Ling', 'Arjun', 'Hui Min', 'Marcus', 'Priya', 'Kai Xin'];
const SURNAMES = ['Lee', 'Chua', 'Nair', 'Goh', 'Teo', 'Rahman', 'Ng'];

function peopleFor(company: Company): CompanyPeople {
  if (company.id === 'northwind') {
    return {
      directors: [
        { id: 'd1', name: 'Jane Tan', appointed: '12 Mar 2019', signs: false },
        { id: 'd2', name: 'Tan Wei Ming', appointed: '12 Mar 2019', signs: false },
        {
          id: 'd3',
          name: 'Lim Mei Ling',
          appointed: '2 Jan 2020',
          resigned: '30 Jun 2025',
          signs: false,
        },
      ],
      recipientName: 'Jane Tan, Director',
      recipientEmail: 'jane.tan@northwind.sg',
    };
  }
  if (company.id === 'acme') {
    return {
      directors: [
        { id: 'd1', name: 'Aaron Lim', appointed: '4 Aug 2021', signs: false },
        { id: 'd2', name: 'Grace Ong', appointed: '4 Aug 2021', signs: false },
      ],
      recipientName: 'Aaron Lim, Director',
      recipientEmail: 'aaron@acme.sg',
    };
  }
  const rng = createRng(`${company.id}-directors`);
  const pick = <T,>(list: T[]) => list[randomInt(rng, 0, list.length - 1)];
  const names = [`${pick(FIRST_NAMES)} ${pick(SURNAMES)}`, `${pick(FIRST_NAMES)} ${pick(SURNAMES)}`];
  const appointed = `${randomInt(rng, 1, 28)} ${pick(MONTHS_SHORT)} ${randomInt(rng, 2012, 2022)}`;
  const domain = company.name.split(' ')[0].toLowerCase();
  return {
    directors: names.map((name, i) => ({ id: `d${i + 1}`, name, appointed, signs: false })),
    recipientName: `${names[0]}, Director`,
    recipientEmail: `${names[0].split(' ')[0].toLowerCase()}@${domain}.sg`,
  };
}

function legalName(company: Company): string {
  if (/Pte Ltd$/.test(company.name)) return company.name.replace(/Pte Ltd$/, 'Pte. Ltd.');
  return `${company.name} Pte. Ltd.`;
}

const OFFICES = [
  '10 Anson Road, #22-02 International Plaza, Singapore 079903',
  '1 Raffles Place, #19-61 One Raffles Place, Singapore 048616',
  '60 Paya Lebar Road, #07-54 Paya Lebar Square, Singapore 409051',
];

const ACTIVITIES = [
  '46900 Wholesale trade of a variety of goods',
  '70201 Management consultancy services',
  '62011 Development of software and applications',
];

function entityFor(company: Company): EntityDetails {
  const rng = createRng(`${company.id}-entity`);
  const year = company.id === 'northwind' ? 2019 : randomInt(rng, 2012, 2021);
  const letter = 'CDEGHKMNRWZ'[randomInt(rng, 0, 10)];
  return {
    legalName: legalName(company),
    uen: `${year}${randomInt(rng, 10000, 99999)}${letter}`,
    office: company.id === 'northwind' ? OFFICES[0] : OFFICES[randomInt(rng, 0, OFFICES.length - 1)],
    activity:
      company.id === 'northwind' ? ACTIVITIES[0] : ACTIVITIES[randomInt(rng, 0, ACTIVITIES.length - 1)],
    incorporated: `${randomInt(rng, 1, 28)} ${MONTHS_LONG[randomInt(rng, 0, 11)]} ${year}`,
    yearEnd: '31 March',
  };
}

function defaultPolicies(): Policy[] {
  return [
    {
      key: 'revenue',
      title: 'Revenue recognition',
      text: 'Revenue from the sale of goods is recognised when control of the goods passes to the customer, usually on delivery.',
      on: true,
    },
    {
      key: 'inventories',
      title: 'Inventories',
      text: 'Inventories are stated at the lower of cost and net realisable value, with cost determined on a first-in, first-out basis.',
      on: false,
      warnIfOff: 'Cost of goods sold has a balance this year',
    },
    {
      key: 'plant-equipment',
      title: 'Plant and equipment',
      text: 'Plant and equipment are stated at cost less accumulated depreciation, depreciated on a straight-line basis over three years.',
      on: true,
    },
    {
      key: 'receivables',
      title: 'Trade and other receivables',
      text: 'Trade receivables are recognised at their transaction price, less an allowance for amounts not expected to be collected.',
      on: true,
    },
    {
      key: 'employee-benefits',
      title: 'Employee benefits',
      text: 'Contributions to the Central Provident Fund are recognised as an expense in the period the related service is performed.',
      on: true,
    },
    {
      key: 'income-tax',
      title: 'Income tax',
      text: 'Income tax on the profit for the year comprises current tax, calculated at the rates enacted at the reporting date.',
      on: true,
    },
    {
      key: 'borrowings',
      title: 'Borrowings',
      text: 'Borrowings are recognised at the proceeds received, net of transaction costs.',
      on: false,
      offReason: 'No borrowings this year',
    },
    {
      key: 'leases',
      title: 'Leases',
      text: 'Lease payments on short-term leases are recognised as an expense on a straight-line basis over the lease term.',
      on: false,
      offReason: 'No lease liabilities this year',
    },
    {
      key: 'share-capital',
      title: 'Share capital',
      text: 'Ordinary shares are classified as equity.',
      on: true,
    },
  ];
}

export function defaultTemplates(company: Company): Templates {
  const people = peopleFor(company);
  const loanDirector = people.directors[1] ?? people.directors[0];
  return {
    ma: {
      fileName: DEFAULT_FILE_NAME,
      capitals: true,
      frequency: 'monthly',
      compareWith: 'same-last-year',
      comparePeriods: 1,
      yearToDate: true,
      autoDraft: true,
      autoDays: '5',
      notifyRole: NOTIFY_ROLES[0],
      recipientName: people.recipientName,
      recipientEmail: people.recipientEmail,
      contents: CONTENT_ORDER.map((key) => ({ key, included: DEFAULT_ON.has(key) })),
      showCodes: true,
      hideZero: true,
      amounts: 'whole',
      exportFormat: 'pdf',
    },
    fs: {
      entity: entityFor(company),
      entityOverridden: false,
      compilationSigner: '',
      signingDate: '',
      currency: 'SGD',
      firstYear: false,
      gstRegistered: true,
      dividends: false,
      directors: people.directors,
      policies: defaultPolicies(),
      statementDetail: 'summary',
      relatedParties: [],
      suggestedParties: [
        {
          id: 'suggested-loan',
          party: loanDirector.name,
          relationship: 'Director',
          transaction: 'Loan to the company, S$15,000 outstanding',
          terms: 'Interest-free, repayable on demand',
        },
      ],
      framework: 'Companies Act 1967',
      standard: 'sfrs-se',
      auditExempt: true,
      goingConcern: true,
      historicalCost: true,
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Template checks
// ---------------------------------------------------------------------------------------------

export function activeDirectors(fs: FsTemplate): Director[] {
  return fs.directors.filter((d) => !d.resigned);
}

/** 2 signers when the company has more than one director, otherwise 1. */
export function requiredSigners(fs: FsTemplate): number {
  return activeDirectors(fs).length > 1 ? 2 : 1;
}

export function signingDirectors(fs: FsTemplate): Director[] {
  return activeDirectors(fs).filter((d) => d.signs);
}

export type TemplatePage =
  | 'ma-general'
  | 'ma-reports'
  | 'ma-display'
  | 'fs-entity'
  | 'fs-directors'
  | 'fs-notes'
  | 'fs-related'
  | 'fs-compliance';

export type Issue = 'error' | 'warning';

/** Open issues per Templates page, for the icons in the Templates list. */
export function templateIssues(fs: FsTemplate): Partial<Record<TemplatePage, Issue>> {
  const issues: Partial<Record<TemplatePage, Issue>> = {};
  if (!fs.compilationSigner) issues['fs-entity'] = 'warning';
  if (signingDirectors(fs).length < requiredSigners(fs)) issues['fs-directors'] = 'error';
  if (fs.policies.some((p) => !p.on && p.warnIfOff)) issues['fs-notes'] = 'warning';
  return issues;
}

export type ReadinessCheck = {
  key: string;
  label: string;
  done: boolean;
  /** Blocking checks stop Send for signature; warnings don't. */
  blocking?: boolean;
  fix?:
    | { kind: 'template'; page: TemplatePage; label: string }
    | { kind: 'nav'; target: string; tab?: string; label: string };
};

/** Financial statements readiness — open items first, resolved ones at the bottom. */
export function readinessChecks(fs: FsTemplate): ReadinessCheck[] {
  const checks: ReadinessCheck[] = [
    { key: 'entity', label: 'Entity details synced from ACRA', done: true },
    {
      key: 'signers',
      label:
        requiredSigners(fs) === 2 ? 'Two signing directors chosen' : 'Signing director chosen',
      done: signingDirectors(fs).length >= requiredSigners(fs),
      blocking: true,
      fix: { kind: 'template', page: 'fs-directors', label: 'Fix in templates' },
    },
    {
      key: 'policies',
      label: "Accounting policies match this year's balances",
      done: !fs.policies.some((p) => !p.on && p.warnIfOff),
      fix: { kind: 'template', page: 'fs-notes', label: 'Fix in templates' },
    },
    {
      key: 'compiler',
      label: 'Compilation report signer added',
      done: !!fs.compilationSigner,
      fix: { kind: 'template', page: 'fs-entity', label: 'Fix in templates' },
    },
    {
      key: 'bank',
      label: 'Bank accounts reconciled',
      // The demo ledger always has one account left to reconcile (see Bank reconciliation).
      done: false,
      fix: { kind: 'nav', target: 'banking', tab: 'reconciliation', label: 'Reconcile in Banking' },
    },
  ];
  return [...checks.filter((c) => !c.done), ...checks.filter((c) => c.done)];
}

// ---------------------------------------------------------------------------------------------
// Periods
// ---------------------------------------------------------------------------------------------

/** A client report's period: its frequency and the month it ends ("2027-03"). */
export type ReportPeriod = { frequency: Frequency; end: string };

function parseEnd(end: string): { year: number; month: number } {
  const [y, m] = end.split('-').map(Number);
  return { year: y, month: m - 1 };
}

/** Financial year (Apr–Mar) a month belongs to, named by the year it ends in. */
function fyOf(year: number, month: number): number {
  return month >= 3 ? year + 1 : year;
}

function fyQuarter(month: number): number {
  return Math.floor(((month + 9) % 12) / 3) + 1;
}

export function periodLabel(p: ReportPeriod): string {
  const { year, month } = parseEnd(p.end);
  if (p.frequency === 'monthly') return `${MONTHS_LONG[month]} ${year}`;
  if (p.frequency === 'quarterly') {
    const startMonth = (month + 10) % 12;
    return `${MONTHS_SHORT[startMonth]} – ${MONTHS_SHORT[month]} ${year}`;
  }
  return `FY${fyOf(year, month)}`;
}

/** Short form used in file names ("Mar 2027", "Jan-Mar 2027", "FY2027"). */
function periodShort(p: ReportPeriod): string {
  const { year, month } = parseEnd(p.end);
  if (p.frequency === 'monthly') return `${MONTHS_SHORT[month]} ${year}`;
  if (p.frequency === 'quarterly') {
    return `${MONTHS_SHORT[(month + 10) % 12]}-${MONTHS_SHORT[month]} ${year}`;
  }
  return `FY${fyOf(year, month)}`;
}

export function dateTile(p: ReportPeriod): { top: string; bottom: string } {
  const { year, month } = parseEnd(p.end);
  if (p.frequency === 'monthly') return { top: String(year), bottom: MONTHS_SHORT[month] };
  if (p.frequency === 'quarterly') {
    return { top: `FY${String(fyOf(year, month)).slice(2)}`, bottom: `Q${fyQuarter(month)}` };
  }
  return { top: 'FY', bottom: String(fyOf(year, month)).slice(2) };
}

/** Periods that have ended by DEMO_TODAY, newest first — this financial year and last. */
export function periodsFor(frequency: Frequency): ReportPeriod[] {
  const out: ReportPeriod[] = [];
  const step = frequency === 'monthly' ? 1 : frequency === 'quarterly' ? 3 : 12;
  // Walk back from the last completed month end (Mar 2027) through two financial years.
  for (let i = 0; i < 24; i += step) {
    const d = new Date(DEMO_TODAY.getFullYear(), DEMO_TODAY.getMonth() - 1 - i, 1);
    out.push({
      frequency,
      end: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    });
  }
  return frequency === 'monthly' ? out.slice(0, 12) : out;
}

export function samePeriod(a: ReportPeriod, b: ReportPeriod): boolean {
  return a.frequency === b.frequency && a.end === b.end;
}

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

const UNIT: Record<Frequency, string> = { monthly: 'month', quarterly: 'quarter', yearly: 'year' };

export function compareOptions(frequency: Frequency): { value: CompareWith; label: string }[] {
  if (frequency === 'yearly') {
    return [
      { value: 'same-last-year', label: 'Prior year' },
      { value: 'none', label: 'None' },
    ];
  }
  return [
    { value: 'same-last-year', label: `Same ${UNIT[frequency]} last year` },
    { value: 'previous', label: `Previous ${UNIT[frequency]}` },
    { value: 'none', label: 'None' },
  ];
}

/** A compare choice that still makes sense after the frequency changes. */
export function coerceCompare(frequency: Frequency, compare: CompareWith): CompareWith {
  return compareOptions(frequency).some((o) => o.value === compare) ? compare : 'same-last-year';
}

/** The column headings a pack's statements use: the period, then what it's compared with. */
export function packColumns(p: ReportPeriod, compare: CompareWith): string[] {
  const { year, month } = parseEnd(p.end);
  const current =
    p.frequency === 'yearly' ? `FY${fyOf(year, month)}` : periodShort(p).replace('-', ' – ');
  if (compare === 'none') return [current];
  if (compare === 'same-last-year') {
    return [
      current,
      periodShort({ ...p, end: `${year - 1}-${String(month + 1).padStart(2, '0')}` }).replace(
        '-',
        ' – '
      ),
    ];
  }
  const step = p.frequency === 'quarterly' ? 3 : 1;
  const prev = new Date(year, month - step, 1);
  return [
    current,
    periodShort({
      ...p,
      end: `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`,
    }).replace('-', ' – '),
  ];
}

// ---------------------------------------------------------------------------------------------
// Client reports
// ---------------------------------------------------------------------------------------------

export type ClientReportType = 'ma' | 'fs';

export type ClientReportStatus =
  | 'not-started'
  | 'draft'
  | 'published'
  | 'sent'
  | 'sent-for-signature'
  | 'signed';

export type ClientReport = {
  id: string;
  type: ClientReportType;
  period: ReportPeriod;
  version: number;
  status: ClientReportStatus;
  recipient: string;
  lastActivity: string;
  created: Date;
  /** MA only — this pack's own copy of the template's contents. */
  contents: ContentItem[];
  commentary: string;
  /** This report's own compare choice (MA), or undefined to follow the template. */
  compare?: CompareWith;
  /** This report's own period shape (MA), or undefined to follow the template. */
  shape?: PeriodShape;
  lockedOn?: string;
};

export const TYPE_LABEL: Record<ClientReportType, string> = {
  ma: 'Management accounts',
  fs: 'Financial statements',
};

export function clientReportName(r: Pick<ClientReport, 'type' | 'period'>): string {
  return `${TYPE_LABEL[r.type]}, ${periodLabel(r.period)}`;
}

export function fileNameFor(
  pattern: string,
  capitals: boolean,
  values: { created: Date; entity: string; type: ClientReportType; period: ReportPeriod }
): string {
  const replaced = pattern
    .replaceAll('{Date created}', compactDate(values.created))
    .replaceAll('{Entity}', values.entity)
    .replaceAll('{Report type}', TYPE_LABEL[values.type])
    .replaceAll('{Period}', periodShort(values.period));
  return `${capitals ? replaced.toUpperCase() : replaced}.pdf`;
}

/** How much of the year a pack's statements cover. `undefined` on a report means "the
 * template's" — the shape its frequency implies. */
export type PeriodShape = 'month' | 'quarter' | 'ytd';

export function templateShape(frequency: Frequency): PeriodShape {
  return frequency === 'monthly' ? 'month' : frequency === 'quarterly' ? 'quarter' : 'ytd';
}

export function shapeOptions(p: ReportPeriod): { value: PeriodShape; label: string }[] {
  const { year, month } = parseEnd(p.end);
  const options: { value: PeriodShape; label: string }[] = [];
  if (p.frequency === 'monthly') options.push({ value: 'month', label: `${MONTHS_SHORT[month]} ${year}` });
  if (p.frequency !== 'yearly' && month % 3 === 2) {
    options.push({
      value: 'quarter',
      label: `${MONTHS_SHORT[(month + 10) % 12]} – ${MONTHS_SHORT[month]} ${year}`,
    });
  }
  const fy = fyOf(year, month);
  options.push({
    value: 'ytd',
    label: p.frequency === 'yearly' ? `FY${fy}` : `Apr ${fy - 1} – ${MONTHS_SHORT[month]} ${year}`,
  });
  return options;
}

export function newClientReport(
  type: ClientReportType,
  period: ReportPeriod,
  templates: Templates,
  version: number,
  from?: ClientReport
): ClientReport {
  return {
    id: `${type}-${period.frequency}-${period.end}-v${version}`,
    type,
    period,
    version,
    status: type === 'fs' ? 'not-started' : 'draft',
    recipient: type === 'fs' ? 'All directors' : templates.ma.recipientName,
    lastActivity: `Created ${formatDate(DEMO_TODAY)}`,
    created: DEMO_TODAY,
    contents: from?.contents ?? templates.ma.contents.map((c) => ({ ...c })),
    commentary: from?.commentary ?? '',
    compare: from?.compare,
    shape: from?.shape,
  };
}

const NORTHWIND_COMMENTARY =
  'Sales for March were S$38,400, 9% higher than March last year, driven by two new wholesale accounts. Gross margin held at 56%.\n\nOne savings account still has four lines to reconcile, and two customers are more than 60 days overdue. We have flagged both for follow-up.';

/** What each client's Reports opens with. */
export function seedClientReports(company: Company, templates: Templates | null): ClientReport[] {
  if (company.id !== 'northwind' || !templates) return [];
  const ma = (end: string, patch: Partial<ClientReport>): ClientReport => ({
    ...newClientReport('ma', { frequency: 'monthly', end }, templates, 1),
    ...patch,
  });
  const fs = (end: string, patch: Partial<ClientReport>): ClientReport => ({
    ...newClientReport('fs', { frequency: 'yearly', end }, templates, 1),
    ...patch,
  });
  return [
    ma('2027-03', {
      status: 'draft',
      lastActivity: 'Created automatically 5 Apr 2027',
      created: new Date(2027, 3, 5),
      commentary: NORTHWIND_COMMENTARY,
    }),
    ma('2027-02', {
      status: 'sent',
      lastActivity: 'Sent 8 Mar 2027',
      created: new Date(2027, 2, 5),
      lockedOn: '7 Mar 2027',
    }),
    ma('2027-01', {
      status: 'sent',
      lastActivity: 'Sent 6 Feb 2027',
      created: new Date(2027, 1, 5),
      lockedOn: '5 Feb 2027',
    }),
    fs('2026-03', {
      status: 'signed',
      lastActivity: 'Signed 22 Jul 2026',
      created: new Date(2026, 5, 30),
      lockedOn: '30 Jun 2026',
    }),
    fs('2027-03', {
      status: 'not-started',
      lastActivity: 'Year ended 31 Mar 2027',
      created: DEMO_TODAY,
    }),
  ];
}

/** Saved templates each client opens with — only Northwind has been set up. */
export function seedTemplates(company: Company): Templates | null {
  return company.id === 'northwind' ? defaultTemplates(company) : null;
}

/** One line on what the template will prefill, for the New client report dialog. */
export function templateSummary(type: ClientReportType, t: Templates): string {
  if (type === 'ma') {
    const count = t.ma.contents.filter((c) => c.included).length;
    const compare = compareOptions(t.ma.frequency).find((o) => o.value === t.ma.compareWith);
    return [
      FREQUENCY_LABEL[t.ma.frequency],
      `${count} sections`,
      compare?.value === 'none' ? 'no comparison' : `compared with ${compare?.label.toLowerCase()}`,
      `to ${t.ma.recipientName}`,
    ].join(' · ');
  }
  const signers = signingDirectors(t.fs);
  return [
    STANDARD_LABEL[t.fs.standard],
    signers.length ? signers.map((d) => d.name).join(' and ') + ' signing' : 'no signing directors yet',
    `${t.fs.policies.filter((p) => p.on).length} accounting policies`,
  ].join(' · ');
}

export { reportName };

// ---------------------------------------------------------------------------------------------
// How a pack describes its period
// ---------------------------------------------------------------------------------------------

function lastDayOf(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** The months a pack's statements cover, e.g. "March 2027", "January to March 2027",
 * "April 2026 to March 2027". */
export function shapeLabel(p: ReportPeriod, shape: PeriodShape): string {
  const { year, month } = parseEnd(p.end);
  if (shape === 'month') return `${MONTHS_LONG[month]} ${year}`;
  const back = shape === 'quarter' ? 2 : (month + 9) % 12;
  const start = new Date(year, month - back, 1);
  const startYear = start.getFullYear() === year ? '' : ` ${start.getFullYear()}`;
  return `${MONTHS_LONG[start.getMonth()]}${startYear} to ${MONTHS_LONG[month]} ${year}`;
}

/** The line under "Management accounts" on the cover. */
export function coverLine(p: ReportPeriod, shape: PeriodShape): string {
  const { year, month } = parseEnd(p.end);
  if (shape === 'month') return `For ${shapeLabel(p, shape)}`;
  if (shape === 'quarter') return `For the quarter ${shapeLabel(p, shape)}`;
  if (p.frequency === 'yearly') {
    return `For the year ended ${lastDayOf(year, month)} ${MONTHS_LONG[month]} ${year}`;
  }
  return `For the year to date, ${shapeLabel(p, shape)}`;
}

export function asAtLabel(p: ReportPeriod): string {
  const { year, month } = parseEnd(p.end);
  return `As at ${lastDayOf(year, month)} ${MONTHS_LONG[month]} ${year}`;
}

/** Column headings for a snapshot report (balance sheet): the period end, then the date it's
 * compared with. */
export function asAtColumns(p: ReportPeriod, shape: PeriodShape, compare: CompareWith): string[] {
  const { year, month } = parseEnd(p.end);
  const label = (d: Date) =>
    `${lastDayOf(d.getFullYear(), d.getMonth())} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  const current = label(new Date(year, month, 1));
  if (compare === 'none') return [current];
  const back = compare === 'same-last-year' || shape === 'ytd' ? 12 : shape === 'quarter' ? 3 : 1;
  return [current, label(new Date(year, month - back, 1))];
}
