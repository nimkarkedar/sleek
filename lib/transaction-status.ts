import { TONE_HEX } from '@/lib/tone';
import {
  ArrowLeftRight,
  CircleAlert,
  CircleDashed,
  FilePen,
  FileText,
  Loader,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react-native';

/**
 * Shared between the transactions table (row status pills) and the filter dropdown (grouped
 * option list) — kept in its own module, not defined in either component, so the two don't end
 * up importing from each other.
 */
export type TransactionStatus =
  | 'documents-needed'
  | 'amount-unmatched'
  | 'document-removed'
  | 'check-documents'
  | 'system-error'
  | 'processing'
  | 'reconciling';

/** The complete, closed set of statuses this table can show — the filter dropdown's "Needs
 * you"/"Waiting on us" groups enumerate exactly these seven, nothing more. */
export const STATUS_META: Record<
  TransactionStatus,
  { label: string; icon: LucideIcon; color: string }
> = {
  'documents-needed': { label: 'Documents needed', icon: FileText, color: '#D97706' },
  'amount-unmatched': { label: 'Amount unmatched', icon: CircleDashed, color: '#EA580C' },
  'document-removed': { label: 'Document removed', icon: RotateCcw, color: '#7C3AED' },
  // Reuses the same brand blue already established for icon-color usage elsewhere (#2D74E4) —
  // this project's `brand` Tailwind token is a CSS var, not usable as a raw `color` prop.
  'check-documents': { label: 'Check documents', icon: FilePen, color: '#2D74E4' },
  'system-error': { label: 'System error', icon: CircleAlert, color: TONE_HEX.destructive },
  processing: { label: 'Processing', icon: Loader, color: '#A1A1AA' },
  reconciling: { label: 'Reconciling', icon: ArrowLeftRight, color: '#A1A1AA' },
};

export const NEEDS_YOU_STATUSES: TransactionStatus[] = [
  'documents-needed',
  'amount-unmatched',
  'document-removed',
  'check-documents',
  'system-error',
];

export const WAITING_ON_US_STATUSES: TransactionStatus[] = ['processing', 'reconciling'];

/** `'needs-attention'` isn't a real row status — it's the filter's own "show everything" value.
 * The dropdown's separate "All items" option also selects this same value: there's no
 * distinct resolved/archived dataset yet to tell the two apart, so they're functionally
 * identical for now rather than modeled as two different filter states. */
export type StatusFilterValue = 'needs-attention' | TransactionStatus;
