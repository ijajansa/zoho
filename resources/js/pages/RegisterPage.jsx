import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { errorMessage, validationErrors } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import FormField from '../components/FormField';
import Spinner from '../components/Spinner';

export default function RegisterPage() {
    const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
    const submit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setErrors({});
        setMessage('');
        try {
            await register(form);
            navigate('/dashboard', { replace: true });
        } catch (error) {
            setErrors(validationErrors(error));
            setMessage(errorMessage(error, 'Unable to create your account.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <p className="text-sm font-semibold text-brand-700">Get started for free</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl">Create your account</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">Set up your first workspace in just a few minutes.</p>
            {message && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>}
            <form onSubmit={submit} className="mt-7 space-y-4">
                <FormField label="Full name" name="name" autoComplete="name" placeholder="Alex Morgan" value={form.name} error={errors.name} onChange={update} required />
                <FormField label="Work email" name="email" type="email" autoComplete="email" placeholder="alex@company.com" value={form.email} error={errors.email} onChange={update} required />
                <div className="relative">
                    <FormField label="Password" hint="Minimum 8 characters" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Create a secure password" value={form.password} error={errors.password} onChange={update} required />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-[42px] text-slate-400 hover:text-slate-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                <FormField label="Confirm password" name="password_confirmation" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Repeat your password" value={form.password_confirmation} error={errors.password_confirmation} onChange={update} required />
                <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
                    {submitting ? <Spinner /> : <>Create account <ArrowRight size={17} /></>}
                </button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-semibold text-slate-950 hover:text-brand-700">Sign in</Link></p>
        </div>
    );
}
