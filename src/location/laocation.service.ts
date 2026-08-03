import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Province } from './province.entity';
import { District } from './district.entity';

@Injectable()
export class LaocationService {
  constructor(
    @InjectRepository(Province)
    private provinceRepo: Repository<Province>,
    @InjectRepository(District)
    private districtRepo: Repository<District>,
  ) {}

  // === Province ===
  createProvince(data: Partial<Province>) {
    const province = this.provinceRepo.create(data);
    return this.provinceRepo.save(province);
  }

  getAllProvinces() {
    return this.provinceRepo.find({ relations: ['districts'] });
  }

  getProvinceById(id: string) {
    return this.provinceRepo.findOne({
      where: { id },
      relations: ['districts'],
    });
  }

  updateProvince(id: string, data: Partial<Province>) {
    return this.provinceRepo.update(id, data);
  }

  deleteProvince(id: string) {
    return this.provinceRepo.delete(id);
  }

  // === District ===
  createDistrict(data: Partial<District>) {
    const district = this.districtRepo.create(data);
    return this.districtRepo.save(district);
  }

  getAllDistricts() {
    return this.districtRepo.find({ relations: ['province'] });
  }

  getDistrictById(id: string) {
    return this.districtRepo.findOne({
      where: { id },
      relations: ['province'],
    });
  }

  updateDistrict(id: string, data: Partial<District>) {
    return this.districtRepo.update(id, data);
  }

  deleteDistrict(id: string) {
    return this.districtRepo.delete(id);
  }
}
