import { Boxes, BriefcaseBusiness, Building2, CalendarDays, ClipboardList, Database, FileText, Package, ReceiptText, ShoppingCart, Tag, Truck, UserRound, Users, WalletCards } from 'lucide-react';

export const MODULE_ICONS = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'package', label: 'Package', icon: Package },
    { id: 'shopping-cart', label: 'Shopping cart', icon: ShoppingCart },
    { id: 'building', label: 'Building', icon: Building2 },
    { id: 'briefcase', label: 'Briefcase', icon: BriefcaseBusiness },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'file', label: 'File', icon: FileText },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'clipboard', label: 'Clipboard', icon: ClipboardList },
    { id: 'wallet', label: 'Wallet', icon: WalletCards },
    { id: 'truck', label: 'Truck', icon: Truck },
    { id: 'tag', label: 'Tag', icon: Tag },
    { id: 'boxes', label: 'Boxes', icon: Boxes },
    { id: 'receipt', label: 'Receipt', icon: ReceiptText },
    { id: 'user', label: 'User', icon: UserRound },
];

export default function ModuleIcon({ name = 'database', size = 21, className = '' }) {
    const option = MODULE_ICONS.find((item) => item.id === name) || MODULE_ICONS[5];
    const Icon = option.icon;
    return <Icon size={size} className={className} />;
}
