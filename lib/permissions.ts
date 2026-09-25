import type { NavIconName } from '@/components/icons/nav-icons';
import { findPersona, type Persona } from '@/lib/personas';

/** Single source of truth for what each persona can see. Components never check persona names
 * themselves — they render whatever `buildNav` returns. To change who sees what, edit the two
 * matrices or the nav tree below. */

// ---------------------------------------------------------------------------------------------
// Access levels
// ---------------------------------------------------------------------------------------------

export const ACCESS = { NONE: 0, READ: 1, EDIT: 2, FULL: 3 } as const;
export type AccessLevel = (typeof ACCESS)[keyof typeof ACCESS];

type Cell = 'N' | 'R' | 'E' | 'F';
const CELL: Record<Cell, AccessLevel> = {
  N: ACCESS.NONE,
  R: ACCESS.READ,
  E: ACCESS.EDIT,
  F: ACCESS.FULL,
};

export type Resource =
  | 'customerDetails'
  | 'pendingActions'
  | 'customerCommunication'
  | 'bankAccounts'
  | 'bankStatements'
  | 'purchaseInvoices'
  | 'reimbursements'
  | 'reconciliation'
  | 'bookkeepingAudit'
  | 'userManagement'
  | 'internalAccountingTeam'
  | 'suppliersCustomers'
  | 'itemMaster'
  | 'salesInvoices'
  | 'ledgerInsights'
  | 'ledgerReports'
  | 'chartOfAccounts'
  | 'ledgerAdjustments'
  | 'auditLogs'
  | 'accountingFiles'
  | 'payrollFiles'
  | 'taxFiles';

export type ReimbursementScope = 'ALL' | 'SELF';

// ---------------------------------------------------------------------------------------------
// Permission matrices — laid out exactly like the product spec's tables, one row per resource,
// one column per persona. A resource missing from a matrix is NONE for that whole group.
// ---------------------------------------------------------------------------------------------

const INTERNAL_COLUMNS = [
  'accounting-head',
  'team-lead',
  'company-accountant',
  'bookkeeper',
  'document-processor',
] as const;

//                                             AH   TL   CA   BK   DP
const INTERNAL_MATRIX: Partial<Record<Resource, [Cell, Cell, Cell, Cell, Cell]>> = {
  customerDetails:                           ['F', 'F', 'F', 'N', 'N'],
  pendingActions:                            ['E', 'E', 'E', 'R', 'N'],
  customerCommunication:                     ['F', 'F', 'E', 'R', 'N'],
  bankAccounts:                              ['F', 'F', 'F', 'E', 'E'],
  bankStatements:                            ['F', 'F', 'F', 'F', 'F'],
  purchaseInvoices:                          ['F', 'F', 'F', 'F', 'F'],
  reimbursements:                            ['F', 'F', 'F', 'F', 'N'],
  reconciliation:                            ['F', 'F', 'F', 'F', 'E'],
  bookkeepingAudit:                          ['F', 'F', 'F', 'E', 'N'],
  userManagement:                            ['F', 'F', 'F', 'R', 'N'],
  suppliersCustomers:                        ['F', 'F', 'F', 'F', 'F'],
  itemMaster:                                ['F', 'F', 'F', 'F', 'F'],
  salesInvoices:                             ['F', 'F', 'F', 'F', 'F'],
  ledgerInsights:                            ['R', 'R', 'R', 'R', 'N'],
  ledgerReports:                             ['F', 'F', 'F', 'R', 'N'],
  chartOfAccounts:                           ['F', 'F', 'F', 'R', 'R'],
  ledgerAdjustments:                         ['F', 'F', 'F', 'R', 'N'],
  auditLogs:                                 ['R', 'R', 'R', 'R', 'N'],
  accountingFiles:                           ['F', 'F', 'F', 'F', 'F'],
  payrollFiles:                              ['F', 'F', 'F', 'N', 'N'],
  taxFiles:                                  ['F', 'F', 'F', 'N', 'N'],
};

const CLIENT_COLUMNS = ['company-admin', 'finance-person', 'employee'] as const;

//                                             ADM  FIN  EMP
const CLIENT_MATRIX: Partial<Record<Resource, [Cell, Cell, Cell]>> = {
  pendingActions:                            ['F', 'F', 'N'],
  bankAccounts:                              ['F', 'F', 'N'],
  bankStatements:                            ['F', 'F', 'N'],
  purchaseInvoices:                          ['F', 'F', 'N'], // assumption, pending PM
  reimbursements:                            ['F', 'F', 'F'],
  internalAccountingTeam:                    ['R', 'N', 'N'],
  suppliersCustomers:                        ['F', 'N', 'N'],
  salesInvoices:                             ['F', 'F', 'N'],
  ledgerInsights:                            ['R', 'F', 'N'],
  ledgerReports:                             ['F', 'F', 'N'],
  chartOfAccounts:                           ['F', 'F', 'N'],
  ledgerAdjustments:                         ['F', 'F', 'N'],
  accountingFiles:                           ['F', 'F', 'N'],
  payrollFiles:                              ['F', 'F', 'N'],
  taxFiles:                                  ['F', 'F', 'N'],
};

const CLIENT_REIMBURSEMENT_SCOPE: [ReimbursementScope, ReimbursementScope, ReimbursementScope] =
  ['ALL', 'SELF', 'SELF'];

function column<T extends readonly string[]>(columns: T, personaId: string): number {
  return columns.indexOf(personaId);
}

export function getAccess(personaId: string, resource: Resource): AccessLevel {
  const internalCol = column(INTERNAL_COLUMNS, personaId);
  if (internalCol >= 0) return CELL[INTERNAL_MATRIX[resource]?.[internalCol] ?? 'N'];
  const clientCol = column(CLIENT_COLUMNS, personaId);
  if (clientCol >= 0) return CELL[CLIENT_MATRIX[resource]?.[clientCol] ?? 'N'];
  return ACCESS.NONE;
}

export function can(personaId: string, resource: Resource, min: AccessLevel = ACCESS.READ) {
  return getAccess(personaId, resource) >= min;
}

/** Internal personas always see everyone's reimbursements. */
export function getReimbursementScope(personaId: string): ReimbursementScope {
  const clientCol = column(CLIENT_COLUMNS, personaId);
  return clientCol >= 0 ? CLIENT_REIMBURSEMENT_SCOPE[clientCol] : 'ALL';
}

// ---------------------------------------------------------------------------------------------
// Navigation tree
// ---------------------------------------------------------------------------------------------

type NavChildConfig = {
  key: string;
  label: string;
  resource: Resource;
  /** Replaces `label` when the persona's reimbursement scope is SELF. */
  selfScopedLabel?: string;
  /** Mock pending-item count — counts toward the parent's badge only when the persona can
   * EDIT (or better) this child's resource. */
  mockCount?: number;
};

type NavNodeConfig = {
  key: string;
  label: string;
  icon: NavIconName;
  /** `page` — a single destination. `tabs` — one destination whose page shows the visible
   * children as tabs. `group` — a collapsible sidebar group whose children are destinations. */
  kind: 'page' | 'tabs' | 'group';
  children?: NavChildConfig[];
  /** Visible regardless of permissions. */
  always?: boolean;
  /** Restricts the node to one side of the persona split (for nodes with no resource). */
  audience?: Persona['role'];
  /** Per-company module — hidden at the "all clients" portfolio scope. */
  companyScoped?: boolean;
  /** `bottom` pins the node to the foot of the sidebar. */
  placement?: 'main' | 'bottom';
};

const NAV_TREE: NavNodeConfig[] = [
  { key: 'home', label: 'Dashboard', icon: 'home', kind: 'page', always: true },
  {
    key: 'work',
    label: 'Work Queue',
    icon: 'workqueue',
    kind: 'tabs',
    children: [
      { key: 'pending-transactions', label: 'Transactions', resource: 'pendingActions', mockCount: 18 },
      { key: 'documents', label: 'Documents', resource: 'pendingActions', mockCount: 15 },
      { key: 'messages', label: 'Messages', resource: 'customerCommunication', mockCount: 4 },
      { key: 'review', label: 'Review', resource: 'bookkeepingAudit', mockCount: 6 },
    ],
  },
  { key: 'clients', label: 'Clients', icon: 'clients', kind: 'page', audience: 'accountant' },
  {
    key: 'getpaid',
    label: 'Get Paid',
    icon: 'getpaid',
    kind: 'tabs',
    companyScoped: true,
    children: [
      { key: 'invoices', label: 'Invoices', resource: 'salesInvoices' },
      { key: 'customers', label: 'Customers', resource: 'suppliersCustomers' },
      { key: 'products', label: 'Products & services', resource: 'itemMaster' },
    ],
  },
  {
    key: 'spend',
    label: 'Spend',
    icon: 'spend',
    kind: 'tabs',
    companyScoped: true,
    children: [
      { key: 'bills', label: 'Bills', resource: 'purchaseInvoices' },
      {
        key: 'reimbursements',
        label: 'Reimbursements',
        resource: 'reimbursements',
        selfScopedLabel: 'My reimbursements',
      },
      { key: 'suppliers', label: 'Suppliers', resource: 'suppliersCustomers' },
    ],
  },
  {
    key: 'banking',
    label: 'Banking',
    icon: 'banking',
    kind: 'tabs',
    companyScoped: true,
    children: [
      { key: 'accounts', label: 'Accounts', resource: 'bankAccounts' },
      { key: 'statements', label: 'Statements', resource: 'bankStatements' },
      { key: 'reconciliation', label: 'Reconciliation', resource: 'reconciliation' },
    ],
  },
  {
    key: 'ledger',
    label: 'Ledger',
    icon: 'books',
    kind: 'group',
    companyScoped: true,
    children: [
      { key: 'ledger-insights', label: 'Insights', resource: 'ledgerInsights' },
      { key: 'ledger-reports', label: 'Reports', resource: 'ledgerReports' },
      { key: 'ledger-adjustments', label: 'Adjustments', resource: 'ledgerAdjustments' },
      { key: 'ledger-chart-of-accounts', label: 'Chart of accounts', resource: 'chartOfAccounts' },
    ],
  },
  {
    key: 'files',
    label: 'Files',
    icon: 'files',
    kind: 'tabs',
    companyScoped: true,
    children: [
      { key: 'accounting', label: 'Accounting', resource: 'accountingFiles' },
      { key: 'payroll', label: 'Payroll', resource: 'payrollFiles' },
      { key: 'tax', label: 'Tax', resource: 'taxFiles' },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: 'settings',
    kind: 'tabs',
    placement: 'bottom',
    children: [
      { key: 'company-profile', label: 'Company profile', resource: 'customerDetails' },
      // Internal and client personas each hold only one of these two resources, so exactly one
      // of the two tabs survives filtering for any persona that can see either.
      { key: 'team-access', label: 'Team & access', resource: 'userManagement' },
      { key: 'accounting-team', label: 'Accounting team', resource: 'internalAccountingTeam' },
      { key: 'audit-log', label: 'Audit log', resource: 'auditLogs' },
    ],
  },
];

// ---------------------------------------------------------------------------------------------
// Resolved (per-persona) navigation
// ---------------------------------------------------------------------------------------------

export type NavChild = { key: string; label: string };

export type NavNode = {
  key: string;
  label: string;
  icon: NavIconName;
  kind: NavNodeConfig['kind'];
  placement: 'main' | 'bottom';
  /** Only the children this persona can see, with persona-specific labels applied. */
  children: NavChild[];
  /** Pending items across children the persona can act on (EDIT+). 0 = no badge. */
  badge: number;
};

/** The sidebar for one persona: hidden children removed, then any parent left with no visible
 * children removed too. */
export function buildNav(
  personaId: string,
  { portfolioScope = false }: { portfolioScope?: boolean } = {}
): NavNode[] {
  const persona = findPersona(personaId);
  const selfScoped = getReimbursementScope(personaId) === 'SELF';

  return NAV_TREE.flatMap((node): NavNode[] => {
    if (node.companyScoped && portfolioScope) return [];
    if (node.audience && node.audience !== persona?.role) return [];

    const visibleChildren = (node.children ?? []).filter((c) => can(personaId, c.resource));
    const hasChildren = !!node.children?.length;
    if (hasChildren && visibleChildren.length === 0 && !node.always) return [];

    const badge = visibleChildren
      .filter((c) => c.mockCount && can(personaId, c.resource, ACCESS.EDIT))
      .reduce((sum, c) => sum + (c.mockCount ?? 0), 0);

    return [
      {
        key: node.key,
        label: node.label,
        icon: node.icon,
        kind: node.kind,
        placement: node.placement ?? 'main',
        children: visibleChildren.map((c) => ({
          key: c.key,
          label: selfScoped && c.selfScopedLabel ? c.selfScopedLabel : c.label,
        })),
        badge,
      },
    ];
  });
}

/** Keys that can be `active` in the shell: page/tabs nodes themselves, and group children. */
export function navigableKeys(nav: NavNode[]): string[] {
  return nav.flatMap((n) => (n.kind === 'group' ? n.children.map((c) => c.key) : [n.key]));
}

/** Where to land when the current destination disappears (e.g. after a persona switch). */
export function firstNavigableKey(nav: NavNode[]): string {
  return navigableKeys(nav)[0] ?? 'home';
}

// ---------------------------------------------------------------------------------------------
// Access-denied messaging — for in-page shortcuts (dashboard banner, to-do list) that point at a
// destination the persona can't see. The sidebar never offers these; shortcuts can.
// ---------------------------------------------------------------------------------------------

/** Who grants access, per side of the persona split. */
const ACCESS_APPROVER: Record<Persona['role'], string> = {
  accountant: 'Accounting Head',
  client: 'Company Admin',
};

/** "Ledger › Adjustments", "Work Queue › Documents", "Clients" — from the full tree, so it
 * works for destinations the current persona can't see. */
function destinationLabel(key: string, tab?: string): string {
  for (const node of NAV_TREE) {
    const child = node.children?.find((c) => c.key === (node.kind === 'group' ? key : tab));
    if (node.kind === 'group' && child) return `${node.label} › ${child.label}`;
    if (node.key === key) return child ? `${node.label} › ${child.label}` : node.label;
  }
  return 'this page';
}

/** `null` when the persona can open `key` (and `tab`, if given); otherwise the toast copy
 * explaining what's missing and who to ask. */
export function getAccessDenial(
  personaId: string,
  nav: NavNode[],
  key: string,
  tab?: string
): { title: string; description: string } | null {
  const node = nav.find((n) => n.key === key);
  const pageVisible = navigableKeys(nav).includes(key);
  const tabVisible = !tab || node?.kind !== 'tabs' || node.children.some((c) => c.key === tab);
  if (pageVisible && tabVisible) return null;

  const persona = findPersona(personaId);
  const approver = persona ? ACCESS_APPROVER[persona.role] : undefined;
  const ask =
    !approver || approver === persona?.label
      ? 'Contact Sleek support to change your access.'
      : `Ask your ${approver} for access.`;
  return {
    title: `No access to ${destinationLabel(key, pageVisible ? tab : undefined)}`,
    description: `Your role (${persona?.label ?? 'unknown'}) needs at least Read access to open this. ${ask}`,
  };
}

// ---------------------------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------------------------

/** Personas whose dashboard content hasn't been worked out yet — they get an empty dashboard
 * card with a "yet to be designed" note instead of the default widgets. */
const DASHBOARD_UNDESIGNED: readonly string[] = ['document-processor', 'employee'];

export function hasDesignedDashboard(personaId: string): boolean {
  return !DASHBOARD_UNDESIGNED.includes(personaId);
}
