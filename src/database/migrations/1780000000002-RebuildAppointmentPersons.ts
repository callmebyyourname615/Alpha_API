import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * PostgreSQL retains an internal attribute for every dropped column. The
 * legacy appointment_persons table accumulated 1,582 of those attributes,
 * leaving no room for the three reschedule fields required by the active
 * entity. Rebuild it with only its live columns, while retaining the original
 * table as a rollback backup.
 */
export class RebuildAppointmentPersons1780000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "appointment_persons__rebuild_1780000000002" (
        "id" character varying(24) NOT NULL,
        "appointment_id" uuid,
        "person_id" uuid,
        "person_type" "appointment_persons_person_type_enum",
        "notes" text,
        "proposed_date" date,
        "proposed_from_time" time,
        "proposed_to_time" time,
        "rescheduled_count" integer NOT NULL DEFAULT 0,
        "declined_count" integer NOT NULL DEFAULT 0,
        "branch_id" uuid,
        "academic_year_id" uuid,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "responded_at" timestamp without time zone,
        "response_history" jsonb DEFAULT '[]'::jsonb,
        "created_at" timestamp without time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp without time zone NOT NULL DEFAULT now(),
        "status" character varying(50),
        CONSTRAINT "PK_appointment_persons_rebuild_1780000000002" PRIMARY KEY ("id"),
        CONSTRAINT "FK_appointment_persons_appointment_rebuild_1780000000002"
          FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_appointment_persons_branch_rebuild_1780000000002"
          FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_appointment_persons_academic_year_rebuild_1780000000002"
          FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      INSERT INTO "appointment_persons__rebuild_1780000000002" (
        "id", "appointment_id", "person_id", "person_type", "notes",
        "rescheduled_count", "declined_count", "branch_id", "academic_year_id",
        "is_active", "is_deleted", "responded_at", "response_history",
        "created_at", "updated_at", "status"
      )
      SELECT
        "id", "appointment_id", "person_id", "person_type", "notes",
        "rescheduled_count", "declined_count", "branch_id", "academic_year_id",
        "is_active", "is_deleted", "responded_at", "response_history",
        "created_at", "updated_at", "status"
      FROM "appointment_persons"
    `);

    await queryRunner.query(`
      ALTER TABLE "appointment_persons"
      RENAME TO "appointment_persons__pre_rebuild_1780000000002"
    `);
    await queryRunner.query(`
      ALTER TABLE "appointment_persons__rebuild_1780000000002"
      RENAME TO "appointment_persons"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Do not discard rows that may have been written after the rebuild. Keep
    // the rebuilt version as an archive and restore the original schema.
    await queryRunner.query(`
      ALTER TABLE "appointment_persons"
      RENAME TO "appointment_persons__rebuilt_archive_1780000000002"
    `);
    await queryRunner.query(`
      ALTER TABLE "appointment_persons__pre_rebuild_1780000000002"
      RENAME TO "appointment_persons"
    `);
  }
}
