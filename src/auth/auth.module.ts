import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { Admin } from '../admins/admin.entity';
import { Parent } from '../parents/parent.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, Parent]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'MY_SUPER_SECRET_KEY',
      signOptions: { expiresIn: '12h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
