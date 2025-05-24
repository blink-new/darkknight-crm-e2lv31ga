import * as React from 'react';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export const BrandLogo = ({ size = 270, className = '' }: BrandLogoProps) => {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <img
        src="/logo.png"
        alt="DarkKnight CRM Logo"
        width={size}
        height={size}
        style={{ width: size, height: size, display: 'block' }}
        draggable={false}
      />
    </div>
  );
};
