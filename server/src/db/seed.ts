import 'reflect-metadata';
import { AppDataSource, initialiseDatabase, closeDatabase } from './data-source';
import { Technology } from '../entities/Technology';
import { TECHNOLOGY_CATALOG } from '../services/offline/technologyCatalog';

/**
 * Seeds `technologies` from the catalogue, upserting by slug so re-running is
 * always safe. `--reset` drops every table first — useful in development when
 * the entity shapes have changed and `synchronize` alone won't reconcile it.
 */
async function main() {
  const reset = process.argv.includes('--reset');

  await initialiseDatabase();

  if (reset) {
    console.log('Dropping and recreating the schema…');
    await AppDataSource.dropDatabase();
    await AppDataSource.synchronize();
  }

  const repo = AppDataSource.getRepository(Technology);
  let created = 0;
  let updated = 0;

  for (const entry of TECHNOLOGY_CATALOG) {
    const existing = await repo.findOne({ where: { slug: entry.slug } });
    if (existing) {
      Object.assign(existing, entry);
      await repo.save(existing);
      updated += 1;
    } else {
      await repo.save(repo.create(entry));
      created += 1;
    }
  }

  console.log(`Seed complete — ${created} created, ${updated} updated, ${TECHNOLOGY_CATALOG.length} total.`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase();
  });
