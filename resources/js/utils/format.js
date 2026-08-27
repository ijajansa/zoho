export function formatDate(value, options = {}) {
    if (!value) return '—';
    return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', ...options }).format(new Date(value));
}

export function initials(value = '') {
    return value.split(' ').filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'W';
}
