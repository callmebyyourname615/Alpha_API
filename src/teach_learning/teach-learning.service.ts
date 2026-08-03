import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeachLearning } from './teach-learning.entity';
import { CreateTeachLearningDto } from './dto/create-teach-learning.dto';
import { Admin } from '../admins/admin.entity';
import { Subject } from '../subjects/subject.entity';
import { UpdateTeachLearningDto } from './dto/update-teach-learning.dto';

@Injectable()
export class TeachLearningService {
  constructor(
    @InjectRepository(TeachLearning)
    private readonly teachLearningRepo: Repository<TeachLearning>,

    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,

    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
  ) {}

  async create(createDto: CreateTeachLearningDto): Promise<TeachLearning> {
    this.validateDates(createDto.start_date, createDto.end_date);
    this.validatePages(createDto);

    const admin = await this.adminRepo.findOne({
      where: { id: createDto.adminId },
    });

    if (!admin) {
      throw new BadRequestException('adminId not found');
    }

    const subject = await this.subjectRepo.findOne({
      where: { id: createDto.subjectId },
    });

    if (!subject) {
      throw new BadRequestException('subjectId not found');
    }

    const teachLearning = this.teachLearningRepo.create({
      ...createDto,
      admin,
      subject,
    });

    return await this.teachLearningRepo.save(teachLearning);
  }

  async findAll(): Promise<TeachLearning[]> {
    return await this.teachLearningRepo.find({
      relations: ['admin', 'subject'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<TeachLearning> {
    const teachLearning = await this.teachLearningRepo.findOne({
      where: { id },
      relations: ['admin', 'subject'],
    });

    if (!teachLearning) {
      throw new NotFoundException(`Teach learning with ID ${id} not found`);
    }

    return teachLearning;
  }

async findByDateRange(
  startDate: string,
  endDate: string,
): Promise<TeachLearning[]> {
  this.validateDates(startDate, endDate);

  const startDateTime = `${startDate} 00:00:00`;
  const endDateTime = `${endDate} 23:59:59`;

  return await this.teachLearningRepo
    .createQueryBuilder('teachLearning')
    .leftJoinAndSelect('teachLearning.admin', 'admin')
    .leftJoinAndSelect('teachLearning.subject', 'subject')
    .where('teachLearning.start_date <= :endDateTime', { endDateTime })
    .andWhere('teachLearning.end_date >= :startDateTime', { startDateTime })
    .orderBy('teachLearning.start_date', 'ASC')
    .getMany();
}
  async update(
    id: string,
    updateDto: UpdateTeachLearningDto,
  ): Promise<TeachLearning> {
    const existing = await this.findOne(id);

    const merged = {
      ...existing,
      ...updateDto,
    };

    this.validateDates(merged.start_date, merged.end_date);
    this.validatePages(merged);

    if (updateDto.adminId) {
      const admin = await this.adminRepo.findOne({
        where: { id: updateDto.adminId },
      });

      if (!admin) {
        throw new BadRequestException('adminId not found');
      }
    }

    if (updateDto.subjectId) {
      const subject = await this.subjectRepo.findOne({
        where: { id: updateDto.subjectId },
      });

      if (!subject) {
        throw new BadRequestException('subjectId not found');
      }
    }

    await this.teachLearningRepo.update(id, {
      adminId: updateDto.adminId,
      subjectId: updateDto.subjectId,
      start_date: updateDto.start_date,
      end_date: updateDto.end_date,
      break_time: updateDto.break_time,
      teaching_time: updateDto.teaching_time,
      start_st_page: updateDto.start_st_page,
      end_st_page: updateDto.end_st_page,
      start_th_page: updateDto.start_th_page,
      end_th_page: updateDto.end_th_page,
    });

    return await this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const teachLearning = await this.findOne(id);
    await this.teachLearningRepo.remove(teachLearning);

    return { message: 'Teach learning deleted successfully' };
  }

  private validateDates(startDate: string | Date, endDate: string | Date) {
    if (new Date(endDate) < new Date(startDate)) {
      throw new BadRequestException(
        'end_date cannot be earlier than start_date',
      );
    }
  }

  private validatePages(data: {
    start_st_page?: number;
    end_st_page?: number;
    start_th_page?: number;
    end_th_page?: number;
  }) {
    if (
      data.start_st_page !== undefined &&
      data.end_st_page !== undefined &&
      data.end_st_page < data.start_st_page
    ) {
      throw new BadRequestException(
        'end_st_page cannot be less than start_st_page',
      );
    }

    if (
      data.start_th_page !== undefined &&
      data.end_th_page !== undefined &&
      data.end_th_page < data.start_th_page
    ) {
      throw new BadRequestException(
        'end_th_page cannot be less than start_th_page',
      );
    }
  }
}
