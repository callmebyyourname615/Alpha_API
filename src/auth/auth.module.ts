import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Admin } from '../admins/admin.entity';
import { Parent } from '../parents/parent.entity';
import { normalizeJwtExpiresIn } from './jwt-config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, Parent]),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'MY_SUPER_SECRET_KEY',
        signOptions: {
          expiresIn: normalizeJwtExpiresIn(
            config.get<string>('JWT_EXPIRES_IN'),
          ) as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
