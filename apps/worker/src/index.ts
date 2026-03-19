import 'dotenv/config';
import { QueueServiceClient, QueueReceiveMessageResponse } from '@azure/storage-queue';
import { loadConfig } from '@filevault360/config';
import { QueueMessage } from '@filevault360/shared-types';
import { sleep } from '@filevault360/shared-utils';

const config = loadConfig();
const POLLING_INTERVAL_MS = 5000;

async function processMessage(message: QueueMessage): Promise<void> {
  console.log(`Processing message: ${message.type}`, message.payload);

  switch (message.type) {
    case 'FILE_UPLOADED':
      await handleFileUploaded(message.payload);
      break;
    case 'FILE_DELETED':
      await handleFileDeleted(message.payload);
      break;
    case 'FILE_SHARED':
      await handleFileShared(message.payload);
      break;
    default:
      console.warn('Unknown message type:', (message as QueueMessage).type);
  }
}

async function handleFileUploaded(payload: QueueMessage['payload']): Promise<void> {
  console.log(`[FILE_UPLOADED] Processing file: ${payload.fileName} (ID: ${payload.fileId}) by user: ${payload.userId}`);
  // Extensible: add virus scanning, thumbnail generation, metadata extraction, notifications
  await sleep(100);
  console.log(`[FILE_UPLOADED] Completed processing for: ${payload.fileId}`);
}

async function handleFileDeleted(payload: QueueMessage['payload']): Promise<void> {
  console.log(`[FILE_DELETED] Cleaning up file: ${payload.fileName} (ID: ${payload.fileId})`);
  await sleep(50);
  console.log(`[FILE_DELETED] Cleanup completed for: ${payload.fileId}`);
}

async function handleFileShared(payload: QueueMessage['payload']): Promise<void> {
  console.log(`[FILE_SHARED] Processing shared file: ${payload.fileName} (ID: ${payload.fileId})`);
  await sleep(50);
  console.log(`[FILE_SHARED] Completed processing for: ${payload.fileId}`);
}

async function startWorker(): Promise<void> {
  if (!config.storage.connectionString) {
    console.warn('Azure Storage not configured. Worker running in no-op mode.');
    while (true) {
      console.log('[Worker] Waiting for storage configuration...');
      await sleep(30000);
    }
  }

  const queueServiceClient = QueueServiceClient.fromConnectionString(config.storage.connectionString);
  const queueClient = queueServiceClient.getQueueClient(config.storage.queueName);
  await queueClient.createIfNotExists();

  console.log(`FileVault360 Worker started. Polling queue: ${config.storage.queueName}`);

  while (true) {
    try {
      const response: QueueReceiveMessageResponse = await queueClient.receiveMessages({
        numberOfMessages: 5,
        visibilityTimeout: 30,
      });

      for (const message of response.receivedMessageItems) {
        try {
          const decoded = Buffer.from(message.messageText, 'base64').toString('utf-8');
          const parsed: QueueMessage = JSON.parse(decoded);
          await processMessage(parsed);
          await queueClient.deleteMessage(message.messageId, message.popReceipt);
        } catch (err) {
          console.error('Error processing message:', err);
        }
      }
    } catch (err) {
      console.error('Error polling queue:', err);
    }

    await sleep(POLLING_INTERVAL_MS);
  }
}

startWorker().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
