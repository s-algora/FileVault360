import { Router } from 'express';
import {
  uploadFile,
  listFiles,
  getFile,
  updateFile,
  deleteFile,
  downloadFile,
} from '../controllers/files.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

router.post('/upload', upload.single('file'), uploadFile);
router.get('/', listFiles);
router.get('/:id', getFile);
router.put('/:id', updateFile);
router.delete('/:id', deleteFile);
router.get('/:id/download', downloadFile);

export default router;
