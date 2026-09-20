import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdminHomeAddressColumns1780000000029
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "admins"
        ADD COLUMN IF NOT EXISTS "home_no" varchar(100) NULL,
        ADD COLUMN IF NOT EXISTS "unit" varchar(100) NULL,
        ADD COLUMN IF NOT EXISTS "sub_district" varchar(100) NULL,
        ADD COLUMN IF NOT EXISTS "birth_sub_district" varchar(100) NULL,
        ADD COLUMN IF NOT EXISTS "middle_name_La" varchar(100) NULL,
        ADD COLUMN IF NOT EXISTS "nick_name" varchar(100) NULL,
        ADD COLUMN IF NOT EXISTS "home_address" text NULL,
        ADD COLUMN IF NOT EXISTS "home_picture_url" varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS "current_academic_year" varchar(20) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "admins"
        DROP COLUMN IF EXISTS "current_academic_year",
        DROP COLUMN IF EXISTS "home_picture_url",
        DROP COLUMN IF EXISTS "home_address",
        DROP COLUMN IF EXISTS "nick_name",
        DROP COLUMN IF EXISTS "middle_name_La",
        DROP COLUMN IF EXISTS "birth_sub_district",
        DROP COLUMN IF EXISTS "sub_district",
        DROP COLUMN IF EXISTS "unit",
        DROP COLUMN IF EXISTS "home_no";
    `);
  }
}
