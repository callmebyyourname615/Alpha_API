import { PaymentPlan } from "./entities/enums";


export interface InstallmentSlot {
  period_label: string;
  due_date: Date;
  amount: number;
}

/**
 * Generate installment slots based on payment plan.
 * @param plan      - monthly | quarterly | yearly
 * @param netAmount - total amount after discount
 * @param startDate - first due date (defaults to start of next month)
 */
export function generateInstallments(
  plan: PaymentPlan,
  netAmount: number,
  startDate?: Date,
): InstallmentSlot[] {
  const base = startDate ?? getNextMonthStart();
  const slots: InstallmentSlot[] = [];

  if (plan === PaymentPlan.YEARLY) {
    slots.push({
      period_label: `Full Year ${base.getFullYear()}`,
      due_date: base,
      amount: round(netAmount),
    });
    return slots;
  }

  if (plan === PaymentPlan.QUARTERLY) {
    const quarterLabels = ['Q1', 'Q2', 'Q3', 'Q4'];
    const perQuarter = round(netAmount / 4);
    for (let i = 0; i < 4; i++) {
      const d = new Date(base);
      d.setMonth(d.getMonth() + i * 3);
      slots.push({
        period_label: `${quarterLabels[i]} ${d.getFullYear()}`,
        due_date: d,
        amount: perQuarter,
      });
    }
    // Fix rounding: adjust last slot
    adjustLastSlot(slots, netAmount);
    return slots;
  }

  if (plan === PaymentPlan.MONTHLY) {
    const perMonth = round(netAmount / 12);
    for (let i = 0; i < 12; i++) {
      const d = new Date(base);
      d.setMonth(d.getMonth() + i);
      slots.push({
        period_label: formatMonthLabel(d),
        due_date: d,
        amount: perMonth,
      });
    }
    adjustLastSlot(slots, netAmount);
    return slots;
  }

  return slots;
}

function getNextMonthStart(): Date {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function adjustLastSlot(slots: InstallmentSlot[], total: number): void {
  const sumExceptLast = slots
    .slice(0, -1)
    .reduce((acc, s) => acc + s.amount, 0);
  slots[slots.length - 1].amount = round(total - sumExceptLast);
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
function formatMonthLabel(d: Date): string {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}