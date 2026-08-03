import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveReason } from './leave-reason.entity';
import { CreateLeaveReasonDto, UpdateLeaveReasonDto } from './dto/leave-reason.dto';

@Injectable()
export class LeaveReasonService {
  constructor(
    @InjectRepository(LeaveReason)
    private readonly leaveReasonRepo: Repository<LeaveReason>,
  ) {}

  async create(createDto: CreateLeaveReasonDto): Promise<LeaveReason> {
    const leaveReason = this.leaveReasonRepo.create({
      nameEn: createDto.nameEn,
      nameLa: createDto.nameLa,
      status: createDto.status ?? true,
    });
    return this.leaveReasonRepo.save(leaveReason);
  }

  async findAll(status?: boolean): Promise<LeaveReason[]> {
    const where = status !== undefined ? { status } : {};
    return this.leaveReasonRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<LeaveReason> {
    const leaveReason = await this.leaveReasonRepo.findOne({ where: { id } });
    if (!leaveReason) {
      throw new NotFoundException(`Leave reason with ID ${id} not found`);
    }
    return leaveReason;
  }

  async update(id: string, updateDto: UpdateLeaveReasonDto): Promise<LeaveReason> {
    const existing = await this.findOne(id);

    if (updateDto.nameEn !== undefined) existing.nameEn = updateDto.nameEn;
    if (updateDto.nameLa !== undefined) existing.nameLa = updateDto.nameLa;
    if (updateDto.status !== undefined) existing.status = updateDto.status;

    return this.leaveReasonRepo.save(existing);
  }

  async remove(id: string): Promise<{ message: string }> {
    const leaveReason = await this.findOne(id);
    await this.leaveReasonRepo.remove(leaveReason);
    return { message: 'Leave reason deleted successfully' };
  }
}