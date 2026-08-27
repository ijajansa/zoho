import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ open, onClose, title, description, children, size = 'max-w-lg' }) {
    useEffect(() => {
        if (!open) return undefined;
        const close = (event) => event.key === 'Escape' && onClose();
        document.addEventListener('keydown', close);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', close);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
            <div role="dialog" aria-modal="true" className={`w-full ${size} rounded-t-3xl border border-white/70 bg-white shadow-2xl sm:rounded-2xl`}>
                <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-slate-950">{title}</h2>
                        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
                    </div>
                    <button onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Close modal"><X size={19} /></button>
                </div>
                {children}
            </div>
        </div>
    );
}
