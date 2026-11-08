import fs from 'node:fs';
import path from 'node:path';

const empty = () => ({ users: {}, sessions: {}, deposits: [], withdrawals: [], orders: [], activity: [] });

/**
 * Tiny JSON-file store. Good enough for a sandbox demo: the whole state lives in memory and is
 * flushed to disk (atomically) shortly after each mutation. Use DB_FILE=":memory:" to skip disk.
 */
export function createDb(file = process.env.DB_FILE || 'data/db.json') {
  const memory = file === ':memory:';
  const resolved = memory ? null : path.resolve(file);
  let state = empty();

  if (!memory && fs.existsSync(resolved)) {
    try {
      state = { ...empty(), ...JSON.parse(fs.readFileSync(resolved, 'utf8')) };
    } catch (err) {
      console.warn(`[db] Could not read ${resolved}, starting fresh: ${err.message}`);
    }
  }

  let timer = null;
  const flush = () => {
    timer = null;
    if (memory) return;
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    const tmp = `${resolved}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
    fs.renameSync(tmp, resolved);
  };

  return {
    get state() {
      return state;
    },
    save() {
      if (memory || timer) return;
      timer = setTimeout(flush, 50);
    },
    flush() {
      if (timer) clearTimeout(timer);
      flush();
    },
    reset() {
      state = empty();
    },
  };
}
