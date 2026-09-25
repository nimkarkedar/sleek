/** Demo sign-in personas — the login page's Role select and the shell both read from here, so a
 * persona picked at login always resolves to the same label + workspace role inside the app. */

export type Role = 'client' | 'accountant';

export type Persona = { value: string; label: string; role: Role };

export const PERSONA_GROUPS: { label: string; role: Role; personas: Persona[] }[] = [
  {
    label: 'Internal',
    role: 'accountant',
    personas: [
      { value: 'accounting-head', label: 'Accounting Head', role: 'accountant' },
      { value: 'team-lead', label: 'Team Lead', role: 'accountant' },
      { value: 'company-accountant', label: 'Company Accountant', role: 'accountant' },
      { value: 'bookkeeper', label: 'Bookkeeper', role: 'accountant' },
      { value: 'document-processor', label: 'Document Processor', role: 'accountant' },
    ],
  },
  {
    label: 'Client',
    role: 'client',
    personas: [
      { value: 'company-admin', label: 'Company Admin', role: 'client' },
      { value: 'finance-person', label: 'Finance Person', role: 'client' },
      { value: 'employee', label: 'Employee', role: 'client' },
    ],
  },
];

export const PERSONAS: Persona[] = PERSONA_GROUPS.flatMap((g) => g.personas);

/** Used when the shell is opened without a valid `?persona=`. */
export const DEFAULT_PERSONA_ID = 'accounting-head';

export function findPersona(value: string | undefined): Persona | undefined {
  return PERSONAS.find((p) => p.value === value);
}

export type Currency = { code: string; name: string; flag: string };

export const CURRENCIES: Currency[] = [
  { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'HKD', name: 'Hong Kong Dollar', flag: '🇭🇰' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
];

export const DEFAULT_CURRENCY = CURRENCIES[0];

export function currencyLabel(c: Currency): string {
  return `${c.flag}  ${c.code} – ${c.name}`;
}
