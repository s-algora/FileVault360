import { CosmosClient, Container, Database } from '@azure/cosmos';
import { loadConfig } from '@filevault360/config';

let database: Database;
let filesContainer: Container;
let usersContainer: Container;
let sharedFilesContainer: Container;

export async function initializeCosmos(): Promise<void> {
  const config = loadConfig();

  if (!config.cosmos.endpoint || !config.cosmos.key) {
    console.warn('Cosmos DB not configured; skipping initialization.');
    return;
  }

  const client = new CosmosClient({
    endpoint: config.cosmos.endpoint,
    key: config.cosmos.key,
  });

  const { database: db } = await client.databases.createIfNotExists({
    id: config.cosmos.databaseId,
  });
  database = db;

  const [{ container: files }, { container: users }, { container: shared }] = await Promise.all([
    database.containers.createIfNotExists({ id: config.cosmos.filesContainerId, partitionKey: '/userId' }),
    database.containers.createIfNotExists({ id: config.cosmos.usersContainerId, partitionKey: '/id' }),
    database.containers.createIfNotExists({ id: config.cosmos.sharedFilesContainerId, partitionKey: '/userId' }),
  ]);

  filesContainer = files;
  usersContainer = users;
  sharedFilesContainer = shared;

  console.log('Cosmos DB initialized successfully');
}

export function getFilesContainer(): Container {
  return filesContainer;
}

export function getUsersContainer(): Container {
  return usersContainer;
}

export function getSharedFilesContainer(): Container {
  return sharedFilesContainer;
}
