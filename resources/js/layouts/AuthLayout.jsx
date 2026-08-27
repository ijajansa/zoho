import { ArrowUpRight, CheckCircle2, LayoutDashboard, ShieldCheck, Sparkles } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import Logo from '../components/Logo';

export default function AuthLayout() {
    return (
        <main className="min-h-screen bg-[#f7f9fb] lg:grid lg:grid-cols-[1fr_1fr]">
            <section className="relative hidden min-h-screen overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col xl:p-14">
                <div className="absolute -left-24 top-20 size-72 rounded-full bg-brand-400/10 blur-3xl" />
                <div className="absolute -right-16 bottom-10 size-80 rounded-full bg-cyan-400/10 blur-3xl" />
                <div className="relative z-10">
                    <Logo inverse />
                </div>
                <div className="relative z-10 my-auto max-w-xl py-16">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-brand-200">
                        <Sparkles size={14} /> Build internal tools, beautifully
                    </div>
                    <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.055em] xl:text-6xl">
                        Your operations,<br /><span className="text-brand-300">one workspace.</span>
                    </h1>
                    <p className="mt-6 max-w-lg text-lg leading-8 text-slate-400">
                        Create secure, scalable business tools without losing time to repetitive setup.
                    </p>
                    <div className="mt-10 grid grid-cols-2 gap-3">
                        <Feature icon={LayoutDashboard} title="Clean by default" text="A focused home for every team." />
                        <Feature icon={ShieldCheck} title="Secure foundation" text="Your data stays isolated." />
                    </div>
                </div>
                <div className="relative z-10 flex items-center gap-3 border-t border-white/10 pt-7 text-sm text-slate-400">
                    <CheckCircle2 size={17} className="text-brand-300" /> Built for teams who value speed and clarity
                    <ArrowUpRight size={15} className="ml-auto" />
                </div>
            </section>
            <section className="flex min-h-screen flex-col">
                <div className="px-6 pt-7 lg:hidden"><Logo /></div>
                <div className="flex flex-1 items-center justify-center px-5 py-12 sm:px-10">
                    <div className="w-full max-w-md"><Outlet /></div>
                </div>
                <p className="px-6 pb-7 text-center text-xs text-slate-400">© {new Date().getFullYear()} Formly. Built for modern operations.</p>
            </section>
        </main>
    );
}

function Feature({ icon: Icon, title, text }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <Icon size={19} className="mb-7 text-brand-300" />
            <p className="font-semibold text-white">{title}</p>
            <p className="mt-1 text-sm leading-5 text-slate-400">{text}</p>
        </div>
    );
}
