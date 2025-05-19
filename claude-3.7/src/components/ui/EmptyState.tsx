// src/components/ui/EmptyState.tsx
"use client"; // Can be client or server depending on usage, but client is safer if action is interactive

import React, { type ReactNode } from 'react';
import { Button } from '~/components/ui/Button'; // Assuming Button component
import { cn } from '~/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    text: string;
    onClick?: () => void;
    href?: string;
  } | ReactNode; // Allow passing a full button/link component
  className?: string;
  contentClassName?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
  contentClassName,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-lg border-2 border-dashed border-border bg-card min-h-[300px]",
        className
      )}
    >
      <div className={cn("max-w-md", contentClassName)}>
        {icon && (
          <div className="mb-6 text-muted-foreground opacity-70 text-5xl md:text-6xl">
            {icon}
          </div>
        )}
        <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
          {title}
        </h2>
        {description && (
          <p className="text-muted-foreground mb-6">
            {description}
          </p>
        )}
        {action && (
          <div className="mt-6">
            {React.isValidElement(action) ? (
              action
            ) : action && typeof action === 'object' && 'text' in action ? (
              <Button
                onClick={action.onClick}
                asChild={!!action.href}
              >
                {action.href ? <a href={action.href}>{action.text}</a> : action.text}
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};