type BadgeVariant = 'confirmed' | 'pending' | 'failed' | 'neutral';

const styles: Record<BadgeVariant, string> = {
  confirmed: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  pending: 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200',
  failed: 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200',
  neutral: 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200',
};

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function Badge({ variant, children, icon }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[variant]}`}
    >
      {icon}
      {children}
    </span>
  );
}

export function statusToBadgeVariant(
  status: 'confirmed' | 'pending',
): BadgeVariant {
  return status === 'confirmed' ? 'confirmed' : 'pending';
}

export function processingToBadgeVariant(
  status: 'new' | 'processed' | 'duplicate_ignored' | 'failed',
): BadgeVariant {
  if (status === 'failed') return 'failed';
  return 'neutral';
}
