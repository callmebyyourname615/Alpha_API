import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTeachingTimetableLessonIndexes1780000000022
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_teaching_branch_year_created"
        ON "teaching" ("branch_id", "academic_year_id", "createdAt" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_teaching_admin_branch_year_created"
        ON "teaching" ("admin_id", "branch_id", "academic_year_id", "createdAt" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_teaching_subject"
        ON "teaching" ("subject_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_timetables_class_day_time"
        ON "timetables" ("class_id", "is_deleted", "day_of_week", "start_time")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_timetables_teacher_day_time"
        ON "timetables" ("teacher_id", "is_deleted", "day_of_week", "start_time")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_timetables_branch_day_time"
        ON "timetables" ("branch_id", "is_deleted", "day_of_week", "start_time")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_lessons_subject_type_year_created"
        ON "lessons" ("subject_type_id", "year_level_id", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_lessons_year_updated"
        ON "lessons" ("year_level_id", "updated_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_subject_lessons_subject_lesson"
        ON "subject_lessons" ("subject_id", "lesson_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_subject_lessons_lesson_subject"
        ON "subject_lessons" ("lesson_id", "subject_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_lesson_curriculums_curriculum_lesson"
        ON "lesson_curriculums" ("curriculum_id", "lesson_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_teach_learning_subject_updated"
        ON "teach_learning" ("subject_id", "updated_at" DESC, "end_date" DESC, "start_date" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_teach_learning_date_range"
        ON "teach_learning" ("start_date", "end_date")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_teach_learning_date_range"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_teach_learning_subject_updated"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_lesson_curriculums_curriculum_lesson"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_subject_lessons_lesson_subject"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_subject_lessons_subject_lesson"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_lessons_year_updated"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_lessons_subject_type_year_created"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_timetables_branch_day_time"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_timetables_teacher_day_time"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_timetables_class_day_time"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_teaching_subject"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_teaching_admin_branch_year_created"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_teaching_branch_year_created"');
  }
}
