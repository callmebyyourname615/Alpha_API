import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParentBranchColumn1780000000013
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "parents"
        ADD COLUMN IF NOT EXISTS "branch_id" uuid NULL
    `);

    await queryRunner.query(`
      UPDATE "parents" p
      SET "branch_id" = linked."branch_id"
      FROM (
        SELECT DISTINCT ON (sp."parent_id")
          sp."parent_id",
          s."branch_id"
        FROM "student_parents" sp
        JOIN "students" s ON s."id" = sp."student_id"
        WHERE s."branch_id" IS NOT NULL
        ORDER BY sp."parent_id", s."created_at" DESC
      ) linked
      WHERE p."id" = linked."parent_id"
        AND p."branch_id" IS NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_parents_branch_id'
        ) THEN
          ALTER TABLE "parents"
            ADD CONSTRAINT "FK_parents_branch_id"
            FOREIGN KEY ("branch_id") REFERENCES "branches"("id")
            ON DELETE RESTRICT;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_parents_branch_id"
        ON "parents" ("branch_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_parents_branch_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "parents"
        DROP CONSTRAINT IF EXISTS "FK_parents_branch_id",
        DROP COLUMN IF EXISTS "branch_id"
    `);
  }
}
