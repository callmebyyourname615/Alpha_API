import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRubricWorkspaces1780000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rubric_workspaces" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspace_key" character varying NOT NULL DEFAULT 'default',
        "objects" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rubric_workspaces_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_rubric_workspaces_workspace_key" UNIQUE ("workspace_key")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "rubric_workspaces"');
  }
}
