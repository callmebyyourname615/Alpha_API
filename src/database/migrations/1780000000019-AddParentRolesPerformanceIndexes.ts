import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParentRolesPerformanceIndexes1780000000019
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_parent_roles_parent_role"
        ON "parent_roles" ("parent_id", "role_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_parent_roles_role_parent"
        ON "parent_roles" ("role_id", "parent_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_parent_roles_role_parent"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_parent_roles_parent_role"');
  }
}
