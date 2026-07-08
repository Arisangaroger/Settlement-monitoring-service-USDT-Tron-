type BadgeVariant = 'confirmed' | 'pending' | 'neutral';

const styles: Record<BadgeVariant, string> = {
  confirmed:
    'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200/80',
  pending:
    'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200/80',
  neutral: 'bg-stone-100 text-stone-700 ring-1 ring-inset ring-stone-200/80',
};

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

export function statusToBadgeVariant(
  status: 'confirmed' | 'pending',
): BadgeVariant {
  return status === 'confirmed' ? 'confirmed' : 'pending';
}
