export type Company = {
  id: string;
  name: string;
  initial: string;
  /** null => neutral "initials" avatar (matches the default chip style); a hex value simulates an uploaded logo. */
  logoColor: string | null;
  /** Simulated — days since the accountant last opened this client's workspace. */
  lastVisitedDaysAgo: number;
  /** Simulated — pending Work Queue items for this client (shown as the sidebar nav badge). */
  workQueueCount: number;
};

export const COMPANIES: Company[] = [
  { id: 'acme', name: 'Acme Pte Ltd', initial: 'A', logoColor: '#F59E0B', lastVisitedDaysAgo: 89, workQueueCount: 18 },
  { id: 'northwind', name: 'Northwind Trading Co.', initial: 'N', logoColor: null, lastVisitedDaysAgo: 14, workQueueCount: 4 },
  { id: 'globex', name: 'Globex Manufacturing', initial: 'G', logoColor: '#10B981', lastVisitedDaysAgo: 132, workQueueCount: 27 },
  { id: 'lioncity', name: 'Lion City Logistics', initial: 'L', logoColor: null, lastVisitedDaysAgo: 3, workQueueCount: 1 },
  { id: 'marinabay', name: 'Marina Bay Consultants', initial: 'M', logoColor: '#6366F1', lastVisitedDaysAgo: 45, workQueueCount: 9 },
  { id: 'orchard', name: 'Orchard Retail Group', initial: 'O', logoColor: null, lastVisitedDaysAgo: 67, workQueueCount: 15 },
  { id: 'raffles', name: 'Raffles Digital Studio', initial: 'R', logoColor: '#EC4899', lastVisitedDaysAgo: 5, workQueueCount: 2 },
  { id: 'sentosa', name: 'Sentosa Hospitality Pte Ltd', initial: 'S', logoColor: null, lastVisitedDaysAgo: 118, workQueueCount: 23 },
  { id: 'bugis', name: 'Bugis Creative Agency', initial: 'B', logoColor: '#14B8A6', lastVisitedDaysAgo: 22, workQueueCount: 6 },
  { id: 'tanjong', name: 'Tanjong Freight Services', initial: 'T', logoColor: null, lastVisitedDaysAgo: 96, workQueueCount: 19 },
  { id: 'clementi', name: 'Clementi Tech Ventures', initial: 'C', logoColor: '#8B5CF6', lastVisitedDaysAgo: 1, workQueueCount: 0 },
  { id: 'jurong', name: 'Jurong Industrial Supplies', initial: 'J', logoColor: null, lastVisitedDaysAgo: 58, workQueueCount: 12 },
  { id: 'bishan', name: 'Bishan Wellness Pte Ltd', initial: 'B', logoColor: '#F97316', lastVisitedDaysAgo: 143, workQueueCount: 31 },
  { id: 'novena', name: 'Novena Medical Holdings', initial: 'N', logoColor: null, lastVisitedDaysAgo: 29, workQueueCount: 7 },
  { id: 'kallang', name: 'Kallang Sports Group', initial: 'K', logoColor: '#06B6D4', lastVisitedDaysAgo: 8, workQueueCount: 3 },
  { id: 'punggol', name: 'Punggol Green Energy', initial: 'P', logoColor: null, lastVisitedDaysAgo: 77, workQueueCount: 16 },
  { id: 'yishun', name: 'Yishun Food Collective', initial: 'Y', logoColor: '#84CC16', lastVisitedDaysAgo: 110, workQueueCount: 22 },
  { id: 'changi', name: 'Changi Aviation Partners', initial: 'C', logoColor: null, lastVisitedDaysAgo: 19, workQueueCount: 5 },
  { id: 'woodlands', name: 'Woodlands Builders Pte Ltd', initial: 'W', logoColor: '#EF4444', lastVisitedDaysAgo: 61, workQueueCount: 13 },
  { id: 'serangoon', name: 'Serangoon Design Studio', initial: 'S', logoColor: null, lastVisitedDaysAgo: 34, workQueueCount: 8 },
];

/** A client's own company (no rollup — Client always operates within exactly one company).
 * Accountants pick from the full `COMPANIES` roster instead, plus an "all-clients" scope. */
export const CLIENT_COMPANIES: Company[] = [COMPANIES[0]];

/** What workspace is currently in view. A specific company (either persona), or — Accountant
 * only — the portfolio-wide "all clients" scope, where company-specific nav/content don't apply. */
export type Scope = { kind: 'company'; companyId: string } | { kind: 'all-clients' };

export function formatLastVisited(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const formatted = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `Last visited on ${formatted}, ${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
}
