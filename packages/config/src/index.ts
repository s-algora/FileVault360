import * as dotenv from 'dotenv';
dotenv.config();

export interface AppConfig {
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  cosmos: {
    endpoint: string;
    key: string;
    databaseId: string;
    filesContainerId: string;
    usersContainerId: string;
    sharedFilesContainerId: string;
  };
  storage: {
    connectionString: string;
    blobContainerName: string;
    queueName: string;
    fileShareName: string;
  };
  redis: {
    host: string;
    port: number;
    password: string;
    tls: boolean;
  };
  keyVault: {
    vaultUrl: string;
  };
}

export function loadConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT || '3001', 10),
    jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    cosmos: {
      endpoint: process.env.COSMOS_ENDPOINT || '',
      key: process.env.COSMOS_KEY || '',
      databaseId: process.env.COSMOS_DATABASE_ID || 'filevault360',
      filesContainerId: process.env.COSMOS_FILES_CONTAINER || 'files',
      usersContainerId: process.env.COSMOS_USERS_CONTAINER || 'users',
      sharedFilesContainerId: process.env.COSMOS_SHARED_FILES_CONTAINER || 'shared-files',
    },
    storage: {
      connectionString: process.env.STORAGE_CONNECTION_STRING || '',
      blobContainerName: process.env.BLOB_CONTAINER_NAME || 'filevault360-files',
      queueName: process.env.QUEUE_NAME || 'file-processing',
      fileShareName: process.env.FILE_SHARE_NAME || 'shared-documents',
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || '',
      tls: process.env.REDIS_TLS === 'true',
    },
    keyVault: {
      vaultUrl: process.env.KEY_VAULT_URL || '',
    },
  };
}

export async function getKeyVaultSecret(secretName: string): Promise<string> {
  const { DefaultAzureCredential } = await import('@azure/identity');
  const { SecretClient } = await import('@azure/keyvault-secrets');
  const config = loadConfig();
  if (!config.keyVault.vaultUrl) {
    throw new Error('KEY_VAULT_URL is not configured');
  }
  const credential = new DefaultAzureCredential();
  const client = new SecretClient(config.keyVault.vaultUrl, credential);
  const secret = await client.getSecret(secretName);
  return secret.value || '';
}
