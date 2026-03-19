// Local copy of formatFileSize to avoid importing @filevault360/shared-utils in the browser bundle,
// since that package includes Node.js-only utilities (e.g. getEnvVar using process.env).
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
