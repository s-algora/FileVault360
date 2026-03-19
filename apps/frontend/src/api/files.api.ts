import apiClient from './client';
import type { FileMetadata, PaginatedResponse, UploadFileResponse } from '@filevault360/shared-types';

export async function uploadFileApi(formData: FormData): Promise<UploadFileResponse> {
  const response = await apiClient.post<UploadFileResponse>('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function listFilesApi(): Promise<PaginatedResponse<FileMetadata>> {
  const response = await apiClient.get<PaginatedResponse<FileMetadata>>('/files');
  return response.data;
}

export async function getFileApi(id: string): Promise<FileMetadata> {
  const response = await apiClient.get<FileMetadata>(`/files/${id}`);
  return response.data;
}

export async function updateFileApi(id: string, data: Partial<Pick<FileMetadata, 'name' | 'description' | 'tags'>>): Promise<FileMetadata> {
  const response = await apiClient.put<FileMetadata>(`/files/${id}`, data);
  return response.data;
}

export async function deleteFileApi(id: string): Promise<void> {
  await apiClient.delete(`/files/${id}`);
}

export async function downloadFileApi(id: string): Promise<{ downloadUrl: string; expiresIn: number }> {
  const response = await apiClient.get<{ downloadUrl: string; expiresIn: number }>(`/files/${id}/download`);
  return response.data;
}
