export const newClientId = () => `temp_${crypto.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;

export function normalizeFieldOrder(fields) {
    return fields.map((field, index) => ({ ...field, sort_order: index + 1 }));
}

export function normalizeField(field) {
    const clientId = field.client_id || (!field.id ? newClientId() : undefined);

    return {
        ...field,
        client_id: clientId,
        _key: field._key || (field.id ? `field:${field.id}` : `temp:${clientId}`),
        placeholder: field.placeholder || '',
        help_text: field.help_text || '',
        default_value: field.default_value ?? '',
        validation_rules: field.validation_rules || {},
        options: field.options || [],
        settings: field.settings || {},
        is_required: Boolean(field.is_required),
        is_unique: Boolean(field.is_unique),
        is_readonly: Boolean(field.is_readonly),
        is_hidden: Boolean(field.is_hidden),
        width: Number(field.width || 12),
        status: field.status || 'active',
    };
}

export function createLocalField(type) {
    const clientId = newClientId();
    const choiceOptions = type.supports_options ? [{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }] : [];
    return normalizeField({
        client_id: clientId,
        _key: `temp:${clientId}`,
        label: `${type.label} Field`,
        field_type: type.type,
        placeholder: type.supports_placeholder ? `Enter ${type.label.toLowerCase()}` : '',
        help_text: '',
        default_value: '',
        is_required: false,
        is_unique: false,
        is_readonly: false,
        is_hidden: false,
        validation_rules: type.type === 'textarea' ? { rows: 4 } : {},
        options: choiceOptions,
        settings: {},
        width: 12,
        status: 'active',
    });
}

export function fieldPayload(field, index) {
    const payload = {
        label: field.label,
        field_type: field.field_type,
        placeholder: field.placeholder || null,
        help_text: field.help_text || null,
        default_value: field.default_value === '' ? null : field.default_value,
        is_required: Boolean(field.is_required),
        is_unique: Boolean(field.is_unique),
        is_readonly: Boolean(field.is_readonly),
        is_hidden: Boolean(field.is_hidden),
        validation_rules: field.validation_rules || {},
        options: field.options || [],
        settings: field.settings || {},
        sort_order: index + 1,
        width: Number(field.width),
        status: field.status || 'active',
    };
    if (field.id) payload.id = field.id;
    else payload.client_id = field.client_id || field._key;
    return payload;
}
