export function assertValidMigration(m) {
  if (!m || typeof m !== 'object') throw new Error('Migration must be an object');
  if (!m.id || typeof m.id !== 'string') throw new Error('Migration.id must be a string');
  if (!m.title || typeof m.title !== 'string') {
    throw new Error(`Migration ${m.id}: title must be a string`);
  }
  if (!m.description || typeof m.description !== 'string') {
    throw new Error(`Migration ${m.id}: description must be a string`);
  }
  if (typeof m.apply !== 'function') throw new Error(`Migration ${m.id}: apply must be a function`);
}

export function sortMigrations(migrations) {
  return [...migrations].sort((a, b) => a.id.localeCompare(b.id));
}
