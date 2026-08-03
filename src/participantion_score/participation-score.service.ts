import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { ParticipationScore } from './participation-score.entity';
import { CreateParticipationScoreDto } from './dto/create-participation-score.dto';
import { UpdateParticipationScoreDto } from './dto/update-participation-score.dto';
import { ParticipationList } from '../participantion_list/participation_list.entity';
import { Student } from '../students/student.entity';

interface ScoreResult {
  studentId: string;
  studentName: string;
  participationId: string;
  participationName: string;
  score: number;
}

@Injectable()
export class ParticipationScoreService {
  constructor(
    @InjectRepository(ParticipationScore)
    private readonly repo: Repository<ParticipationScore>,

    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,

    @InjectRepository(ParticipationList)
    private readonly participationRepo: Repository<ParticipationList>,
  ) {}

  /* ================= HELPER ================= */
  private normalizeDate(date: Date | string): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /* ================= CREATE ================= */
  async create(dto: CreateParticipationScoreDto) {
    const entity = this.repo.create({
      branchId: dto.branchId,
      academicYearId: dto.academicYearId,
      levelId: dto.levelId,       // ← added
      classId: dto.classId,
      addedBy: dto.addedBy,
      date: dto.date ? this.normalizeDate(dto.date) : null,
      scores: dto.scores.map((s) => ({
        studentId: s.studentId,
        participationId: s.participationId,
        participationName: s.name,
        score: s.score,
      })),
    });

    return this.repo.save(entity);
  }

  /* ================= GET ALL ================= */
  async findAll() {
    return this.repo.find({ order: { created_at: 'DESC' } });
  }

  /* ================= GET BY ID ================= */
  async findOne(id: string) {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) throw new NotFoundException('Participation score not found');
    return record;
  }

  /* ================= UPDATE ================= */
  async update(id: string, dto: UpdateParticipationScoreDto) {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) throw new NotFoundException('Participation score not found');

    if (dto.branchId)       record.branchId = dto.branchId;
    if (dto.academicYearId) record.academicYearId = dto.academicYearId;
    if (dto.levelId)        record.levelId = dto.levelId;   // ← added
    if (dto.classId)        record.classId = dto.classId;
    if (dto.addedBy)        record.addedBy = dto.addedBy;
    if (dto.date)           record.date = this.normalizeDate(dto.date);

    if (dto.scores) {
      record.scores = dto.scores.map((s) => ({
        studentId: s.studentId,
        participationId: s.participationId,
        participationName: s.name,
        score: s.score,
      }));
    }

    return this.repo.save(record);
  }

  /* ================= DELETE ================= */
  async remove(id: string) {
    const record = await this.repo.findOne({ where: { id } });
    if (!record) throw new NotFoundException('Participation score not found');
    await this.repo.remove(record);
    return { message: 'Deleted successfully' };
  }

  /* ================= BULK UPSERT ================= */
  async bulkUpsert(dto: CreateParticipationScoreDto) {
    const targetDate = dto.date ? this.normalizeDate(dto.date) : undefined;

    const existing = await this.repo.findOne({
      where: {
        branchId: dto.branchId,
        academicYearId: dto.academicYearId,
        levelId: dto.levelId,     // ← added to uniqueness check
        classId: dto.classId,
        date: targetDate,
      },
    });

    // load participation names from DB
    const participationIds = dto.scores.map((s) => s.participationId);
    const participations = await this.participationRepo.findByIds(participationIds);
    const participationMap: Record<string, string> = {};
    participations.forEach((p) => (participationMap[p.id] = p.name));

    if (existing) {
      dto.scores.forEach((s) => {
        const idx = existing.scores.findIndex(
          (sc) =>
            sc.studentId === s.studentId &&
            sc.participationId === s.participationId,
        );

        const nameFromDB = participationMap[s.participationId] || 'Unknown Activity';

        if (idx >= 0) {
          existing.scores[idx].score = s.score;
          existing.scores[idx].participationName = nameFromDB;
        } else {
          existing.scores.push({
            studentId: s.studentId,
            participationId: s.participationId,
            participationName: nameFromDB,
            score: s.score,
          });
        }
      });

      return this.repo.save(existing);
    }

    const entity = this.repo.create({
      branchId: dto.branchId,
      academicYearId: dto.academicYearId,
      levelId: dto.levelId,       // ← added
      classId: dto.classId,
      addedBy: dto.addedBy,
      date: targetDate,
      scores: dto.scores.map((s) => ({
        studentId: s.studentId,
        participationId: s.participationId,
        participationName: participationMap[s.participationId] || 'Unknown Activity',
        score: s.score,
      })),
    });

    return this.repo.save(entity);
  }

  /* ================= GET SCORES BY FILTER ================= */
  async getScoresByFilter(filter: {
    branchId: string;
    academicYearId: string;
    levelId: string;              // ← added
    classId: string;
    date: Date;
  }): Promise<ScoreResult[]> {
    const startOfDay = new Date(filter.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(filter.date);
    endOfDay.setHours(23, 59, 59, 999);

    const scoreRecord = await this.repo.findOne({
      where: {
        branchId: filter.branchId,
        academicYearId: filter.academicYearId,
        levelId: filter.levelId,  // ← added
        classId: filter.classId,
        date: Between(startOfDay, endOfDay),
      },
    });

    // students in the selected class
    const students = await this.studentRepo.find({
      where: { enrollments: { class: { id: filter.classId } } },
      select: ['id', 'first_name_lao', 'last_name_lao', 'first_name_eng', 'last_name_eng'],
      order: { first_name_lao: 'ASC', last_name_lao: 'ASC', first_name_eng: 'ASC', last_name_eng: 'ASC' },
    });

    // participation lists that belong to the selected level only ← key fix
    const activities = await this.participationRepo
      .createQueryBuilder('list')
      .innerJoin('list.levels', 'level')
      .where('level.id = :levelId', { levelId: filter.levelId })
      .select(['list.id', 'list.name'])
      .getMany();

    const result: ScoreResult[] = [];

    for (const student of students) {
      for (const activity of activities) {
        const existing = scoreRecord?.scores?.find(
          (s) => s.studentId === student.id && s.participationId === activity.id,
        );

        result.push({
          studentId: student.id,
          studentName: `${student.first_name_lao || ''} ${student.last_name_lao || ''} (${student.first_name_eng || ''} ${student.last_name_eng || ''})`.trim(),
          participationId: activity.id,
          participationName: activity.name || 'Unknown',
          score: existing?.score ?? 0,
        });
      }
    }

    return result;
  }
}
