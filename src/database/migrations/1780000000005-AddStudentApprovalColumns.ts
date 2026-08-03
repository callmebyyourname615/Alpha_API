import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStudentApprovalColumns1780000000005
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "students"
        ADD COLUMN IF NOT EXISTS "approval_status" varchar(16) NOT NULL DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS "rejected_at" timestamptz NULL,
        ADD COLUMN IF NOT EXISTS "reject_reason" text NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "students"
        DROP COLUMN IF EXISTS "reject_reason",
        DROP COLUMN IF EXISTS "rejected_at",
        DROP COLUMN IF EXISTS "approval_status"
    `);
  }
}
