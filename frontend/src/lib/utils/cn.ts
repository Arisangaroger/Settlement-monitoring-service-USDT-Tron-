export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function iconClass(size: string, className?: string): string {
  return cn(size, 'shrink-0', className);
}
