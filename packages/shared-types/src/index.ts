export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileMetadata {
  id: string;
  userId: string;
  name: string;
  originalName: string;
  contentType: string;
  size: number;
  blobUrl: string;
  containerName: string;
  uploadedAt: string;
  updatedAt: string;
  tags?: string[];
  description?: string;
  isShared?: boolean;
}

export interface SharedFile {
  id: string;
  userId: string;
  name: string;
  shareName: string;
  filePath: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface UploadFileResponse {
  file: FileMetadata;
  message: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface QueueMessage {
  type: 'FILE_UPLOADED' | 'FILE_DELETED' | 'FILE_SHARED';
  payload: {
    fileId: string;
    userId: string;
    fileName: string;
    timestamp: string;
  };
}
