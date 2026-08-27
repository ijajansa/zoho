import api from './client';

export async function getApplications(workspaceId, page = 1) {
    const { data } = await api.get(`/workspaces/${workspaceId}/applications`, { params: { page } });
    return data.data;
}

export async function getApplication(workspaceId, applicationId) {
    const { data } = await api.get(`/workspaces/${workspaceId}/applications/${applicationId}`);
    return data.data.application;
}

export async function createApplication(workspaceId, payload) {
    const { data } = await api.post(`/workspaces/${workspaceId}/applications`, payload);
    return data.data.application;
}

export async function updateApplication(workspaceId, applicationId, payload) {
    const { data } = await api.put(`/workspaces/${workspaceId}/applications/${applicationId}`, payload);
    return data.data.application;
}

export async function deleteApplication(workspaceId, applicationId) {
    const { data } = await api.delete(`/workspaces/${workspaceId}/applications/${applicationId}`);
    return data;
}
