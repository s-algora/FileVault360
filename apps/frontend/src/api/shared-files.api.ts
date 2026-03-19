import apiClient from './client';
import type { SharedFile, PaginatedResponse } from '@filevault360/shared-types';

export async function uploadSharedFileApi(formData: FormData): Promise<{ file: SharedFile; message: string }> {
  const response = await apiClient.post<{ file: SharedFile; message: string }>('/shared-files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function listSharedFilesApi(): Promise<PaginatedResponse<SharedFile>> {
  const response = await apiClient.get<PaginatedResponse<SharedFile>>('/shared-files');
  return response.data;
}
