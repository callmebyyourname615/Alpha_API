import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Aligns legacy PostgreSQL columns with the active entities without dropping
 * user data. Run this migration before enabling TYPEORM_SYNCHRONIZE in a
 * disposable development database.
 */
export class SafeSchemaAlignment1780000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tasks"
      ALTER COLUMN "description" TYPE text USING "description"::text
    `);

    await queryRunner.query(`
      UPDATE "tasks"
      SET "status" = 'in_progress'
      WHERE "status" = 'In-Process'
    `);

    await queryRunner.query(`
      ALTER TABLE "tasks"
      ALTER COLUMN "status" TYPE character varying(32) USING "status"::character varying(32)
    `);
    await queryRunner.query(`ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'draft'`);

    // Existing values were written as Asia/Vientiane local timestamps. Convert
    // them to their corresponding absolute instants instead of resetting them
    // to now(), which is what synchronize would otherwise do via DROP/ADD.
    await queryRunner.query(`
      ALTER TABLE "comments"
      ALTER COLUMN "created_at" TYPE TIMESTAMP WITH TIME ZONE
      USING "created_at" AT TIME ZONE 'Asia/Vientiane'
    `);
    await queryRunner.query(`
      ALTER TABLE "comments"
      ALTER COLUMN "updated_at" TYPE TIMESTAMP WITH TIME ZONE
      USING "updated_at" AT TIME ZONE 'Asia/Vientiane'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "comments"
      ALTER COLUMN "created_at" TYPE TIMESTAMP WITHOUT TIME ZONE
      USING "created_at" AT TIME ZONE 'Asia/Vientiane'
    `);
    await queryRunner.query(`
      ALTER TABLE "comments"
      ALTER COLUMN "updated_at" TYPE TIMESTAMP WITHOUT TIME ZONE
      USING "updated_at" AT TIME ZONE 'Asia/Vientiane'
    `);
    await queryRunner.query(`ALTER TABLE "tasks" ALTER COLUMN "status" DROP DEFAULT`);
    await queryRunner.query(`
      ALTER TABLE "tasks"
      ALTER COLUMN "status" TYPE character varying USING "status"::character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "tasks"
      ALTER COLUMN "description" TYPE character varying USING "description"::character varying
    `);
  }
}
