import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStudentHealthReviewColumns1780000000012
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "students"
        ADD COLUMN IF NOT EXISTS "health_review_required" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "health_review_reasons" jsonb NULL DEFAULT '[]'::jsonb
    `);

    await queryRunner.query(`
      UPDATE "students"
      SET
        "health_review_required" = true,
        "health_review_reasons" = CASE
          WHEN jsonb_typeof("physical_disability") = 'array'
            THEN (
              SELECT COALESCE(
                jsonb_agg(DISTINCT NULLIF(trim(value_text), '')),
                '[]'::jsonb
              )
              FROM jsonb_array_elements("physical_disability") item
              CROSS JOIN LATERAL jsonb_each_text(item) fields(key, value_text)
              WHERE NULLIF(trim(value_text), '') IS NOT NULL
            )
          ELSE '[]'::jsonb
        END
      WHERE jsonb_typeof("physical_disability") = 'array'
        AND jsonb_array_length("physical_disability") > 0
        AND "health_review_required" = false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "students"
        DROP COLUMN IF EXISTS "health_review_reasons",
        DROP COLUMN IF EXISTS "health_review_required"
    `);
  }
}
