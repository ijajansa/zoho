import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCenter, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ArrowLeft, Eye, LoaderCircle, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useBlocker, useOutletContext, useParams } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { getFields, getFieldTypes, saveModuleForm } from '../api/fields';
import FieldPalette from '../components/fields/FieldPalette';
import FieldPreview from '../components/fields/FieldPreview';
import FieldSettingsPanel from '../components/fields/FieldSettingsPanel';
import FormPreview from '../components/fields/FormPreview';
import SortableField from '../components/fields/SortableField';
import Spinner from '../components/Spinner';
import { useToast } from '../components/ToastProvider';
import { createLocalField, fieldPayload, newClientId, normalizeField } from '../fields/fieldState';

export default function FormBuilderPage() {
    const { workspaceId, applicationId, moduleId } = useParams();
    const { module } = useOutletContext();
    const notify = useToast();
    const [fields, setFields] = useState([]);
    const [fieldTypes, setFieldTypes] = useState([]);
    const [selectedKey, setSelectedKey] = useState(null);
    const [draggedType, setDraggedType] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [preview, setPreview] = useState(false);
    const [error, setError] = useState('');
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
    const definitions = useMemo(() => Object.fromEntries(fieldTypes.map((type) => [type.type, type])), [fieldTypes]);
    const selected = fields.find((field) => field._key === selectedKey) || null;
    const blocker = useBlocker(dirty && !saving);

    useEffect(() => {
        Promise.all([getFieldTypes(), getFields(workspaceId, applicationId, moduleId)])
            .then(([types, savedFields]) => { setFieldTypes(types); setFields(savedFields.map(normalizeField)); })
            .catch((requestError) => setError(errorMessage(requestError, 'Could not load the form builder.')))
            .finally(() => setLoading(false));
    }, [workspaceId, applicationId, moduleId]);

    useEffect(() => {
        const warn = (event) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);

    useEffect(() => {
        if (blocker.state === 'blocked') {
            if (window.confirm('You have unsaved form changes. Leave without saving?')) blocker.proceed();
            else blocker.reset();
        }
    }, [blocker]);

    const addField = (type, index = fields.length) => {
        const field = createLocalField(type);
        setFields((items) => [...items.slice(0, index), field, ...items.slice(index)]);
        setSelectedKey(field._key);
        setDirty(true);
    };

    const updateField = (nextField) => { setFields((items) => items.map((field) => field._key === nextField._key ? nextField : field)); setDirty(true); };
    const duplicateField = (field) => {
        const clientId = newClientId();
        const copy = normalizeField({ ...field, id: undefined, name: undefined, client_id: clientId, _key: clientId, label: `${field.label} Copy`, options: field.options.map((option) => ({ ...option })), validation_rules: { ...field.validation_rules }, settings: { ...field.settings } });
        const index = fields.findIndex((item) => item._key === field._key);
        setFields((items) => [...items.slice(0, index + 1), copy, ...items.slice(index + 1)]);
        setSelectedKey(copy._key);
        setDirty(true);
    };
    const deleteField = (field) => {
        if (field.id && !window.confirm(`Delete “${field.label}”? It will be removed when you save the form.`)) return;
        setFields((items) => items.filter((item) => item._key !== field._key));
        if (selectedKey === field._key) setSelectedKey(null);
        setDirty(true);
    };

    const handleDragStart = ({ active }) => setDraggedType(active.data.current?.source === 'palette' ? active.data.current.fieldType : null);
    const handleDragEnd = ({ active, over }) => {
        setDraggedType(null);
        if (!over) return;
        if (active.data.current?.source === 'palette') {
            const overIndex = fields.findIndex((field) => field._key === over.id);
            addField(active.data.current.fieldType, overIndex < 0 ? fields.length : overIndex);
            return;
        }
        if (active.id !== over.id) {
            setFields((items) => {
                const oldIndex = items.findIndex((field) => field._key === active.id);
                const newIndex = items.findIndex((field) => field._key === over.id);
                return oldIndex < 0 || newIndex < 0 ? items : arrayMove(items, oldIndex, newIndex);
            });
            setDirty(true);
        }
    };

    const save = async () => {
        setSaving(true);
        try {
            const saved = await saveModuleForm(workspaceId, applicationId, moduleId, fields.map(fieldPayload));
            const normalized = saved.map(normalizeField);
            setFields(normalized);
            setSelectedKey((key) => normalized.find((field) => field._key === key)?.id ? key : null);
            setDirty(false);
            notify('Form saved successfully.');
        } catch (requestError) {
            notify(errorMessage(requestError, 'Could not save the form. Your unsaved changes are still here.'), 'error');
        } finally { setSaving(false); }
    };

    if (loading) return <div className="grid min-h-[520px] place-items-center"><Spinner className="size-7 text-brand-600" /></div>;
    if (error) return <div className="grid min-h-[520px] place-items-center p-8 text-center"><div><h2 className="font-bold text-slate-900">Form builder unavailable</h2><p className="mt-2 text-sm text-slate-500">{error}</p></div></div>;

    return <div className="min-h-[640px]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5"><div><h2 className="font-bold text-slate-900">{preview ? 'Form preview' : 'Form builder'}</h2><p className={`text-xs font-medium ${dirty ? 'text-amber-600' : 'text-slate-400'}`}>{dirty ? 'Unsaved changes' : 'Saved'}</p></div><div className="flex gap-2">{preview ? <button type="button" onClick={() => setPreview(false)} className="btn-secondary"><ArrowLeft size={15} /> Back to builder</button> : <button type="button" onClick={() => setPreview(true)} className="btn-secondary"><Eye size={15} /> Preview</button>}<button type="button" onClick={save} disabled={saving || !dirty} className="btn-primary">{saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />} {saving ? 'Saving…' : 'Save form'}</button></div></div>
        {preview ? <FormPreview fields={fields} moduleName={module.name} /> : <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragCancel={() => setDraggedType(null)} onDragEnd={handleDragEnd}><div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)_280px]"><FieldPalette fieldTypes={fieldTypes} onAdd={addField} /><BuilderCanvas fields={fields} selectedKey={selectedKey} onSelect={setSelectedKey} onDuplicate={duplicateField} onDelete={deleteField} /><FieldSettingsPanel field={selected} definition={selected ? definitions[selected.field_type] : null} onChange={updateField} onDuplicate={duplicateField} onDelete={deleteField} onClose={() => setSelectedKey(null)} /></div><DragOverlay>{draggedType ? <div className="w-44 rounded-xl border border-brand-200 bg-white p-3 text-sm font-semibold text-brand-700 shadow-xl">Add {draggedType.label}</div> : null}</DragOverlay></DndContext>}
    </div>;
}

function BuilderCanvas({ fields, selectedKey, onSelect, onDuplicate, onDelete }) {
    const { setNodeRef, isOver } = useDroppable({ id: 'form-canvas' });
    return <main className={`min-h-[520px] bg-slate-100/60 p-4 sm:p-6 ${isOver ? 'bg-brand-50/70' : ''}`}><div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Form canvas</p><p className="mt-1 text-xs text-slate-500">Select a field to configure it. Drag fields to reorder.</p></div><div ref={setNodeRef} className={`grid min-h-80 grid-cols-12 content-start gap-3 rounded-2xl border border-dashed p-3 transition sm:p-4 ${isOver ? 'border-brand-400 bg-brand-50/60' : 'border-slate-300 bg-white/50'}`}><SortableContext items={fields.map((field) => field._key)} strategy={rectSortingStrategy}>{fields.map((field) => <SortableField key={field._key} field={field} selected={field._key === selectedKey} onSelect={onSelect} onDuplicate={onDuplicate} onDelete={onDelete} />)}</SortableContext>{fields.length === 0 && <div className="col-span-12 grid min-h-72 place-items-center px-6 text-center"><div><p className="font-semibold text-slate-700">Build your form</p><p className="mt-1 text-sm leading-6 text-slate-500">Drag a field type here, or click one in the palette.</p></div></div>}</div></main>;
}
