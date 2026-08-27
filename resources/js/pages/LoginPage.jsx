import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { errorMessage, validationErrors } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import FormField from '../components/FormField';
import Spinner from '../components/Spinner';

export default function LoginPage() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const submit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setErrors({});
        setMessage('');
        try {
            await login(form);
            navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
        } catch (error) {
            setErrors(validationErrors(error));
            setMessage(errorMessage(error, 'Unable to sign in.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <p className="text-sm font-semibold text-brand-700">Welcome back</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl">Sign in to your account</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">Continue building the tools that move your business forward.</p>
            {message && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>}
            <form onSubmit={submit} className="mt-8 space-y-5">
                <FormField label="Email address" name="email" type="email" autoComplete="email" placeholder="you@company.com" value={form.email} error={errors.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
                <div className="relative">
                    <FormField label="Password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={form.password} error={errors.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-[42px] text-slate-400 hover:text-slate-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
                    {submitting ? <Spinner /> : <>Sign in <ArrowRight size={17} /></>}
                </button>
            </form>
            <p className="mt-7 text-center text-sm text-slate-500">New to Formly? <Link to="/register" className="font-semibold text-slate-950 hover:text-brand-700">Create an account</Link></p>
        </div>
    );
}
