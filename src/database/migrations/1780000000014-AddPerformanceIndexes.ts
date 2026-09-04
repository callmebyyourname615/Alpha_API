import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1780000000014
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_students_branch_deleted"
        ON "students" ("branch_id", "is_deleted")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_students_active_deleted"
        ON "students" ("is_active", "is_deleted")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_students_approval_status"
        ON "students" ("approval_status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_students_student_id"
        ON "students" ("student_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_students_dob_deleted"
        ON "students" ("dob", "is_deleted")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_students_name_sort"
        ON "students" (
          "first_name_lao",
          "last_name_lao",
          "first_name_eng",
          "last_name_eng"
        )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_student_parents_parent_student"
        ON "student_parents" ("parent_id", "student_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_student_parents_student_parent"
        ON "student_parents" ("student_id", "parent_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_enrollments_class_year_active"
        ON "enrollments" ("class_id", "academic_year_id", "is_active")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_enrollments_student_year"
        ON "enrollments" ("student_id", "academic_year_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_enrollments_student_active"
        ON "enrollments" ("student_id", "is_active")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_enrollments_branch_year_active"
        ON "enrollments" ("branch_id", "academic_year_id", "is_active")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_classes_year_level"
        ON "classes" ("year_level_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_year_levels_level"
        ON "year_levels" ("level_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_attendances_student_date"
        ON "attendances" ("student_id", "attendance_date")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_attendances_date"
        ON "attendances" ("attendance_date")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_attendances_type_date"
        ON "attendances" ("type", "attendance_date")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'attendance_rules'
            AND column_name = 'levelId'
        ) THEN
          EXECUTE 'CREATE INDEX IF NOT EXISTS "idx_attendance_rules_level_day" ON "attendance_rules" ("levelId", "dayOfWeek")';
        ELSIF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'attendance_rules'
            AND column_name = 'level_id'
        ) THEN
          EXECUTE 'CREATE INDEX IF NOT EXISTS "idx_attendance_rules_level_day" ON "attendance_rules" ("level_id", "dayOfWeek")';
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tasks_status_deadline"
        ON "tasks" ("status", "deadline")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tasks_class_status"
        ON "tasks" ("class_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tasks_academic_year_status"
        ON "tasks" ("academic_year_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_tasks_created_at"
        ON "tasks" ("created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_files_task_deleted"
        ON "files" ("task_id", "is_deleted")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_files_gallery_deleted"
        ON "files" ("gallery_id", "is_deleted")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_gallery_posts_feed_order"
        ON "gallery_posts" (
          "status",
          "is_pinned" DESC,
          "published_at" DESC,
          "created_at" DESC
        )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_gallery_posts_visibility_status"
        ON "gallery_posts" ("visibility", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_gallery_tags_student_gallery"
        ON "gallery_student_tags" ("student_id", "gallery_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_student_fees_assignment_student"
        ON "student_fees" ("fee_assignment_id", "student_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_student_fees_student"
        ON "student_fees" ("student_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_payment_records_student_fee_due"
        ON "payment_records" ("student_fee_id", "due_date")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_payment_records_status_due"
        ON "payment_records" ("status", "due_date")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_payment_records_status_due"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_payment_records_student_fee_due"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_student_fees_student"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_student_fees_assignment_student"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_gallery_tags_student_gallery"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_gallery_posts_visibility_status"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_gallery_posts_feed_order"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_files_gallery_deleted"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_files_task_deleted"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_tasks_created_at"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_tasks_academic_year_status"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_tasks_class_status"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_tasks_status_deadline"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_attendances_type_date"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_attendance_rules_level_day"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_attendances_date"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_attendances_student_date"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_enrollments_branch_year_active"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_year_levels_level"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_classes_year_level"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_enrollments_student_active"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_enrollments_student_year"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_enrollments_class_year_active"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_students_student_id"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_student_parents_student_parent"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_student_parents_parent_student"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_students_name_sort"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_students_dob_deleted"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_students_approval_status"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_students_active_deleted"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_students_branch_deleted"');
  }
}
