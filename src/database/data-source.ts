import 'dotenv/config';
import { DataSource } from 'typeorm';
import { join } from 'path';

const sourceExtension = __filename.endsWith('.ts') ? 'ts' : 'js';

/** TypeORM CLI connection; the CLI does not load Nest modules. */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [join(__dirname, '..', `**/*.entity.${sourceExtension}`)],
  migrations: [join(__dirname, 'migrations', `*.${sourceExtension}`)],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
});
