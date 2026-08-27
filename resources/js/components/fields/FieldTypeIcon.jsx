import { AlignLeft, Binary, Calendar, CalendarClock, CheckSquare, CircleDot, Clock, DollarSign, Hash, KeyRound, Link, ListFilter, Mail, Percent, Phone, ToggleRight, Type } from 'lucide-react';

const icons = {
    type: Type,
    'align-left': AlignLeft,
    hash: Hash,
    binary: Binary,
    mail: Mail,
    phone: Phone,
    link: Link,
    'key-round': KeyRound,
    calendar: Calendar,
    clock: Clock,
    'calendar-clock': CalendarClock,
    'list-filter': ListFilter,
    'circle-dot': CircleDot,
    'square-check': CheckSquare,
    'toggle-right': ToggleRight,
    'dollar-sign': DollarSign,
    percent: Percent,
};

export default function FieldTypeIcon({ name, size = 17, className = '' }) {
    const Icon = icons[name] || Type;
    return <Icon size={size} className={className} />;
}
