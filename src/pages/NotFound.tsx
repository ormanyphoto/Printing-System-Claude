import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <p className="mt-2 text-lg text-muted-foreground">Page not found</p>
        <Button asChild className="mt-6">
          <Link to="/"><Home className="mr-2 h-4 w-4" /> Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
