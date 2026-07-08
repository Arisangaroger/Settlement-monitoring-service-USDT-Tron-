import Image from 'next/image';
import usdtImage from '@/assets/usdt.png';
import { cn, iconClass } from '@/lib/utils/cn';

type IconProps = { className?: string; size?: string };

export function DashboardNavIcon({
  className,
  size = 'h-[18px] w-[18px]',
}: IconProps) {
  return (
    <svg className={iconClass(size, className)} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function SwapStatIcon({ className, size = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={iconClass(size, className)} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M14 6H6L8 4M6 14H14L12 16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UsdtStatIcon({ className, size = 'h-4 w-4' }: IconProps) {
  return (
    <Image
      src={usdtImage}
      alt=""
      width={20}
      height={20}
      className={iconClass(size, cn('object-contain', className))}
      aria-hidden="true"
    />
  );
}

export function CheckStatIcon({ className, size = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={iconClass(size, className)} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M6 10.5L8.5 13L14 7.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ClockStatIcon({ className, size = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={iconClass(size, className)} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 6V10L12.5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CheckCircleStatIcon({ className, size = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={iconClass(size, className)} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M7 10L9 12L13 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WalletOutlineIcon({ className, size = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={iconClass(size, className)} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3.5 6.5C3.5 5.67 4.17 5 5 5H15C15.83 5 16.5 5.67 16.5 6.5V14.5C16.5 15.33 15.83 16 15 16H5C4.17 16 3.5 15.33 3.5 14.5V6.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M13 11H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function InboxEmptyIcon({ className, size = 'h-6 w-6' }: IconProps) {
  return (
    <svg className={iconClass(size, className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 8.5L12 13.5L20 8.5M5 18H19C20.1 18 21 17.1 21 16V8C21 6.9 20.1 6 19 6H5C3.9 6 3 6.9 3 8V16C3 17.1 3.9 18 5 18Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HourglassStatIcon({ className, size = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={iconClass(size, className)} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M6 4H14M6 16H14M8 4L10 9L8 16M12 4L10 9L12 16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WalletIcon({ className, size = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={iconClass(size, className)} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.5 5.5C2.5 4.67 3.17 4 4 4H12C12.83 4 13.5 4.67 13.5 5.5V11.5C13.5 12.33 12.83 13 12 13H4C3.17 13 2.5 12.33 2.5 11.5V5.5Z"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path d="M10.5 9H12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

export function CopyIcon({ className, size = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg className={iconClass(size, className)} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="5.5" y="5.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M4 10.5V4.5C4 3.67 4.67 3 5.5 3H10.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ExternalLinkIcon({ className, size = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg className={iconClass(size, className)} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M5.5 2.5H11.5V8.5M11.5 2.5L2.5 11.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchIcon({ className, size = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={iconClass(size, className)} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.25" />
      <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronLeftIcon({ className, size = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={iconClass(size, className)} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M10 4L6 8L10 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronRightIcon({ className, size = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={iconClass(size, className)} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6 4L10 8L6 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TronNetworkIcon({ className, size = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={iconClass(size, className)} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 3L16.5 16H3.5L10 3Z" stroke="#EF0027" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M10 7V13" stroke="#EF0027" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

export function StatusCheckIcon({ className, size = 'h-3 w-3' }: IconProps) {
  return (
    <svg className={iconClass(size, className)} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3.5 7.5L5.5 9.5L10.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StatusPendingIcon({ className, size = 'h-3 w-3' }: IconProps) {
  return (
    <svg className={iconClass(size, className)} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M4 3H10M4 11H10M5.5 3L7 7L5.5 11M8.5 3L7 7L8.5 11"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StatusFailedIcon({ className, size = 'h-3 w-3' }: IconProps) {
  return (
    <svg className={iconClass(size, className)} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M4 4L10 10M10 4L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
