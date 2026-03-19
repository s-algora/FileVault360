import { Response } from 'express';
import { generateId, sanitizeFileName } from '@filevault360/shared-utils';
import { SharedFile } from '@filevault360/shared-types';
import { AuthRequest } from '../middleware/auth.middleware';
import { getSharedFilesContainer } from '../services/cosmos.service';
import { uploadFileShare, listSharedFiles as listShareFiles, enqueueMessage } from '../services/storage.service';
import { cacheGet, cacheSet, cacheDel } from '../services/redis.service';
import { loadConfig } from '@filevault360/config';

export async function uploadSharedFile(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'BadRequest', message: 'No file provided', statusCode: 400 });
      return;
    }

    const config = loadConfig();
    const userId = req.userId!;
    const originalName = req.file.originalname;
    const fileName = sanitizeFileName(originalName);

    const fileUrl = await uploadFileShare(fileName, req.file.buffer, req.file.mimetype);
    void fileUrl;

    const sharedFile: SharedFile = {
      id: generateId(),
      userId,
      name: fileName,
      shareName: config.storage.fileShareName,
      filePath: `documents/${fileName}`,
      contentType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const container = getSharedFilesContainer();
      await container.items.create(sharedFile);
    } catch (dbErr) {
      console.warn('Cosmos DB not available:', dbErr);
    }

    try {
      await enqueueMessage({
        type: 'FILE_SHARED',
        payload: {
          fileId: sharedFile.id,
          userId,
          fileName: originalName,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (queueErr) {
      console.warn('Queue not available:', queueErr);
    }

    await cacheDel('shared-files:all');

    res.status(201).json({ file: sharedFile, message: 'Shared file uploaded successfully' });
  } catch (err) {
    console.error('Upload shared file error:', err);
    res.status(500).json({ error: 'InternalServerError', message: 'Shared file upload failed', statusCode: 500 });
  }
}

export async function listSharedFiles(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const cacheKey = 'shared-files:all';
    const cached = await cacheGet<SharedFile[]>(cacheKey);
    if (cached) {
      res.json({ data: cached, total: cached.length, page: 1, limit: 100 });
      return;
    }

    let sharedFiles: SharedFile[] = [];

    try {
      const container = getSharedFilesContainer();
      const { resources } = await container.items
        .query<SharedFile>('SELECT * FROM c ORDER BY c.uploadedAt DESC')
        .fetchAll();
      sharedFiles = resources;
    } catch (dbErr) {
      console.warn('Cosmos DB not available:', dbErr);
      try {
        const fileNames = await listShareFiles();
        sharedFiles = fileNames.map((name) => ({
          id: generateId(),
          userId: 'system',
          name,
          shareName: 'shared-documents',
          filePath: `documents/${name}`,
          contentType: 'application/octet-stream',
          size: 0,
          uploadedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      } catch (shareErr) {
        console.warn('File Share not available:', shareErr);
      }
    }

    await cacheSet(cacheKey, sharedFiles, 120);
    res.json({ data: sharedFiles, total: sharedFiles.length, page: 1, limit: 100 });
  } catch (err) {
    console.error('List shared files error:', err);
    res.status(500).json({ error: 'InternalServerError', message: 'Failed to list shared files', statusCode: 500 });
  }
}
