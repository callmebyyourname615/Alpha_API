import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHomeroomTeacherToClasses1780000000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "classes"
      ADD COLUMN IF NOT EXISTS "homeroom_teacher_id" uuid
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_classes_homeroom_teacher'
        ) THEN
          ALTER TABLE "classes"
          ADD CONSTRAINT "FK_classes_homeroom_teacher"
          FOREIGN KEY ("homeroom_teacher_id")
          REFERENCES "admins"("id")
          ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "classes"
      DROP CONSTRAINT IF EXISTS "FK_classes_homeroom_teacher"
    `);
    await queryRunner.query(`
      ALTER TABLE "classes"
      DROP COLUMN IF EXISTS "homeroom_teacher_id"
    `);
  }
}
