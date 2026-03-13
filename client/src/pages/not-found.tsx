import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto opacity-60">
          <AlertCircle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">404 — Page Not Found</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button variant="secondary">Back to Discover</Button>
        </Link>
      </div>
    </div>
  );
}
