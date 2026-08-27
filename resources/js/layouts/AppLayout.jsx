import { AppWindow, ChevronDown, Grid2X2, LayoutDashboard, LogOut, Menu, Settings, Users, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Logo from '../components/Logo';

const navItems = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/workspaces', label: 'Workspaces', icon: Grid2X2 },
];

export default function AppLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen bg-[#f7f9fb]">
            {sidebarOpen && <button className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" />}
            <aside className={`fixed inset-y-0 left-0 z-40 flex w-[270px] flex-col border-r border-slate-200/80 bg-white transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex h-20 items-center justify-between px-6">
                    <Logo />
                    <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
                </div>
                <nav className="flex-1 px-4 py-4">
                    <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Workspace</p>
                    <div className="space-y-1">
                        {navItems.map(({ to, label, icon: Icon }) => (
                            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}>
                                <Icon size={18} /> {label}
                            </NavLink>
                        ))}
                    </div>
                    <p className="mb-3 mt-8 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Coming later</p>
                    <div className="space-y-1">
                        <DisabledNav icon={AppWindow} label="Applications" />
                        <DisabledNav icon={Users} label="Team & roles" />
                        <DisabledNav icon={Settings} label="Settings" />
                    </div>
                </nav>
                <div className="border-t border-slate-100 p-4">
                    <button onClick={() => setProfileOpen((value) => !value)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-slate-50">
                        <Avatar name={user.name} />
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-800">{user.name}</span>
                            <span className="block truncate text-xs text-slate-400">{user.email}</span>
                        </span>
                        <ChevronDown size={16} className={`text-slate-400 transition ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {profileOpen && <button onClick={handleLogout} className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"><LogOut size={17} /> Sign out</button>}
                </div>
            </aside>
            <div className="lg:pl-[270px]">
                <header className="sticky top-0 z-20 flex h-18 items-center justify-between border-b border-slate-200/70 bg-white/90 px-5 backdrop-blur-lg sm:px-8 lg:hidden">
                    <button className="rounded-xl border border-slate-200 p-2 text-slate-600" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
                    <span className="text-sm font-semibold text-slate-800">{location.pathname.startsWith('/workspaces') ? 'Workspaces' : 'Overview'}</span>
                    <Avatar name={user.name} small />
                </header>
                <main className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 sm:py-10 lg:px-10 xl:px-14"><Outlet /></main>
            </div>
        </div>
    );
}

function DisabledNav({ icon: Icon, label }) {
    return <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400"><Icon size={18} /> {label}<span className="ml-auto rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide">Soon</span></div>;
}

function Avatar({ name, small = false }) {
    const initials = name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
    return <span className={`grid shrink-0 place-items-center rounded-xl bg-brand-100 font-bold text-brand-800 ${small ? 'size-9 text-xs' : 'size-10 text-sm'}`}>{initials}</span>;
}
