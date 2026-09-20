import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthAndParentPerformanceIndexes1780000000015
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_admins_login_email_active"
        ON "admins" (LOWER(TRIM("email")))
        WHERE "is_active" = true AND "is_deleted" = false
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_admins_login_username_active"
        ON "admins" (LOWER(TRIM("username")))
        WHERE "is_active" = true AND "is_deleted" = false
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_parents_login_email_not_deleted"
        ON "parents" (LOWER(TRIM("email")))
        WHERE "isDeleted" = false
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_parents_login_username_not_deleted"
        ON "parents" (LOWER(TRIM("username")))
        WHERE "isDeleted" = false
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_parents_branch_deleted_created"
        ON "parents" ("branch_id", "isDeleted", "createdAt" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_parents_deleted_created"
        ON "parents" ("isDeleted", "createdAt" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_parents_deleted_created"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_parents_branch_deleted_created"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_parents_login_username_not_deleted"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_parents_login_email_not_deleted"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_admins_login_username_active"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_admins_login_email_active"');
  }
}
