import apiClient from './client';
import type { LoginRequest, LoginResponse } from '@filevault360/shared-types';

export async function loginApi(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', data);
  return response.data;
}

export async function logoutApi(): Promise<void> {
  await apiClient.post('/auth/logout');
}
