import { AppWindow, BriefcaseBusiness, Building2, CalendarDays, ClipboardList, Database, FileText, Package, Settings, ShoppingCart, Users, WalletCards } from 'lucide-react';

export const APPLICATION_ICONS = [
    { id: 'app', label: 'App', icon: AppWindow },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'package', label: 'Package', icon: Package },
    { id: 'shopping-cart', label: 'Shopping cart', icon: ShoppingCart },
    { id: 'building', label: 'Building', icon: Building2 },
    { id: 'briefcase', label: 'Briefcase', icon: BriefcaseBusiness },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'file', label: 'File', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'clipboard', label: 'Clipboard', icon: ClipboardList },
    { id: 'wallet', label: 'Wallet', icon: WalletCards },
];

export default function ApplicationIcon({ name = 'app', size = 22, className = '' }) {
    const item = APPLICATION_ICONS.find((option) => option.id === name) || APPLICATION_ICONS[0];
    const Icon = item.icon;
    return <Icon size={size} className={className} />;
}
