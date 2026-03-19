import { Response } from 'express';
import { loadConfig } from '@filevault360/config';
import { generateId, generateBlobName, sanitizeFileName } from '@filevault360/shared-utils';
import { FileMetadata } from '@filevault360/shared-types';
import { AuthRequest } from '../middleware/auth.middleware';
import { getFilesContainer } from '../services/cosmos.service';
import { uploadBlob, deleteBlob, generateSasUrl, enqueueMessage } from '../services/storage.service';
import { cacheGet, cacheSet, cacheDel } from '../services/redis.service';

export async function uploadFile(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'BadRequest', message: 'No file provided', statusCode: 400 });
      return;
    }

    const config = loadConfig();
    const userId = req.userId!;
    const originalName = req.file.originalname;
    const blobName = generateBlobName(userId, originalName);

    const blobUrl = await uploadBlob(blobName, req.file.buffer, req.file.mimetype);

    const fileMetadata: FileMetadata = {
      id: generateId(),
      userId,
      name: sanitizeFileName(originalName),
      originalName,
      contentType: req.file.mimetype,
      size: req.file.size,
      blobUrl,
      containerName: config.storage.blobContainerName,
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: req.body.tags ? req.body.tags.split(',') : [],
      description: req.body.description || '',
      isShared: false,
    };

    try {
      const container = getFilesContainer();
      await container.items.create({ ...fileMetadata, _blobName: blobName });
    } catch (dbErr) {
      console.warn('Cosmos DB not available, skipping metadata storage:', dbErr);
    }

    try {
      await enqueueMessage({
        type: 'FILE_UPLOADED',
        payload: {
          fileId: fileMetadata.id,
          userId,
          fileName: originalName,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (queueErr) {
      console.warn('Queue not available:', queueErr);
    }

    await cacheDel(`files:${userId}`);

    res.status(201).json({
      file: fileMetadata,
      message: 'File uploaded successfully',
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'InternalServerError', message: 'File upload failed', statusCode: 500 });
  }
}

export async function listFiles(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const cacheKey = `files:${userId}`;

    const cached = await cacheGet<FileMetadata[]>(cacheKey);
    if (cached) {
      res.json({ data: cached, total: cached.length, page: 1, limit: 100 });
      return;
    }

    let files: FileMetadata[] = [];

    try {
      const container = getFilesContainer();
      const querySpec = {
        query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.uploadedAt DESC',
        parameters: [{ name: '@userId', value: userId }],
      };
      const { resources } = await container.items.query<FileMetadata>(querySpec).fetchAll();
      files = resources;
    } catch (dbErr) {
      console.warn('Cosmos DB not available:', dbErr);
    }

    await cacheSet(cacheKey, files, 60);

    res.json({ data: files, total: files.length, page: 1, limit: 100 });
  } catch (err) {
    console.error('List files error:', err);
    res.status(500).json({ error: 'InternalServerError', message: 'Failed to list files', statusCode: 500 });
  }
}

export async function getFile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const cacheKey = `file:${id}`;

    const cached = await cacheGet<FileMetadata>(cacheKey);
    if (cached && cached.userId === userId) {
      res.json(cached);
      return;
    }

    let file: FileMetadata | null = null;

    try {
      const container = getFilesContainer();
      const { resource } = await container.item(id, userId).read<FileMetadata>();
      file = resource || null;
    } catch (dbErr) {
      console.warn('Cosmos DB not available:', dbErr);
    }

    if (!file) {
      res.status(404).json({ error: 'NotFound', message: 'File not found', statusCode: 404 });
      return;
    }

    await cacheSet(cacheKey, file, 300);
    res.json(file);
  } catch (err) {
    console.error('Get file error:', err);
    res.status(500).json({ error: 'InternalServerError', message: 'Failed to get file', statusCode: 500 });
  }
}

export async function updateFile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { name, description, tags } = req.body;

    let updated: FileMetadata | null = null;

    try {
      const container = getFilesContainer();
      const { resource: existing } = await container.item(id, userId).read<FileMetadata & { _blobName: string }>();

      if (!existing) {
        res.status(404).json({ error: 'NotFound', message: 'File not found', statusCode: 404 });
        return;
      }

      const updatedDoc = {
        ...existing,
        name: name || existing.name,
        description: description ?? existing.description,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : existing.tags,
        updatedAt: new Date().toISOString(),
      };

      const { resource } = await container.item(id, userId).replace(updatedDoc);
      updated = resource || null;
    } catch (dbErr) {
      console.warn('Cosmos DB not available:', dbErr);
      res.status(503).json({ error: 'ServiceUnavailable', message: 'Database unavailable; update could not be persisted', statusCode: 503 });
      return;
    }

    await cacheDel(`file:${id}`);
    await cacheDel(`files:${userId}`);

    res.json(updated);
  } catch (err) {
    console.error('Update file error:', err);
    res.status(500).json({ error: 'InternalServerError', message: 'Failed to update file', statusCode: 500 });
  }
}

export async function deleteFile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    try {
      const container = getFilesContainer();
      const { resource: existing } = await container.item(id, userId).read<FileMetadata & { _blobName: string }>();

      if (existing) {
        const blobName = existing._blobName || existing.blobUrl;
        await deleteBlob(blobName);
        await container.item(id, userId).delete();

        await enqueueMessage({
          type: 'FILE_DELETED',
          payload: {
            fileId: id,
            userId,
            fileName: existing.originalName,
            timestamp: new Date().toISOString(),
          },
        });
      }
    } catch (dbErr) {
      console.warn('Cosmos DB not available:', dbErr);
    }

    await cacheDel(`file:${id}`);
    await cacheDel(`files:${userId}`);

    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Delete file error:', err);
    res.status(500).json({ error: 'InternalServerError', message: 'Failed to delete file', statusCode: 500 });
  }
}

export async function downloadFile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    let file: (FileMetadata & { _blobName?: string }) | null = null;

    try {
      const container = getFilesContainer();
      const { resource } = await container.item(id, userId).read<FileMetadata & { _blobName: string }>();
      file = resource || null;
    } catch (dbErr) {
      console.warn('Cosmos DB not available:', dbErr);
    }

    if (!file) {
      res.status(404).json({ error: 'NotFound', message: 'File not found', statusCode: 404 });
      return;
    }

    const blobName = file._blobName || '';
    const sasUrl = await generateSasUrl(blobName, 5);

    res.json({ downloadUrl: sasUrl, expiresIn: 300 });
  } catch (err) {
    console.error('Download file error:', err);
    res.status(500).json({ error: 'InternalServerError', message: 'Failed to generate download URL', statusCode: 500 });
  }
}
