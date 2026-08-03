import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './common/logger.service';
import { LoggingInterceptor } from './common/logging.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true, // capture early logs
    bodyParser: false,
  });

  const config = app.get(ConfigService);
  const logger = app.get(LoggerService);
  const nodeEnv = config.get<string>('NODE_ENV') ?? 'development';
  const isProduction = nodeEnv === 'production';

  // Univer workbook snapshots can be large because they store cell styles,
  // merges, dimensions and multi-sheet rubric templates as JSON.
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ limit: '25mb', extended: true }));

  // Replace Nest default logger with custom Winston logger
  app.useLogger(logger);

  // In development we allow any origin to avoid local IP/domain CORS friction.
  const allowedOrigins = (
    config.get<string>('CORS_ORIGINS') ??
    'http://localhost:3000,http://localhost:3001,http://localhost:5000'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: isProduction
      ? (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        }
      : true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization,Cache-Control,cache-control',
    credentials: true,
  });

  // Set global API prefix from .env (e.g., /api or UUID)
  const prefix = config.get<string>('API_PREFIX') ?? '/api';
  app.setGlobalPrefix(prefix);

  // Serve static uploads at /uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  const uploadsPath = join(__dirname, '..', 'uploads');
  console.log('Uploads path:', uploadsPath);
  console.log('Uploads exists:', require('fs').existsSync(uploadsPath));
  // Optional: log all requests/responses
  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Alpha School API')
    .setDescription('Alpha School REST API documentation')
    .setVersion('2.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${prefix}/docs`, app, document);

  const port = Number(config.get<string>('PORT') ?? 3000);

  await app.listen(port);
  logger.log(`Server running at http://localhost:${port}${prefix}`);
  logger.log(`Swagger docs at http://localhost:${port}${prefix}/docs`);
}

bootstrap();
