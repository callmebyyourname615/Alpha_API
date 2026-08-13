import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './notification.entity';
import { TaskAccessModule } from '../task-access/task-access.module';
@Module({
  imports: [TypeOrmModule.forFeature([Notification]), TaskAccessModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
