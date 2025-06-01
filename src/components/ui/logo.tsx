import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
}

export function Logo({ className, size = 'md', variant = 'light' }: LogoProps) {
  const sizes = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-32'
  };

  return (
    <img
      src={variant === 'light' ? '/logo.png' : '/logo-dark.svg'}
      alt="VisionHub Logo"
      className={cn(sizes[size], 'w-auto', className)}
    />
  );
}