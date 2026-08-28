import api from './client';

const schemaUrl = (workspaceId, applicationId, moduleId) => `/workspaces/${workspaceId}/applications/${applicationId}/modules/${moduleId}/schema`;

export async function getModuleSchema(workspaceId, applicationId, moduleId) {
    const { data } = await api.get(schemaUrl(workspaceId, applicationId, moduleId));
    return data.data;
}

export async function publishModuleSchema(workspaceId, applicationId, moduleId) {
    const { data } = await api.post(`${schemaUrl(workspaceId, applicationId, moduleId)}/publish`);
    return data.data;
}

export async function getModuleSchemaHistory(workspaceId, applicationId, moduleId) {
    const { data } = await api.get(`${schemaUrl(workspaceId, applicationId, moduleId)}/history`);
    return data.data;
}
