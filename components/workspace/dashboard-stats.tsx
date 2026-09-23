import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { createRng, formatMoney, randomInt } from '@/lib/seeded-random';
import { TONE_BADGE_CLASS, type Tone } from '@/lib/tone';
import { cn } from '@/lib/utils';
import {
  ArrowDownLeft,
  ArrowUp,
  ArrowUpRight,
  Banknote,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react-native';
import * as React from 'react';
import { ScrollView, View } from 'react-native';

type StatCard = {
  key: string;
  label: string;
  value: string;
  unit: string;
  icon: LucideIcon;
  /** Icon badge tone — 'neutral' for headline metrics, 'success'/'destructive' for money in/out. */
  tone: Tone;
};

/** Seeded per company so switching the workspace selector shows different-looking figures, but
 * the same company always shows the same numbers rather than reshuffling on every render.
 * Revenue/expenses come back raw (not just formatted into cards) so the profit/loss headline
 * above the grid can be computed from the same source instead of drifting from it. */
function buildStats(companyId: string): { stats: StatCard[]; revenue: number; expenses: number } {
  const rng = createRng(`${companyId}:dashboard-stats`);
  const revenue = randomInt(rng, 8000, 60000) + rng();
  let expenses = randomInt(rng, 5000, 40000) + rng();
  const toGet = rng() < 0.2 ? 0 : randomInt(rng, 200, 6000) + rng();
  const toPay = rng() < 0.2 ? 0 : randomInt(rng, 200, 6000) + rng();

  // Acme is the default company every demo opens on — worth guaranteeing it lands on a profit
  // (a positive, reassuring number to lead with) rather than leaving the revenue/expense split
  // to chance every time.
  if (companyId === 'acme' && expenses >= revenue) {
    expenses = revenue * 0.8;
  }

  return {
    revenue,
    expenses,
    stats: [
      {
        key: 'revenue',
        label: 'Revenue',
        value: formatMoney(revenue),
        unit: 'SGD',
        icon: Banknote,
        tone: 'neutral',
      },
      {
        key: 'expenses',
        label: 'Expenses',
        value: formatMoney(expenses),
        unit: 'SGD',
        icon: ArrowUp,
        tone: 'destructive',
      },
      {
        key: 'to-get',
        label: 'To Get',
        value: formatMoney(toGet),
        unit: 'SGD',
        icon: ArrowDownLeft,
        tone: 'success',
      },
      {
        key: 'to-pay',
        label: 'To Pay',
        value: formatMoney(toPay),
        unit: 'SGD',
        icon: ArrowUpRight,
        tone: 'destructive',
      },
    ],
  };
}

/** Revenue vs. expenses for whatever period is selected — deliberately period-agnostic (unlike
 * the old "X% higher than last month" trend line this replaces, which kept comparing against
 * last month even when the page was filtered to a full year) and impossible to miss, since a
 * loss buried in a small card's fine print is exactly what erodes trust. Names the actual
 * selected period instead of a vague "this period" — same label text as the period selector
 * chip above it, so the two can never say different things. */
function ProfitLossHeadline({
  revenue,
  expenses,
  periodLabel,
}: {
  revenue: number;
  expenses: number;
  periodLabel: string;
}) {
  const diff = revenue - expenses;
  const isProfit = diff >= 0;
  return (
    <View className="flex-row items-center gap-2">
      <Icon
        as={isProfit ? TrendingUp : TrendingDown}
        size={18}
        className={isProfit ? 'text-success-text' : 'text-destructive-text'}
      />
      <Text
        className={cn(
          'text-base font-plex-semibold',
          isProfit ? 'text-success-text' : 'text-destructive-text'
        )}>
        {isProfit ? 'Profit' : 'Loss'} of {formatMoney(Math.abs(diff))} SGD · {periodLabel}
      </Text>
    </View>
  );
}

function StatCardBody({ stat }: { stat: StatCard }) {
  return (
    <>
      <View className="flex-row items-center gap-2">
        <View
          className={`h-7 w-7 items-center justify-center rounded-full ${TONE_BADGE_CLASS[stat.tone]}`}>
          <Icon as={stat.icon} size={14} className="text-white" />
        </View>
        <Text className="text-base text-[#3F3F46]">{stat.label}</Text>
      </View>

      <View className="flex-row items-baseline gap-1.5">
        <Text className="text-2xl font-plex-bold leading-none text-[#18181B]">{stat.value}</Text>
        <Text className="text-base text-[#656565]">{stat.unit}</Text>
      </View>
    </>
  );
}

const CARD_CLASS =
  'gap-2.5 rounded-2xl border border-[#E4E4E7] bg-white p-4 shadow-sm shadow-black/5';

export function DashboardStats({ companyId, periodLabel }: { companyId: string; periodLabel: string }) {
  const { stats, revenue, expenses } = React.useMemo(() => buildStats(companyId), [companyId]);

  return (
    <>
      <ProfitLossHeadline revenue={revenue} expenses={expenses} periodLabel={periodLabel} />

      {/* Mobile: horizontal scroll — 4 cards don't fit a phone width, so let them scroll
          sideways instead of stacking (unreadable) or shrinking to illegibly narrow columns. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="md:hidden"
        contentContainerClassName="gap-5 pr-6">
        {stats.map((stat) => (
          <View key={stat.key} className={cn(CARD_CLASS, 'w-[200px]')}>
            <StatCardBody stat={stat} />
          </View>
        ))}
      </ScrollView>

      {/* Desktop: locked, unchanged — even 4-across row. */}
      <View className="hidden flex-row gap-4 md:flex">
        {stats.map((stat) => (
          <View key={stat.key} className={cn(CARD_CLASS, 'min-w-[180px] flex-1')}>
            <StatCardBody stat={stat} />
          </View>
        ))}
      </View>
    </>
  );
}
