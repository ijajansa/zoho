import api from './client';

const baseUrl = (workspaceId, applicationId) => `/workspaces/${workspaceId}/applications/${applicationId}/modules`;

export async function getModules(workspaceId, applicationId) {
    const { data } = await api.get(baseUrl(workspaceId, applicationId));
    return data.data.modules;
}

export async function getModule(workspaceId, applicationId, moduleId) {
    const { data } = await api.get(`${baseUrl(workspaceId, applicationId)}/${moduleId}`);
    return data.data.module;
}

export async function createModule(workspaceId, applicationId, payload) {
    const { data } = await api.post(baseUrl(workspaceId, applicationId), payload);
    return data.data.module;
}

export async function updateModule(workspaceId, applicationId, moduleId, payload) {
    const { data } = await api.put(`${baseUrl(workspaceId, applicationId)}/${moduleId}`, payload);
    return data.data.module;
}

export async function deleteModule(workspaceId, applicationId, moduleId) {
    const { data } = await api.delete(`${baseUrl(workspaceId, applicationId)}/${moduleId}`);
    return data;
}

export async function reorderModules(workspaceId, applicationId, modules) {
    const { data } = await api.put(`${baseUrl(workspaceId, applicationId)}/reorder`, { modules });
    return data.data.modules;
}
