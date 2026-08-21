import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Checkbox = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'> & { checked?: boolean | 'indeterminate'; onCheckedChange?: (checked: boolean | 'indeterminate') => void }>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
    const isChecked = checked === true;
    const indeterminate = checked === 'indeterminate';
    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : isChecked}
        data-state={indeterminate ? 'indeterminate' : isChecked ? 'checked' : 'unchecked'}
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          onCheckedChange?.(isChecked ? false : true);
        }}
        className={cn(
          'grid size-4 shrink-0 place-items-center rounded-sm border border-primary/40 bg-background text-primary',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isChecked && 'border-primary bg-primary text-primary-foreground',
          className,
        )}
        {...props}
      >
        {isChecked && <Check className="size-3" strokeWidth={3} />}
        {indeterminate && <span className="h-0.5 w-2 rounded-full bg-current" />}
      </button>
    );
  },
);
Checkbox.displayName = 'Checkbox';