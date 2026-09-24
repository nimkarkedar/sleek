import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { type Company } from '@/lib/companies';
import { ArrowRight, Lightbulb, X } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';

/**
 * "While you were away" summary — replaces the old profit/loss headline. Deliberately NOT
 * seeded like the rest of this app's demo data (which stays fixed per company so numbers don't
 * shuffle on every reload): this is meant to feel alive, a fresh reassurance each time the
 * dashboard loads that Sleek kept working in the background, so it uses plain `Math.random()`.
 */
function pastMonthName(): string {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - 1);
  return date.toLocaleDateString('en-US', { month: 'long' });
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildActionPool(companyName: string): Array<{ count: number; text: string }> {
  const month = pastMonthName();
  const pool = [
    () => {
      const n = randomInt(15, 42);
      return { count: n, text: `categorised ${n} transactions` };
    },
    () => {
      const n = randomInt(5, 18);
      return { count: n, text: `matched ${n} receipts` };
    },
    () => {
      const n = randomInt(3, 12);
      return { count: n, text: `reconciled ${n} bank transactions` };
    },
    () => {
      const n = randomInt(2, 9);
      return { count: n, text: `uploaded ${n} documents` };
    },
    () => {
      const n = randomInt(1, 4);
      return { count: n, text: `flagged ${n} ${n === 1 ? 'item' : 'items'} for review` };
    },
    () => ({ count: 1, text: `drafted ${companyName}'s ${month} report` }),
  ];
  // Shuffle, then take 3 — a different mix of actions each load, not just different numbers.
  return pool
    .map((build) => ({ build, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, 3)
    .map(({ build }) => build());
}

function joinWithAnd(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildSummary(companyName: string): { count: number; description: string } {
  const actions = buildActionPool(companyName);
  const count = actions.reduce((sum, a) => sum + a.count, 0);
  const description = capitalize(joinWithAnd(actions.map((a) => a.text)));
  return { count, description };
}

export function ActivityBanner({
  company,
  onNavigate,
}: {
  company: Company;
  onNavigate: (targetKey: string) => void;
}) {
  // Deliberately plain component state, not persisted anywhere (no sessionStorage) — dismissing
  // is meant to be scoped to "this one look at this one company's dashboard, right now," not a
  // durable preference. It reappears whenever this component gets a fresh mount: a page
  // refresh, leaving the shell for the root two-pane picker and coming back, or switching
  // companies (shell.tsx keys this component by company id specifically so a company switch
  // remounts it, since that alone wouldn't otherwise unmount anything). For demo purposes,
  // re-showing it easily matters more than remembering it was dismissed.
  const [dismissed, setDismissed] = React.useState(false);
  // Generated once per mount, not on every re-render — recomputing on unrelated state changes
  // elsewhere in the shell would make the message flicker/change under the user while they're
  // still reading it.
  const summary = React.useMemo(() => buildSummary(company.name), [company.name]);

  if (dismissed) return null;

  return (
    // RN's default `position` is already 'relative' (unlike web's 'static'), so the absolutely
    // positioned close button below just works without extra styling here.
    <View
      style={{ backgroundColor: '#EEFBF3' }}
      className="flex-row items-center gap-3 rounded-2xl py-4 pl-5 pr-10">
      <Icon as={Lightbulb} size={20} className="text-[#18181B]" />
      <View className="flex-1 gap-0.5">
        <Text className="text-base font-plex-semibold text-[#18181B]">
          {summary.count} actions completed while you were away
        </Text>
        <Text className="text-sm text-[#656565]">{summary.description}</Text>
      </View>
      <Pressable
        onPress={() => onNavigate('ledger-adjustments')}
        accessibilityRole="link"
        className="flex-row items-center gap-1.5 web:cursor-pointer">
        <Text className="hidden text-sm font-plex-semibold text-[#18181B] md:flex">
          View details
        </Text>
        <Icon as={ArrowRight} size={14} className="text-[#18181B]" />
      </Pressable>
      {/* Hangs off the box's top-right corner (negative offsets, half outside the box) rather
          than sitting inset inside the padding — out of the row next to "View details", which
          made the arrow read as if it pointed at the close button. A small white circular badge
          (with a soft shadow, since it's floating over two different backgrounds) so it still
          reads as attached to the box at that position; muted gray icon inside keeps it "dull"
          rather than the bold black-pill treatment used for genuinely primary actions
          elsewhere. */}
      <Pressable
        onPress={() => setDismissed(true)}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        hitSlop={8}
        style={{
          position: 'absolute',
          top: -10,
          right: -10,
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.15,
          shadowRadius: 3,
        }}
        className="items-center justify-center web:cursor-pointer">
        <Icon as={X} size={12} className="text-[#656565]" />
      </Pressable>
    </View>
  );
}
