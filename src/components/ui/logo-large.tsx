import { cn } from "@/lib/utils";

interface LogoLargeProps {
  className?: string;
  variant?: "default" | "sidebar";
  showText?: boolean;
}

export function LogoLarge({ className, variant = "default", showText = true }: LogoLargeProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-full w-full fill-primary"
          aria-hidden="true"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" fill="#1E1E1E" stroke="#EAB308" strokeWidth="1.5" />
          <path d="M16.5 8.5L7.5 15.5M7.5 8.5L16.5 15.5" stroke="#EAB308" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      
      {showText && (
        <span
          className={cn(
            "font-rajdhani font-bold tracking-wider",
            variant === "default" ? "text-3xl" : "text-2xl",
            variant === "sidebar" ? "text-sidebar-foreground" : "text-primary"
          )}
        >
          DarkKnight <span className="text-primary">CRM</span>
        </span>
      )}
    </div>
  );
}