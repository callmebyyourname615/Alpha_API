// src/timetables/timetable.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Timetable } from './timetable.entity';
import { CreateTimetableDto } from './dto/create-timetable.dto';
import { UpdateTimetableDto } from './dto/update-timetable.dto';

const RELATIONS = [
  'branch',
  'academicYear',
  'class',
  'subject',
  'subject.subjectType',
  'subject.lessons',
  'subject.lessons.subjectType',
  'subject.lessons.yearLevel',
  'subject.lessons.curriculums',
  'teacher',
];

@Injectable()
export class TimetableService {
  constructor(
    @InjectRepository(Timetable)
    private readonly timetableRepo: Repository<Timetable>,
  ) {}

  private async assertNoClassTimeConflict(
    dto: Pick<CreateTimetableDto, 'classId' | 'dayOfWeek' | 'startTime' | 'endTime'>,
    ignoreId?: string,
  ): Promise<void> {
    const conflict = await this.timetableRepo
      .createQueryBuilder('t')
      .where('t.class_id = :classId', { classId: dto.classId })
      .andWhere('t.day_of_week = :day', { day: dto.dayOfWeek })
      .andWhere('t.is_deleted = false')
      .andWhere('t.start_time < :endTime', { endTime: dto.endTime })
      .andWhere('t.end_time > :startTime', { startTime: dto.startTime })
      .andWhere(ignoreId ? 't.id != :ignoreId' : '1 = 1', { ignoreId })
      .getOne();

    if (conflict) {
      throw new BadRequestException(
        `Time conflict: class already has a schedule on ${dto.dayOfWeek} from ${conflict.startTime} to ${conflict.endTime}`,
      );
    }
  }

  async create(dto: CreateTimetableDto): Promise<Timetable> {
    await this.assertNoClassTimeConflict(dto);

    const timetable = this.timetableRepo.create(dto);
    const saved = await this.timetableRepo.save(timetable);
    return this.findOne(saved.id);
  }

  // Get all timetables
  async findAll(): Promise<Timetable[]> {
    return this.timetableRepo.find({
      where: { isDeleted: false },
      relations: RELATIONS,
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  // Get one
  async findOne(id: string): Promise<Timetable> {
    const timetable = await this.timetableRepo.findOne({
      where: { id, isDeleted: false },
      relations: RELATIONS,
    });
    if (!timetable) throw new NotFoundException(`Timetable ${id} not found`);
    return timetable;
  }

  // Get timetable by class
  async findByClass(classId: string): Promise<Timetable[]> {
    return this.timetableRepo.find({
      where: { classId, isDeleted: false },
      relations: RELATIONS,
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  // Get timetable by teacher
  async findByTeacher(teacherId: string): Promise<Timetable[]> {
    return this.timetableRepo.find({
      where: { teacherId, isDeleted: false },
      relations: RELATIONS,
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  // Get timetable by branch
  async findByBranch(branchId: string): Promise<Timetable[]> {
    return this.timetableRepo.find({
      where: { branchId, isDeleted: false },
      relations: RELATIONS,
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async update(id: string, dto: UpdateTimetableDto): Promise<Timetable> {
    const timetable = await this.findOne(id);
    const nextTimetable = {
      ...timetable,
      ...dto,
    };

    await this.assertNoClassTimeConflict(
      {
        classId: nextTimetable.classId,
        dayOfWeek: nextTimetable.dayOfWeek,
        startTime: nextTimetable.startTime,
        endTime: nextTimetable.endTime,
      },
      id,
    );

    Object.assign(timetable, dto);
    await this.timetableRepo.save(timetable);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const timetable = await this.findOne(id);
    timetable.isDeleted = true;
    await this.timetableRepo.save(timetable);
    return { message: `Timetable ${id} deleted successfully` };
  }
}
