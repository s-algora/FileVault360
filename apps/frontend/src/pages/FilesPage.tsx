import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { listFilesApi, uploadFileApi, deleteFileApi, downloadFileApi } from '../api/files.api';
import { formatFileSize } from '../utils/format';
import type { FileMetadata } from '@filevault360/shared-types';

export default function FilesPage() {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['files'],
    queryFn: listFilesApi,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFileApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('File deleted');
    },
    onError: () => toast.error('Failed to delete file'),
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    for (const file of acceptedFiles) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        await uploadFileApi(formData);
        toast.success(`${file.name} uploaded successfully`);
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    await queryClient.invalidateQueries({ queryKey: ['files'] });
    setUploading(false);
  }, [queryClient]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  async function handleDownload(file: FileMetadata) {
    try {
      const { downloadUrl } = await downloadFileApi(file.id);
      window.open(downloadUrl, '_blank');
    } catch {
      toast.error('Failed to generate download link');
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a2e' }}>My Files</h1>
        <p style={{ color: '#6b7280', marginTop: '4px' }}>Upload, manage, and download your files</p>
      </div>

      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? '#4f46e5' : '#d1d5db'}`,
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragActive ? '#eef2ff' : '#fafafa',
          marginBottom: '24px',
          transition: 'all 0.2s',
        }}
      >
        <input {...getInputProps()} />
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>☁️</div>
        {uploading ? (
          <p style={{ color: '#4f46e5', fontWeight: '500' }}>Uploading...</p>
        ) : isDragActive ? (
          <p style={{ color: '#4f46e5', fontWeight: '500' }}>Drop files here</p>
        ) : (
          <>
            <p style={{ color: '#374151', fontWeight: '500' }}>Drag & drop files here, or click to select</p>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '4px' }}>PDF, Images, Documents up to 50MB</p>
          </>
        )}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading files...</div>
      ) : !data?.data.length ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📂</div>
          <p style={{ fontWeight: '500' }}>No files yet</p>
          <p style={{ fontSize: '14px', marginTop: '4px' }}>Upload your first file above</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Name', 'Type', 'Size', 'Uploaded', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.map((file, idx) => (
                <tr key={file.id} style={{ borderBottom: idx < data.data.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📄</span>
                      <span style={{ fontWeight: '500', color: '#1a1a2e' }}>{file.originalName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>{file.contentType}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>{formatFileSize(file.size)}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>{new Date(file.uploadedAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleDownload(file)}
                        style={{ padding: '6px 12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500' }}
                      >
                        Download
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(file.id)}
                        style={{ padding: '6px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
