import {
  Controller,
  Post,
  Put,
  Get,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { LaocationService } from './laocation.service';
import { Province } from './province.entity';
import { District } from './district.entity';

@Controller('locations')
export class LaocationController {
  constructor(private readonly service: LaocationService) {}

  // === Province ===
  @Post('province')
  createProvince(@Body() data: Partial<Province>) {
    return this.service.createProvince(data);
  }

  @Get('province')
  getAllProvinces() {
    return this.service.getAllProvinces();
  }

  @Get('province/:id')
  getProvinceById(@Param('id') id: string) {
    return this.service.getProvinceById(id);
  }

  @Put('province/:id')
  updateProvince(@Param('id') id: string, @Body() data: Partial<Province>) {
    return this.service.updateProvince(id, data);
  }

  @Delete('province/:id')
  deleteProvince(@Param('id') id: string) {
    return this.service.deleteProvince(id);
  }

  // === District ===
  @Post('district')
  createDistrict(@Body() data: Partial<District>) {
    return this.service.createDistrict(data);
  }

  @Get('district')
  getAllDistricts() {
    return this.service.getAllDistricts();
  }

  @Get('district/:id')
  getDistrictById(@Param('id') id: string) {
    return this.service.getDistrictById(id);
  }

  @Put('district/:id')
  updateDistrict(@Param('id') id: string, @Body() data: Partial<District>) {
    return this.service.updateDistrict(id, data);
  }

  @Delete('district/:id')
  deleteDistrict(@Param('id') id: string) {
    return this.service.deleteDistrict(id);
  }
}
