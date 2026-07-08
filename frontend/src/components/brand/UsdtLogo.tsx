import Image from 'next/image';
import usdtImage from '@/assets/usdt.png';
import { cn } from '@/lib/utils/cn';

interface UsdtLogoProps {
  size?: number;
  className?: string;
}

export function UsdtLogo({ size = 36, className }: UsdtLogoProps) {
  return (
    <Image
      src={usdtImage}
      alt="USDT"
      width={size}
      height={size}
      className={cn('shrink-0 object-contain', className)}
      priority
    />
  );
}
