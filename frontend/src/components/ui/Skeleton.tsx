interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-stone-200/70 ${className}`}
      aria-hidden="true"
    />
  );
}
