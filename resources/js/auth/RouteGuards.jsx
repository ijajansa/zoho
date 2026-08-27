import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Logo from '../components/Logo';
import Spinner from '../components/Spinner';

function LoadingScreen() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
            <Logo />
            <Spinner className="size-6 text-brand-600" />
        </div>
    );
}

export function ProtectedRoute() {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) return <LoadingScreen />;
    return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}

export function GuestRoute() {
    const { user, loading } = useAuth();
    if (loading) return <LoadingScreen />;
    return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
