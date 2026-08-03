import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchService } from './branch.service';
import { BranchController } from './branch.controller';
import { Branch } from './branch.entity';
import { Subject } from '../subjects/subject.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Branch, Subject]), // <-- add Subject here
  ],
  controllers: [BranchController],
  providers: [BranchService],
  exports: [BranchService],
})
export class BranchModule {}
