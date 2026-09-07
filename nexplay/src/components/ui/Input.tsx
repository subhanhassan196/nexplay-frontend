import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-muted">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "h-12 w-full rounded-xl border border-white/10 bg-surface-light px-4 text-sm text-white placeholder:text-muted-foreground",
              "transition-colors duration-200 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30",
              icon && "pl-10",
              error && "border-danger/60 focus:border-danger focus:ring-danger/30",
              className
            )}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
