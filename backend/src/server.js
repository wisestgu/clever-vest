import { createApp } from './app.js';
import { createDb } from './db.js';

const port = Number(process.env.PORT || 4000);
const db = createDb(process.env.DB_FILE || new URL('../data/db.json', import.meta.url).pathname);
const { app } = createApp({ db });

const server = app.listen(port, () => {
  console.log(`Dollo API listening on http://localhost:${port}`);
});

const shutdown = () => {
  db.flush();
  server.close(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
