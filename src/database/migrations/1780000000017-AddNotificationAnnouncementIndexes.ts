import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationAnnouncementIndexes1780000000017
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_notifications_deleted_created"
        ON "notifications" ("is_deleted", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_notifications_branch_deleted_created"
        ON "notifications" ("branch_id", "is_deleted", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_notifications_parent_deleted_created"
        ON "notifications" ("parent_id", "is_deleted", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_notifications_student_deleted_created"
        ON "notifications" ("student_id", "is_deleted", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_notifications_module_lookup"
        ON "notifications" ("module_id", "module_type", "is_deleted")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_notifications_unseen_parent"
        ON "notifications" ("parent_id", "seen", "is_deleted", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_announcements_deleted_created"
        ON "announcements" ("is_deleted", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_announcements_branch_deleted_created"
        ON "announcements" ("branch_id", "is_deleted", "created_at" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_announcements_active_window"
        ON "announcements" ("status", "is_deleted", "start_date", "end_date", "created_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "idx_announcements_active_window"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_announcements_branch_deleted_created"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_announcements_deleted_created"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_notifications_unseen_parent"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_notifications_module_lookup"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_notifications_student_deleted_created"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_notifications_parent_deleted_created"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_notifications_branch_deleted_created"');
    await queryRunner.query('DROP INDEX IF EXISTS "idx_notifications_deleted_created"');
  }
}
