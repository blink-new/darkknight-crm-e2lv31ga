import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
  cellClassName?: string;
  showTableHeader?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  className,
  cellClassName,
  showTableHeader = true,
}) => {
  return (
    <div className={cn("w-full space-y-3", className)}>
      {showTableHeader && (
        <div className="flex items-center justify-between space-x-4 p-4 border-b border-zinc-800">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={`header-${i}`} className={cn("h-5 flex-1 bg-zinc-700/50", cellClassName)} />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={`row-${i}`} className="flex items-center space-x-4 p-4 border-b border-zinc-800 last:border-b-0">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={`cell-${i}-${j}`} className={cn("h-8 flex-1 bg-zinc-800/60", cellClassName)} />
          ))}
        </div>
      ))}
    </div>
  );
};