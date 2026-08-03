import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeAssignment } from '../entities/fee-assignment.entity';
import { FeeAssignmentService } from '../service/fee-assignment.service';
import { FeeTemplateModule } from './fee-template.module';
import { FeeAssignmentController } from '../controller/fee-assignment.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([FeeAssignment]),
    FeeTemplateModule,
  ],
  controllers: [FeeAssignmentController],
  providers: [FeeAssignmentService],
  exports: [FeeAssignmentService],
})
export class FeeAssignmentModule {}