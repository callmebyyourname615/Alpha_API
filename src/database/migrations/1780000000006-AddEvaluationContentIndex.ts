import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-content-item scoring for `evaluations`.
 *
 * A subject-evaluation definition can carry multiple `contents[]` entries
 * (ประเมิน 1..N). Previously an evaluation record was keyed by
 * (student, subject_evaluation) alone, so every content-item overwrote the
 * same row. This migration introduces `content_index` so each content-item
 * has its own row. Legacy rows are backfilled to index 0 by the DEFAULT.
 */
export class AddEvaluationContentIndex1780000000006
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "evaluations"
        ADD COLUMN IF NOT EXISTS "content_index" smallint NOT NULL DEFAULT 0
    `);

    // Drop any previous (student, subject_evaluation) uniqueness so the
    // new 3-tuple constraint can take its place without collision.
    await queryRunner.query(`
      DO $$
      DECLARE
        con record;
      BEGIN
        FOR con IN
          SELECT conname FROM pg_constraint
          WHERE conrelid = 'evaluations'::regclass
            AND contype = 'u'
            AND conname <> 'uq_evaluations_student_def_content'
        LOOP
          EXECUTE format('ALTER TABLE "evaluations" DROP CONSTRAINT %I', con.conname);
        END LOOP;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "evaluations"
        DROP CONSTRAINT IF EXISTS "uq_evaluations_student_def_content"
    `);
    await queryRunner.query(`
      ALTER TABLE "evaluations"
        ADD CONSTRAINT "uq_evaluations_student_def_content"
        UNIQUE ("student_id", "subject_evaluation_id", "content_index")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "evaluations"
        DROP CONSTRAINT IF EXISTS "uq_evaluations_student_def_content"
    `);
    await queryRunner.query(`
      ALTER TABLE "evaluations"
        DROP COLUMN IF EXISTS "content_index"
    `);
  }
}
