// src/timetables/timetable.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Timetable } from './timetable.entity';
import { CreateTimetableDto } from './dto/create-timetable.dto';
import { UpdateTimetableDto } from './dto/update-timetable.dto';
import { Subject } from '../subjects/subject.entity';

const RELATIONS = [
  'branch',
  'academicYear',
  'class',
  'subject',
  'subject.subjectType',
  'teacher',
];

@Injectable()
export class TimetableService {
  constructor(
    @InjectRepository(Timetable)
    private readonly timetableRepo: Repository<Timetable>,
    @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>,
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
    const timetables = await this.timetableRepo.find({
      where: { isDeleted: false },
      relations: RELATIONS,
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
    await this.attachSubjectLessons(timetables);
    return timetables;
  }

  // Get one
  async findOne(id: string): Promise<Timetable> {
    const timetable = await this.timetableRepo.findOne({
      where: { id, isDeleted: false },
      relations: RELATIONS,
    });
    if (!timetable) throw new NotFoundException(`Timetable ${id} not found`);
    await this.attachSubjectLessons([timetable]);
    return timetable;
  }

  // Get timetable by class
  async findByClass(classId: string): Promise<Timetable[]> {
    const timetables = await this.timetableRepo.find({
      where: { classId, isDeleted: false },
      relations: RELATIONS,
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
    await this.attachSubjectLessons(timetables);
    return timetables;
  }

  // Get timetable by teacher
  async findByTeacher(teacherId: string): Promise<Timetable[]> {
    const timetables = await this.timetableRepo.find({
      where: { teacherId, isDeleted: false },
      relations: RELATIONS,
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
    await this.attachSubjectLessons(timetables);
    return timetables;
  }

  // Get timetable by branch
  async findByBranch(branchId: string): Promise<Timetable[]> {
    const timetables = await this.timetableRepo.find({
      where: { branchId, isDeleted: false },
      relations: RELATIONS,
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
    await this.attachSubjectLessons(timetables);
    return timetables;
  }

  private async attachSubjectLessons(timetables: Timetable[]) {
    const subjectIds = [
      ...new Set(
        timetables
          .map((timetable) => timetable.subject?.id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    if (!subjectIds.length) return;

    const subjectsWithLessons = await this.subjectRepo
      .createQueryBuilder('subject')
      .leftJoinAndSelect('subject.lessons', 'lesson')
      .leftJoinAndSelect('lesson.subjectType', 'lessonSubjectType')
      .leftJoinAndSelect('lesson.yearLevel', 'lessonYearLevel')
      .leftJoinAndSelect('lesson.curriculums', 'curriculum')
      .select('subject.id')
      .addSelect('lesson')
      .addSelect('lessonSubjectType')
      .addSelect('lessonYearLevel')
      .addSelect('curriculum')
      .where('subject.id IN (:...subjectIds)', { subjectIds })
      .getMany();

    const lessonsBySubjectId = new Map(
      subjectsWithLessons.map((subject) => [subject.id, subject.lessons ?? []]),
    );

    for (const timetable of timetables) {
      if (!timetable.subject?.id) continue;
      timetable.subject.lessons = lessonsBySubjectId.get(timetable.subject.id) ?? [];
    }
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
