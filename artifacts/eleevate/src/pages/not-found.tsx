import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4" data-testid="not-found-page">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
          <GraduationCap className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-6xl font-bold font-serif text-foreground mb-4">404</h1>
        <h2 className="text-xl font-semibold text-foreground mb-3">Page not found</h2>
        <p className="text-muted-foreground mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link href="/">
          <Button data-testid="btn-go-home">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to home
          </Button>
        </Link>
      </div>
    </div>
  );
}
