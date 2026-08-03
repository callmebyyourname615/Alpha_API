import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LaocationService } from './laocation.service';
import { LaocationController } from './laocation.controller';
import { Province } from './province.entity';
import { District } from './district.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Province, District])],
  providers: [LaocationService],
  controllers: [LaocationController],
})
export class LaocationModule {}
