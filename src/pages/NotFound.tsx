import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <Logo className="mb-8" />
      
      <div className="bat-shadow rounded-lg bg-card p-6 md:p-10 max-w-md w-full">
        <h1 className="font-rajdhani text-4xl font-bold tracking-tight mb-2">
          404 - Page Not Found
        </h1>
        
        <div className="flex justify-center my-6">
          <div className="relative h-32 w-32 opacity-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-full w-full"
            >
              <path d="M3 8L10.89 2.4a2 2 0 0 1 2.22 0L21 8"/>
              <path d="M19 12V8" />
              <path d="M5 12V8" />
              <path d="M12 2v4" />
              <path d="M5 12h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z" />
              <path d="M12 10v4" />
              <path d="M12 18h.01" />
            </svg>
          </div>
        </div>
        
        <p className="mb-6 text-muted-foreground">
          The page you're looking for has vanished into the shadows.
        </p>
        
        <Button asChild className="w-full">
          <Link to="/">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}