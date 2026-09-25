import { cn } from '@/lib/utils';
import * as React from 'react';
import { Platform, TextInput, type TextInputProps } from 'react-native';

function Input({
  className,
  ...props
}: TextInputProps & React.RefAttributes<TextInput> & { 'aria-invalid'?: boolean }) {
  return (
    <TextInput
      className={cn(
        'flex h-10 w-full min-w-0 flex-row items-center rounded-md border border-input bg-background px-3 py-1 font-sans text-base leading-5 text-foreground shadow-sm shadow-black/5 dark:bg-input/30 sm:h-9',
        props.editable === false &&
          cn(
            'opacity-50',
            Platform.select({ web: 'disabled:pointer-events-none disabled:cursor-not-allowed' })
          ),
        Platform.select({
          web: cn(
            'outline-none transition-[color,box-shadow] selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground md:text-sm',
            'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'
          ),
          native: 'placeholder:text-muted-foreground/50',
        }),
        // Driven by the prop, not an `aria-invalid:` variant — that variant is Tailwind v4-only
        // (this project is on v3), and a prop check also works on native.
        props['aria-invalid'] && 'border-destructive',
        className
      )}
      {...props}
    />
  );
}

export { Input };
