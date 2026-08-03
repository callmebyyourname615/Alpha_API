import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * One-time baseline for an empty database. Future changes must use generated,
 * static migrations (`npm run migration:generate`).
 */
export class BaselineSchema1780000000000 implements MigrationInterface {
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables = await queryRunner.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename <> 'typeorm_migrations'
    `);

    if (tables.length > 0) {
      throw new Error(
        'BaselineSchema can only run against an empty database. Do not run it against an existing database.',
      );
    }

    await queryRunner.connection.synchronize(false);
  }

  public async down(): Promise<void> {
    // Baseline rollback intentionally does not drop user data.
  }
}
