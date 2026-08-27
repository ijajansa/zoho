import api from './client';

const baseUrl = (workspaceId, applicationId, moduleId) => `/workspaces/${workspaceId}/applications/${applicationId}/modules/${moduleId}`;

export async function getFieldTypes() {
    const { data } = await api.get('/field-types');
    return data.data.field_types;
}

export async function getFields(workspaceId, applicationId, moduleId) {
    const { data } = await api.get(`${baseUrl(workspaceId, applicationId, moduleId)}/fields`);
    return data.data.fields;
}

export async function createField(workspaceId, applicationId, moduleId, payload) {
    const { data } = await api.post(`${baseUrl(workspaceId, applicationId, moduleId)}/fields`, payload);
    return data.data.field;
}

export async function updateField(workspaceId, applicationId, moduleId, fieldId, payload) {
    const { data } = await api.put(`${baseUrl(workspaceId, applicationId, moduleId)}/fields/${fieldId}`, payload);
    return data.data.field;
}

export async function deleteField(workspaceId, applicationId, moduleId, fieldId) {
    const { data } = await api.delete(`${baseUrl(workspaceId, applicationId, moduleId)}/fields/${fieldId}`);
    return data;
}

export async function reorderFields(workspaceId, applicationId, moduleId, fields) {
    const { data } = await api.put(`${baseUrl(workspaceId, applicationId, moduleId)}/fields/reorder`, { fields });
    return data.data.fields;
}

export async function saveModuleForm(workspaceId, applicationId, moduleId, fields) {
    const { data } = await api.put(`${baseUrl(workspaceId, applicationId, moduleId)}/form`, { fields });
    return data.data.fields;
}
