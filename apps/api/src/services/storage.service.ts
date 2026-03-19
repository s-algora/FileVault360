import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
} from '@azure/storage-blob';
import { QueueServiceClient, QueueClient } from '@azure/storage-queue';
import { ShareServiceClient, ShareClient, ShareDirectoryClient } from '@azure/storage-file-share';
import { loadConfig } from '@filevault360/config';

let blobContainerClient: ContainerClient;
let queueClient: QueueClient;
let shareClient: ShareClient;
let shareDirectoryClient: ShareDirectoryClient;
let blobServiceClient: BlobServiceClient;

export async function initializeStorage(): Promise<void> {
  const config = loadConfig();

  if (!config.storage.connectionString) {
    console.warn('Azure Storage not configured; skipping initialization.');
    return;
  }

  blobServiceClient = BlobServiceClient.fromConnectionString(config.storage.connectionString);
  blobContainerClient = blobServiceClient.getContainerClient(config.storage.blobContainerName);
  await blobContainerClient.createIfNotExists();

  const queueServiceClient = QueueServiceClient.fromConnectionString(config.storage.connectionString);
  queueClient = queueServiceClient.getQueueClient(config.storage.queueName);
  await queueClient.createIfNotExists();

  const shareServiceClient = ShareServiceClient.fromConnectionString(config.storage.connectionString);
  shareClient = shareServiceClient.getShareClient(config.storage.fileShareName);
  await shareClient.createIfNotExists();
  shareDirectoryClient = shareClient.getDirectoryClient('documents');
  await shareDirectoryClient.createIfNotExists();

  console.log('Azure Storage initialized successfully');
}

export async function uploadBlob(blobName: string, buffer: Buffer, contentType: string): Promise<string> {
  const blockBlobClient: BlockBlobClient = blobContainerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType },
  });
  return blockBlobClient.url;
}

export async function downloadBlob(blobName: string): Promise<Buffer> {
  const blockBlobClient = blobContainerClient.getBlockBlobClient(blobName);
  const downloadResponse = await blockBlobClient.download(0);
  const chunks: Buffer[] = [];
  for await (const chunk of downloadResponse.readableStreamBody as AsyncIterable<Buffer>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function deleteBlob(blobName: string): Promise<void> {
  const blockBlobClient = blobContainerClient.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
}

export async function generateSasUrl(blobName: string, expiresInMinutes = 60): Promise<string> {
  const config = loadConfig();
  const blockBlobClient = blobContainerClient.getBlockBlobClient(blobName);

  const connStr = config.storage.connectionString;
  const accountNameMatch = connStr.match(/AccountName=([^;]+)/);
  const accountKeyMatch = connStr.match(/AccountKey=([^;]+)/);

  if (!accountNameMatch || !accountKeyMatch) {
    return blockBlobClient.url;
  }

  const credential = new StorageSharedKeyCredential(accountNameMatch[1], accountKeyMatch[1]);
  const expiresOn = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  const sasQueryParams = generateBlobSASQueryParameters(
    {
      containerName: config.storage.blobContainerName,
      blobName,
      permissions: BlobSASPermissions.parse('r'),
      expiresOn,
    },
    credential
  );

  return `${blockBlobClient.url}?${sasQueryParams.toString()}`;
}

export async function enqueueMessage(message: object): Promise<void> {
  const encoded = Buffer.from(JSON.stringify(message)).toString('base64');
  await queueClient.sendMessage(encoded);
}

export async function uploadFileShare(fileName: string, buffer: Buffer, _contentType: string): Promise<string> {
  const fileClient = shareDirectoryClient.getFileClient(fileName);
  await fileClient.create(buffer.length);
  await fileClient.uploadData(buffer);
  return fileClient.url;
}

export async function listSharedFiles(): Promise<string[]> {
  const files: string[] = [];
  for await (const item of shareDirectoryClient.listFilesAndDirectories()) {
    if (item.kind === 'file') {
      files.push(item.name);
    }
  }
  return files;
}
