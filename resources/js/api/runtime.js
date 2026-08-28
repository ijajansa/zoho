import api from './client';

const moduleBase = (workspaceId, applicationId, moduleId) => `/workspaces/${workspaceId}/applications/${applicationId}/modules/${moduleId}`;

export async function getRuntimeApplication(applicationId) {
    const { data } = await api.get(`/applications/${applicationId}/runtime`);
    return data.data;
}

export async function getRuntimeModule(workspaceId, applicationId, moduleId) {
    const { data } = await api.get(`${moduleBase(workspaceId, applicationId, moduleId)}/runtime`);
    return data.data;
}

export async function getRecords(workspaceId, applicationId, moduleId, params = {}) {
    const { data } = await api.get(`${moduleBase(workspaceId, applicationId, moduleId)}/records`, { params });
    return data.data;
}

export async function getRecord(workspaceId, applicationId, moduleId, recordId) {
    const { data } = await api.get(`${moduleBase(workspaceId, applicationId, moduleId)}/records/${recordId}`);
    return data.data.record;
}

export async function createRecord(workspaceId, applicationId, moduleId, payload) {
    const { data } = await api.post(`${moduleBase(workspaceId, applicationId, moduleId)}/records`, payload);
    return data.data.record;
}

export async function updateRecord(workspaceId, applicationId, moduleId, recordId, payload) {
    const { data } = await api.put(`${moduleBase(workspaceId, applicationId, moduleId)}/records/${recordId}`, payload);
    return data.data.record;
}

export async function deleteRecord(workspaceId, applicationId, moduleId, recordId) {
    await api.delete(`${moduleBase(workspaceId, applicationId, moduleId)}/records/${recordId}`);
}

export async function getListView(workspaceId, applicationId, moduleId) {
    const { data } = await api.get(`${moduleBase(workspaceId, applicationId, moduleId)}/list-view`);
    return data.data.list_view;
}

export async function saveListView(workspaceId, applicationId, moduleId, payload) {
    const { data } = await api.put(`${moduleBase(workspaceId, applicationId, moduleId)}/list-view`, payload);
    return data.data.list_view;
}
