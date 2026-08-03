import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Participant-proposed schedules are not exposed by the active portal.
 * Official reschedules live on appointments.rescheduled_*, so remove the
 * unused, empty proposal columns from appointment_persons.
 */
export class RemoveUnusedParticipantProposals1780000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "appointment_persons"
        DROP COLUMN "proposed_date",
        DROP COLUMN "proposed_from_time",
        DROP COLUMN "proposed_to_time"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "appointment_persons"
        ADD COLUMN "proposed_date" date,
        ADD COLUMN "proposed_from_time" time,
        ADD COLUMN "proposed_to_time" time
    `);
  }
}
