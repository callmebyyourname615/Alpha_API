import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuRead } from './menu-read.entity';
import { MenuReadsService } from './menu-reads.service';
import { MenuReadsController } from './menu-reads.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MenuRead])],
  controllers: [MenuReadsController],
  providers: [MenuReadsService],
  exports: [MenuReadsService],
})
export class MenuReadsModule {}
