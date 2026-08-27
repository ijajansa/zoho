import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
    return <div className="grid min-h-screen place-items-center bg-slate-50 px-6 text-center"><div><p className="text-sm font-bold text-brand-700">404</p><h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">Page not found</h1><p className="mt-3 text-sm text-slate-500">The page you’re looking for doesn’t exist.</p><Link to="/dashboard" className="btn-primary mt-7"><ArrowLeft size={16} /> Back to dashboard</Link></div></div>;
}
