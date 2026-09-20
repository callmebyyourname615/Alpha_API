import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGalleryFeedSearchIndexes1780000000027
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_gallery_posts_feed_coalesced_order"
        ON "gallery_posts" (
          "status",
          "is_pinned" DESC,
          (COALESCE("published_at", "created_at")) DESC
        )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_gallery_posts_title_trgm"
        ON "gallery_posts" USING GIN ("title" gin_trgm_ops)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_gallery_posts_description_trgm"
        ON "gallery_posts" USING GIN ("description" gin_trgm_ops)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_gallery_posts_location_trgm"
        ON "gallery_posts" USING GIN ("location" gin_trgm_ops)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_gallery_posts_location_trgm"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_gallery_posts_description_trgm"',
    );
    await queryRunner.query('DROP INDEX IF EXISTS "idx_gallery_posts_title_trgm"');
    await queryRunner.query(
      'DROP INDEX IF EXISTS "idx_gallery_posts_feed_coalesced_order"',
    );
  }
}
