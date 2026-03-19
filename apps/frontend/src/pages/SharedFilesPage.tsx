import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { listSharedFilesApi, uploadSharedFileApi } from '../api/shared-files.api';
import { formatFileSize } from '../utils/format';

export default function SharedFilesPage() {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['shared-files'],
    queryFn: listSharedFilesApi,
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    for (const file of acceptedFiles) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        await uploadSharedFileApi(formData);
        toast.success(`${file.name} shared successfully`);
      } catch {
        toast.error(`Failed to share ${file.name}`);
      }
    }
    await queryClient.invalidateQueries({ queryKey: ['shared-files'] });
    setUploading(false);
  }, [queryClient]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a2e' }}>Shared Files</h1>
        <p style={{ color: '#6b7280', marginTop: '4px' }}>Upload and access shared documents via Azure File Share</p>
      </div>

      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? '#06b6d4' : '#d1d5db'}`,
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragActive ? '#ecfeff' : '#fafafa',
          marginBottom: '24px',
          transition: 'all 0.2s',
        }}
      >
        <input {...getInputProps()} />
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔗</div>
        {uploading ? (
          <p style={{ color: '#06b6d4', fontWeight: '500' }}>Uploading to shared storage...</p>
        ) : isDragActive ? (
          <p style={{ color: '#06b6d4', fontWeight: '500' }}>Drop files to share</p>
        ) : (
          <>
            <p style={{ color: '#374151', fontWeight: '500' }}>Drag & drop files to share, or click to select</p>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '4px' }}>Files will be accessible to all team members</p>
          </>
        )}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Loading shared files...</div>
      ) : !data?.data.length ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔗</div>
          <p style={{ fontWeight: '500' }}>No shared files yet</p>
          <p style={{ fontSize: '14px', marginTop: '4px' }}>Share your first file above</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Name', 'Type', 'Size', 'Shared On'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.map((file, idx) => (
                <tr key={file.id} style={{ borderBottom: idx < data.data.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🔗</span>
                      <span style={{ fontWeight: '500', color: '#1a1a2e' }}>{file.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>{file.contentType}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>{formatFileSize(file.size)}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>{new Date(file.uploadedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
