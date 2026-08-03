import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HomeworkResult } from './homework-result.entity';
import { TeacherHomework } from '../teacher-homework/teacher-homework.entity';
import { CreateHomeworkResultDto } from './dto/create-homework-result.dto';
import { UpdateHomeworkResultDto } from './dto/update-homework-result.dto';
import { BulkCreateHomeworkResultDto } from './dto/bulk-create-homework-result.dto';
import { HomeworkItemScoreDto } from './dto/create-homework-result.dto';

@Injectable()
export class HomeworkResultService {
  constructor(
    @InjectRepository(HomeworkResult)
    private readonly resultRepository: Repository<HomeworkResult>,

    @InjectRepository(TeacherHomework)
    private readonly homeworkRepository: Repository<TeacherHomework>,
  ) {}

  // -------------------------------------------------------
  // Helpers
  // -------------------------------------------------------
  private async getHomework(homeworkId: string): Promise<TeacherHomework> {
    const hw = await this.homeworkRepository.findOne({
      where: { id: homeworkId },
      relations: ['teaching', 'branch', 'class', 'items'],
    });
    if (!hw) {
      throw new NotFoundException(
        `TeacherHomework with ID ${homeworkId} not found`,
      );
    }
    return hw;
  }

  private validateAndTotalItemScores(
    hw: TeacherHomework,
    itemScores: HomeworkItemScoreDto[],
  ): number {
    const items = [...(hw.items ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
    if (!items.length) {
      throw new BadRequestException('This homework has no items to grade');
    }
    if (itemScores.length !== items.length) {
      throw new BadRequestException(
        'A score is required for every homework item',
      );
    }

    const scoreByItemId = new Map(
      itemScores.map((item) => [item.homeworkItemId, Number(item.score)]),
    );
    if (scoreByItemId.size !== itemScores.length) {
      throw new BadRequestException(
        'Duplicate homework item scores are not allowed',
      );
    }

    const totalScore = items.reduce((total, item) => {
      if (!scoreByItemId.has(item.id)) {
        throw new BadRequestException(
          `Missing score for homework item ${item.id}`,
        );
      }
      const score = scoreByItemId.get(item.id)!;
      if (!Number.isFinite(score) || score < 0 || score > item.score) {
        throw new BadRequestException(
          `Score for "${item.title}" must be between 0 and ${item.score}`,
        );
      }
      return total + score;
    }, 0);

    if (totalScore > 100) {
      throw new BadRequestException(
        'The awarded homework score cannot exceed 100',
      );
    }

    return totalScore;
  }

  // -------------------------------------------------------
  // CREATE — single result
  // -------------------------------------------------------
  async create(dto: CreateHomeworkResultDto): Promise<HomeworkResult> {
    const hw = await this.getHomework(dto.homeworkId);

    if (hw.dueDate && new Date(hw.dueDate).getTime() < Date.now()) {
      throw new BadRequestException('The homework due date has passed');
    }

    if (dto.score > hw.totalScore) {
      throw new BadRequestException(
        `Score ${dto.score} exceeds homework total score ${hw.totalScore}`,
      );
    }

    const existing = await this.resultRepository.findOne({
      where: {
        homeworkId: dto.homeworkId,
        studentId: dto.studentId,
        isDeleted: false,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Result for student ${dto.studentId} in this homework already exists`,
      );
    }

    const result = this.resultRepository.create({
      ...dto,
      itemScores: null,
      isGraded: false,
      classId: dto.classId ?? hw.classId ?? null,
      branchId: dto.branchId ?? hw.branchId ?? null,
    });

    return this.resultRepository.save(result);
  }

  // -------------------------------------------------------
  // BULK CREATE — submit all student scores at once
  // -------------------------------------------------------
  async bulkCreate(
    dto: BulkCreateHomeworkResultDto,
  ): Promise<HomeworkResult[]> {
    const hw = await this.getHomework(dto.homeworkId);

    const resultsToSave: HomeworkResult[] = [];

    for (const item of dto.results) {
      const computedScore = item.itemScores
        ? this.validateAndTotalItemScores(hw, item.itemScores)
        : item.score;

      if (computedScore > hw.totalScore) {
        throw new BadRequestException(
          `Score ${computedScore} for student ${item.studentId} exceeds homework total score ${hw.totalScore}`,
        );
      }

      const existing = await this.resultRepository.findOne({
        where: {
          homeworkId: dto.homeworkId,
          studentId: item.studentId,
          isDeleted: false,
        },
      });
      if (existing) {
        throw new ConflictException(
          `Result for student ${item.studentId} in this homework already exists`,
        );
      }

      resultsToSave.push(
        this.resultRepository.create({
          homeworkId: dto.homeworkId,
          studentId: item.studentId,
          classId: dto.classId ?? hw.classId ?? null,
          branchId: dto.branchId ?? hw.branchId ?? null,
          score: computedScore,
          itemScores: item.itemScores ?? null,
          remark: item.remark ?? null,
        }),
      );
    }

    return this.resultRepository.save(resultsToSave);
  }

  // -------------------------------------------------------
  // FIND ALL
  // -------------------------------------------------------
  async findAll(): Promise<HomeworkResult[]> {
    return this.resultRepository.find({
      where: { isDeleted: false },
      relations: ['homework', 'student', 'class', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  // -------------------------------------------------------
  // FIND ONE
  // -------------------------------------------------------
  async findOne(id: string): Promise<HomeworkResult> {
    const result = await this.resultRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['homework', 'student', 'class', 'branch'],
    });

    if (!result) {
      throw new NotFoundException(`HomeworkResult with ID ${id} not found`);
    }

    return result;
  }

  // -------------------------------------------------------
  // FIND BY HOMEWORK — all student scores for one homework
  // -------------------------------------------------------
  async findByHomework(homeworkId: string): Promise<HomeworkResult[]> {
    await this.getHomework(homeworkId);

    return this.resultRepository.find({
      where: { homeworkId, isDeleted: false },
      relations: ['student', 'class', 'branch'],
      order: { score: 'DESC' },
    });
  }

  // -------------------------------------------------------
  // FIND BY STUDENT — all homework results for one student
  // -------------------------------------------------------
  async findByStudent(studentId: string): Promise<HomeworkResult[]> {
    return this.resultRepository.find({
      where: { studentId, isDeleted: false },
      relations: ['homework', 'class', 'branch'],
      order: { submittedAt: 'DESC' },
    });
  }

  // -------------------------------------------------------
  // FIND BY CLASS — all homework results for a class
  // -------------------------------------------------------
  async findByClass(classId: string): Promise<HomeworkResult[]> {
    return this.resultRepository.find({
      where: { classId, isDeleted: false },
      relations: ['homework', 'student', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  // -------------------------------------------------------
  // UPDATE — correct a score
  // -------------------------------------------------------
  async update(
    id: string,
    dto: UpdateHomeworkResultDto,
  ): Promise<HomeworkResult> {
    const result = await this.findOne(id);

    const hw =
      dto.score !== undefined || dto.itemScores !== undefined
        ? await this.getHomework(dto.homeworkId ?? result.homeworkId)
        : null;

    if (dto.itemScores !== undefined) {
      const total = this.validateAndTotalItemScores(hw!, dto.itemScores);
      dto.score = total;
      result.itemScores = dto.itemScores;
      result.score = total;
      result.isGraded = true;
    } else if (dto.score !== undefined) {
      if (dto.score > hw!.totalScore) {
        throw new BadRequestException(
          `Score ${dto.score} exceeds homework total score ${hw!.totalScore}`,
        );
      }
      result.isGraded = true;
    }

    const { itemScores: _itemScores, ...updates } = dto;
    Object.assign(result, updates);
    return this.resultRepository.save(result);
  }

  // -------------------------------------------------------
  // SOFT DELETE
  // -------------------------------------------------------
  async remove(id: string): Promise<{ message: string }> {
    const result = await this.findOne(id);
    result.isDeleted = true;
    await this.resultRepository.save(result);
    return { message: `HomeworkResult #${id} deleted successfully` };
  }
}
