import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminAddressColumns1780000000029
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "admins"
        ADD COLUMN IF NOT EXISTS "home_no" character varying(100),
        ADD COLUMN IF NOT EXISTS "unit" character varying(100),
        ADD COLUMN IF NOT EXISTS "village" character varying(100),
        ADD COLUMN IF NOT EXISTS "sub_district" character varying(100),
        ADD COLUMN IF NOT EXISTS "district" character varying(100),
        ADD COLUMN IF NOT EXISTS "province" character varying(100),
        ADD COLUMN IF NOT EXISTS "birth_village" character varying(100),
        ADD COLUMN IF NOT EXISTS "birth_sub_district" character varying(100),
        ADD COLUMN IF NOT EXISTS "birth_district" character varying(100),
        ADD COLUMN IF NOT EXISTS "birth_province" character varying(100),
        ADD COLUMN IF NOT EXISTS "home_address" text,
        ADD COLUMN IF NOT EXISTS "home_picture_url" character varying(255),
        ADD COLUMN IF NOT EXISTS "current_academic_year" character varying(20)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "admins"
        DROP COLUMN IF EXISTS "current_academic_year",
        DROP COLUMN IF EXISTS "home_picture_url",
        DROP COLUMN IF EXISTS "home_address",
        DROP COLUMN IF EXISTS "birth_province",
        DROP COLUMN IF EXISTS "birth_district",
        DROP COLUMN IF EXISTS "birth_sub_district",
        DROP COLUMN IF EXISTS "birth_village",
        DROP COLUMN IF EXISTS "province",
        DROP COLUMN IF EXISTS "district",
        DROP COLUMN IF EXISTS "sub_district",
        DROP COLUMN IF EXISTS "village",
        DROP COLUMN IF EXISTS "unit",
        DROP COLUMN IF EXISTS "home_no"
    `);
  }
}
