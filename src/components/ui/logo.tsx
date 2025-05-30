import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "default" | "sidebar";
  showText?: boolean;
}

export function Logo({ className, variant = "default", showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-full w-full fill-primary"
          aria-hidden="true"
        >
          <path d="M3 8L10.89 2.4a2 2 0 0 1 2.22 0L21 8"/>
          <path d="M19 12V8" />
          <path d="M5 12V8" />
          <path d="M12 2v4" />
          <path d="M5 12h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z" />
          <path d="M12 10v4" />
          <path d="M12 18h.01" />
        </svg>
        
        {/* Batman-like shadow effect */}
        <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-gradient-to-br from-black to-transparent"></div>
      </div>
      
      {showText && (
        <span
          className={cn(
            "font-rajdhani font-bold tracking-wider",
            variant === "default" ? "text-xl" : "text-lg",
            variant === "sidebar" ? "text-sidebar-foreground" : "text-foreground"
          )}
        >
          DarkKnight <span className="text-primary">CRM</span>
        </span>
      )}
    </div>
  );
}