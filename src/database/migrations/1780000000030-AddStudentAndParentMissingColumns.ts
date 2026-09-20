import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStudentAndParentMissingColumns1780000000030
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "students"
        ADD COLUMN IF NOT EXISTS "approval_status" varchar(16) NOT NULL DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS "rejected_at" timestamptz NULL,
        ADD COLUMN IF NOT EXISTS "reject_reason" text NULL,
        ADD COLUMN IF NOT EXISTS "health_review_required" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "health_review_reasons" jsonb NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "physical_disability" jsonb NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "health_history" jsonb NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "protective_info" jsonb NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "live_with" jsonb NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "emergency_contacts" jsonb NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "bos_info" jsonb NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "sibling_info" jsonb NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "his_school_nursery" jsonb NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "his_school_kindergarten" jsonb NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "his_school_primary" jsonb NULL DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "saving_wallet" numeric(18, 2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "is_deleted" boolean NOT NULL DEFAULT false;

      ALTER TABLE "parents"
        ADD COLUMN IF NOT EXISTS "approval_status" varchar(16) NOT NULL DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS "rejected_at" timestamptz NULL,
        ADD COLUMN IF NOT EXISTS "reject_reason" text NULL,
        ADD COLUMN IF NOT EXISTS "branch_id" uuid NULL,
        ADD COLUMN IF NOT EXISTS "home_number" varchar(20) NULL,
        ADD COLUMN IF NOT EXISTS "home_unit" varchar(20) NULL,
        ADD COLUMN IF NOT EXISTS "home_address" text NULL,
        ADD COLUMN IF NOT EXISTS "home_picture_url" varchar(512) NULL,
        ADD COLUMN IF NOT EXISTS "work_province" varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS "work_district" varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS "work_village" varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS "occupation" varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS "company_name" varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS "profilePictureUrl" varchar(512) NULL,
        ADD COLUMN IF NOT EXISTS "idCardUrl" varchar(512) NULL,
        ADD COLUMN IF NOT EXISTS "isDeleted" boolean NOT NULL DEFAULT false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "students"
        DROP COLUMN IF EXISTS "health_review_reasons",
        DROP COLUMN IF EXISTS "health_review_required";
    `);
  }
}
