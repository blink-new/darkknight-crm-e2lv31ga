import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface EmptyStatePlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onActionClick?: () => void;
  actionLink?: string;
  className?: string;
}

export const EmptyStatePlaceholder: React.FC<EmptyStatePlaceholderProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onActionClick,
  actionLink,
  className,
}) => {
  const ActionButton = actionLink ? Link : Button;
  const actionProps = actionLink ? { to: actionLink } : { onClick: onActionClick };

  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-lg border-2 border-dashed border-zinc-800 bg-card/50 bat-shadow", className)}>
      <div className="w-16 h-16 mb-6 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <h2 className="font-display text-3xl text-foreground mb-2 tracking-wide">{title}</h2>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      {actionText && (actionClick || actionLink) && (
        <ActionButton 
          {...actionProps}
          className={cn(
            'px-6 py-3 text-base font-semibold rounded-md transition-all duration-200',
            actionLink 
              ? 'bg-primary text-primary-foreground hover:bg-yellow-400 bat-glow' 
              : 'bg-primary text-primary-foreground hover:bg-yellow-400 bat-glow'
          )}
        >
          {actionText}
        </ActionButton>
      )}
    </div>
  );
};