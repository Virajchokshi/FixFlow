import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 mb-6">
        <Search className="h-9 w-9 text-fixflow-muted" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-2">404</h1>
      <p className="text-xl font-medium mb-2">Page not found</p>
      <p className="text-fixflow-muted text-sm max-w-sm mb-8">
        The page you're looking for doesn't exist or you don't have permission to view it.
      </p>
      <Button onClick={() => navigate('/dashboard')} className="gap-2">
        <Home className="h-4 w-4" />
        Back to Dashboard
      </Button>
    </div>
  );
}
