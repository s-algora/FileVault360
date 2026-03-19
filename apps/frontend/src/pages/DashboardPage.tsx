import { useQuery } from '@tanstack/react-query';
import { listFilesApi } from '../api/files.api';
import { listSharedFilesApi } from '../api/shared-files.api';
import { useAuthStore } from '../stores/auth.store';
import { formatFileSize } from '../utils/format';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const { data: filesData } = useQuery({
    queryKey: ['files'],
    queryFn: listFilesApi,
  });

  const { data: sharedFilesData } = useQuery({
    queryKey: ['shared-files'],
    queryFn: listSharedFilesApi,
  });

  const totalFiles = filesData?.total ?? 0;
  const totalSharedFiles = sharedFilesData?.total ?? 0;
  const totalSize = filesData?.data.reduce((acc, f) => acc + f.size, 0) ?? 0;

  const stats = [
    { label: 'My Files', value: totalFiles, icon: '📁', color: '#4f46e5' },
    { label: 'Shared Files', value: totalSharedFiles, icon: '🔗', color: '#06b6d4' },
    { label: 'Total Storage', value: formatFileSize(totalSize), icon: '💾', color: '#10b981' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a2e' }}>
          Welcome back, {user?.displayName || 'User'} 👋
        </h1>
        <p style={{ color: '#6b7280', marginTop: '4px' }}>
          Here's an overview of your file storage
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              borderLeft: `4px solid ${stat.color}`,
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
            <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {filesData && filesData.data.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Recent Files</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filesData.data.slice(0, 5).map((file) => (
              <div key={file.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>📄</span>
                  <div>
                    <div style={{ fontWeight: '500', color: '#1a1a2e' }}>{file.originalName}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{file.contentType} · {formatFileSize(file.size)}</div>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {new Date(file.uploadedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
