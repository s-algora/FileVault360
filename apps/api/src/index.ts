import 'dotenv/config';
import app from './app';
import { loadConfig } from '@filevault360/config';
import { initializeCosmos } from './services/cosmos.service';
import { initializeStorage } from './services/storage.service';

const config = loadConfig();

async function bootstrap() {
  try {
    await initializeCosmos();
    await initializeStorage();

    app.listen(config.port, () => {
      console.log(`FileVault360 API running on port ${config.port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
