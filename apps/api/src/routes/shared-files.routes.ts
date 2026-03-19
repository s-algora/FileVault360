import { Router } from 'express';
import { uploadSharedFile, listSharedFiles } from '../controllers/shared-files.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

router.post('/upload', upload.single('file'), uploadSharedFile);
router.get('/', listSharedFiles);

export default router;
