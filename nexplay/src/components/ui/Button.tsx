import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  className?: string;
  children?: React.ReactNode;
}

type ButtonAsButton = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = BaseProps & { href: string } & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
  >;

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-nexplay-gradient text-white shadow-glow-primary hover:shadow-[0_0_36px_0_rgba(124,58,237,0.6)] hover:brightness-110",
  secondary:
    "bg-secondary text-background hover:bg-secondary-hover shadow-glow-secondary",
  outline:
    "border border-white/15 text-white hover:border-primary/60 hover:bg-primary/10",
  ghost: "text-muted hover:text-white hover:bg-white/5",
  danger: "bg-danger text-white hover:brightness-110",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm gap-1.5",
  md: "h-11 px-6 text-sm gap-2",
  lg: "h-14 px-8 text-base gap-2.5",
};

/**
 * Universal button/link component for the NexPlay design system.
 * Renders a <Link> when `href` is provided, otherwise a native <button>.
 */
export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    fullWidth,
    icon,
    iconPosition = "right",
    className,
    children,
    ...rest
  } = props;

  const classes = cn(
    "inline-flex items-center justify-center rounded-xl font-display font-semibold",
    "transition-all duration-200 ease-out active:scale-[0.97]",
    "disabled:opacity-40 disabled:pointer-events-none",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && "w-full",
    className
  );

  const content = (
    <>
      {icon && iconPosition === "left" && <span className="shrink-0">{icon}</span>}
      {children}
      {icon && iconPosition === "right" && <span className="shrink-0">{icon}</span>}
    </>
  );

  if ("href" in props && props.href) {
    const anchorRest = rest as React.AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <Link href={props.href} className={classes} {...anchorRest}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {content}
    </button>
  );
}
