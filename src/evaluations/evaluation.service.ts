import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evaluation } from './evaluation.entity';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { SubjectEvaluation } from '../subject_evaluations/subject-evaluation.entity';

@Injectable()
export class EvaluationService {
  constructor(
    @InjectRepository(Evaluation)
    private readonly evaluationRepo: Repository<Evaluation>,
    @InjectRepository(SubjectEvaluation)
    private readonly subjectEvaluationRepo: Repository<SubjectEvaluation>,
  ) {}

  async create(dto: CreateEvaluationDto): Promise<Evaluation> {
    let subjectEvaluation: SubjectEvaluation | null = null;

    if (dto.subjectEvaluationId) {
      subjectEvaluation = await this.subjectEvaluationRepo.findOne({
        where: { id: dto.subjectEvaluationId },
      });

      if (!subjectEvaluation) {
        throw new NotFoundException(
          `Subject evaluation ${dto.subjectEvaluationId} not found`,
        );
      }
    }

    const contentIndex = Number.isInteger(dto.contentIndex)
      ? (dto.contentIndex as number)
      : 0;

    // Upsert on (student, subject_evaluation, content_index) so
    // re-submitting a sub-evaluation score edits the existing row
    // instead of colliding with the new unique constraint.
    if (dto.subjectEvaluationId) {
      const existing = await this.evaluationRepo.findOne({
        where: {
          student: { id: dto.studentId },
          subjectEvaluation: { id: dto.subjectEvaluationId },
          contentIndex,
        },
      });

      if (existing) {
        existing.score = dto.score;
        existing.admin = { id: dto.adminId } as Evaluation['admin'];
        if (dto.subjectId) {
          existing.subject = { id: dto.subjectId } as Evaluation['subject'];
        }
        if (dto.classId) {
          existing.class = { id: dto.classId } as Evaluation['class'];
        }
        existing.updated_at = new Date();
        return this.evaluationRepo.save(existing);
      }
    }

    const evaluation = this.evaluationRepo.create({
      admin: { id: dto.adminId } as Evaluation['admin'],
      student: { id: dto.studentId } as Evaluation['student'],
      ...(dto.subjectId ? { subject: { id: dto.subjectId } as Evaluation['subject'] } : {}),
      ...(dto.classId ? { class: { id: dto.classId } as Evaluation['class'] } : {}),
      subjectEvaluation: subjectEvaluation ?? undefined,
      score: dto.score,
      contentIndex,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return this.evaluationRepo.save(evaluation);
  }

  async findAll(): Promise<Evaluation[]> {
    return this.evaluationRepo.find({
      order: { created_at: 'DESC', id: 'DESC' },
    });
  }

  async findByStudent(studentId: string): Promise<Evaluation[]> {
    return this.evaluationRepo.find({
      where: {
        student: {
          id: studentId,
        },
      },
      order: { created_at: 'DESC', id: 'DESC' },
    });
  }

  async updateScore(
    id: number,
    dto: UpdateEvaluationDto,
  ): Promise<Evaluation> {
    const evaluation = await this.evaluationRepo.findOne({
      where: { id },
    });

    if (!evaluation) {
      throw new NotFoundException(`Evaluation ${id} not found`);
    }

    if (dto.score !== undefined) {
      evaluation.score = dto.score;
    }
    if (Number.isInteger(dto.contentIndex)) {
      evaluation.contentIndex = dto.contentIndex as number;
    }
    if (dto.subjectId) {
      evaluation.subject = { id: dto.subjectId } as Evaluation['subject'];
    }
    if (dto.classId) {
      evaluation.class = { id: dto.classId } as Evaluation['class'];
    }
    evaluation.updated_at = new Date();

    return this.evaluationRepo.save(evaluation);
  }

  async remove(id: number): Promise<{ message: string }> {
    const evaluation = await this.evaluationRepo.findOne({
      where: { id },
    });

    if (!evaluation) {
      throw new NotFoundException(`Evaluation ${id} not found`);
    }

    await this.evaluationRepo.remove(evaluation);

    return { message: `Evaluation ${id} deleted successfully` };
  }
}
