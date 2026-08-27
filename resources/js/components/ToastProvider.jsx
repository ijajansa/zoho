import { CheckCircle2, X, XCircle } from 'lucide-react';
import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const notify = useCallback((message, type = 'success') => {
        const id = Date.now() + Math.random();
        setToasts((items) => [...items, { id, message, type }]);
        window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 4000);
    }, []);

    return (
        <ToastContext.Provider value={notify}>
            {children}
            <div className="fixed right-4 top-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
                {toasts.map((toast) => (
                    <div key={toast.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-xl">
                        {toast.type === 'error' ? <XCircle className="text-red-500" size={19} /> : <CheckCircle2 className="text-brand-600" size={19} />}
                        <span className="flex-1">{toast.message}</span>
                        <button onClick={() => setToasts((items) => items.filter((item) => item.id !== toast.id))} className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
