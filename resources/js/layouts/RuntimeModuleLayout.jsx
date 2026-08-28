import { useEffect, useState } from 'react';
import { Link, Outlet, useOutletContext, useParams } from 'react-router-dom';
import { getRuntimeModule } from '../api/runtime';
import Spinner from '../components/Spinner';

export default function RuntimeModuleLayout() {
    const runtime = useOutletContext();
    const { applicationId, moduleId } = useParams();
    const [metadata, setMetadata] = useState(null);
    const [error, setError] = useState('');
    useEffect(() => {
        setMetadata(null); setError('');
        getRuntimeModule(runtime.application.workspace_id, applicationId, moduleId).then(setMetadata).catch((requestError) => setError(requestError.response?.data?.message || 'This module is unavailable.'));
    }, [runtime.application.workspace_id, applicationId, moduleId]);
    if (!metadata && !error) return <div className="grid min-h-[60vh] place-items-center"><div className="text-center"><Spinner className="mx-auto size-7 text-brand-600" /><p className="mt-3 text-sm text-slate-500">Loading module...</p></div></div>;
    if (error) return <div className="grid min-h-[55vh] place-items-center text-center"><div><h1 className="text-xl font-bold">Module unavailable</h1><p className="mt-2 text-sm text-slate-500">{error}</p><Link to={`/apps/${applicationId}`} className="btn-secondary mt-5">Back to dashboard</Link></div></div>;
    return <Outlet context={{ ...runtime, metadata }} />;
}
