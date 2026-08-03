import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskSubmission } from './task-submission.entity';
import { TaskSubmissionAttempt } from './task-submission-attempt.entity';
import { CreateTaskSubmissionDto } from './dto/create-task-submission.dto';
import { UpdateTaskSubmissionDto } from './dto/update-task-submission.dto';
import { TaskSubmissionSlot } from './task-submission-slot.entity';
import { Task } from '../task/task.entity';
import { ReviewTaskSlotDto, SubmitTaskSlotDto } from './dto/task-submission-slot.dto';

@Injectable()
export class TaskSubmissionService {
  constructor(
    @InjectRepository(TaskSubmission)
    private readonly repo: Repository<TaskSubmission>,
    @InjectRepository(TaskSubmissionAttempt)
    private readonly attemptRepo: Repository<TaskSubmissionAttempt>,
    @InjectRepository(TaskSubmissionSlot)
    private readonly slotRepo: Repository<TaskSubmissionSlot>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) {}

  private buildDueAt(dateValue: string, dueTime?: string) {
    return new Date(`${dateValue}T${dueTime || '23:59'}:00`);
  }

  private getScheduleDates(task: Task): string[] {
    const dates = (task.settings as any)?.submission_schedule?.dates;
    if (Array.isArray(dates) && dates.length) return dates.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(String(date)));
    if (!task.deadline) return [];
    return [task.deadline.toISOString().slice(0, 10)];
  }

  async syncSlots(taskId: string, studentIds: string[]) {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    const dates = this.getScheduleDates(task);
    if (!dates.length) throw new BadRequestException('Task has no submission schedule');

    const uniqueStudentIds = [...new Set(studentIds)];
    for (const studentId of uniqueStudentIds) {
      for (const [offset, date] of dates.entries()) {
        const existing = await this.slotRepo.findOne({ where: { task_id: taskId, student_id: studentId, schedule_index: offset + 1 } });
        const scheduledDueAt = this.buildDueAt(date, task.due_time);
        if (!existing) {
          await this.slotRepo.save(this.slotRepo.create({
            task_id: taskId,
            student_id: studentId,
            schedule_index: offset + 1,
            due_at: scheduledDueAt,
          }));
        } else if (existing.status === 'pending' && existing.due_at.getTime() !== scheduledDueAt.getTime()) {
          // A task may be given a Submission Plan after its legacy one-round
          // fallback was created. Pending slots must follow the latest plan;
          // submitted history is never rewritten.
          existing.due_at = scheduledDueAt;
          await this.slotRepo.save(existing);
        }
      }
    }
    return this.findSlots(taskId);
  }

  async findSlots(taskId: string, studentId?: string) {
    const where = studentId ? { task_id: taskId, student_id: studentId } : { task_id: taskId };
    const slots = await this.slotRepo.find({ where, order: { student_id: 'ASC', schedule_index: 'ASC' } });
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    const lateSubmissionAllowed = task?.settings?.allow_late_submission === true;
    const now = new Date();
    const missed = lateSubmissionAllowed
      ? []
      : slots.filter((slot) => slot.status === 'pending' && slot.due_at < now);
    if (missed.length) {
      missed.forEach((slot) => { slot.status = 'missed'; });
      await this.slotRepo.save(missed);
    }
    return slots;
  }

  async submitSlot(dto: SubmitTaskSlotDto) {
    const slot = await this.slotRepo.findOne({ where: { task_id: dto.task_id, student_id: dto.student_id, schedule_index: dto.schedule_index } });
    if (!slot) throw new NotFoundException('Submission schedule slot not found');
    const task = await this.taskRepo.findOne({ where: { id: dto.task_id } });
    if (!task) throw new NotFoundException('Task not found');
    const lateSubmissionAllowed = task.settings?.allow_late_submission === true;
    const now = new Date();
    // Submission checkpoints are hard cut-offs. Once a round has passed, it
    // becomes missed and cannot be submitted retroactively, even if a later
    // round is still open.
    if (now > slot.due_at && !lateSubmissionAllowed) {
      if (slot.status === 'pending') {
        slot.status = 'missed';
        await this.slotRepo.save(slot);
      }
      throw new BadRequestException('This submission round has passed and is locked');
    }
    if (slot.status === 'missed') {
      throw new BadRequestException('This submission round was missed and is locked');
    }
    slot.status = now > slot.due_at ? 'late' : 'submitted';
    slot.submitted_at = now;
    slot.submitted_by_id = dto.submitted_by_id ?? slot.submitted_by_id;
    slot.submitted_by_type = dto.submitted_by_type ?? slot.submitted_by_type;
    slot.answer_text = dto.answer_text ?? slot.answer_text;
    slot.file_ids = dto.file_ids ?? slot.file_ids;
    if (dto.parent_confirmed_by_id) {
      slot.parent_confirmed_by_id = dto.parent_confirmed_by_id;
      slot.parent_confirmed_at = now;
    }
    return this.slotRepo.save(slot);
  }

  async reviewSlot(dto: ReviewTaskSlotDto) {
    const slot = await this.slotRepo.findOne({ where: { task_id: dto.task_id, student_id: dto.student_id, schedule_index: dto.schedule_index } });
    if (!slot) throw new NotFoundException('Submission schedule slot not found');
    if (!['submitted', 'late', 'reviewed'].includes(slot.status)) {
      throw new BadRequestException('This submission round has not been submitted yet');
    }
    slot.status = 'reviewed';
    slot.progress_pct = dto.progress_pct;
    slot.score = dto.score;
    slot.max_score = dto.max_score;
    slot.feedback = dto.feedback;
    slot.reviewed_by_id = dto.reviewed_by_id ?? slot.reviewed_by_id;
    slot.reviewed_at = new Date();
    return this.slotRepo.save(slot);
  }

  async findByTask(taskId: string): Promise<TaskSubmission[]> {
    return this.repo.find({
      where: { task_id: taskId },
      order: { updated_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<TaskSubmission> {
    const submission = await this.repo.findOne({ where: { id } });
    if (!submission) throw new NotFoundException('Task submission not found');
    return submission;
  }

  async findForStudent(taskId: string, studentId: string): Promise<TaskSubmission | null> {
    return this.repo.findOne({ where: { task_id: taskId, student_id: studentId } });
  }

  async findAttemptsByTask(taskId: string): Promise<TaskSubmissionAttempt[]> {
    return this.attemptRepo.find({ where: { task_id: taskId }, order: { submitted_at: 'DESC' } });
  }

  async recordAttempt(submissionId: string, fileId?: string): Promise<TaskSubmissionAttempt> {
    const submission = await this.findOne(submissionId);
    const lastAttempt = await this.attemptRepo.findOne({
      where: { task_id: submission.task_id, student_id: submission.student_id },
      order: { submission_number: 'DESC' },
    });
    const now = new Date();
    const attempt = this.attemptRepo.create({
      task_submission_id: submission.id,
      task_id: submission.task_id,
      student_id: submission.student_id,
      submission_number: (lastAttempt?.submission_number ?? 0) + 1,
      file_id: fileId,
      submitted_at: now,
    });

    submission.status = 'submitted';
    submission.submitted_at = now;
    submission.reviewed_at = null;
    await this.repo.save(submission);
    return this.attemptRepo.save(attempt);
  }

  // Create-or-update in one call: the admin review modal always targets a
  // single (task_id, student_id) pair regardless of whether a row exists yet.
  async upsert(dto: CreateTaskSubmissionDto & Partial<UpdateTaskSubmissionDto>): Promise<TaskSubmission> {
    let submission = await this.findForStudent(dto.task_id, dto.student_id);
    const now = new Date();

    if (!submission) {
      submission = this.repo.create({
        task_id: dto.task_id,
        student_id: dto.student_id,
      });
    }

    if (dto.answer_text !== undefined) submission.answer_text = dto.answer_text;
    if (dto.progress_pct !== undefined) submission.progress_pct = dto.progress_pct;
    if (dto.score !== undefined) submission.score = dto.score;
    if (dto.max_score !== undefined) submission.max_score = dto.max_score;
    if (dto.feedback !== undefined) submission.feedback = dto.feedback;
    if (dto.reviewed_by_id !== undefined) submission.reviewed_by_id = dto.reviewed_by_id;
    if (dto.reviewed_by_type !== undefined) submission.reviewed_by_type = dto.reviewed_by_type;

    const nextStatus = dto.status
      ?? (submission.progress_pct >= 100 ? 'submitted' : submission.progress_pct > 0 ? 'in_progress' : 'not_started');
    submission.status = nextStatus as TaskSubmission['status'];

    if (['submitted', 'reviewed'].includes(submission.status) && !submission.submitted_at) {
      submission.submitted_at = now;
    }
    if (submission.status === 'reviewed' && !submission.reviewed_at) {
      submission.reviewed_at = now;
    }

    return this.repo.save(submission);
  }

  async update(id: string, dto: UpdateTaskSubmissionDto): Promise<TaskSubmission> {
    const submission = await this.findOne(id);
    Object.assign(submission, dto);

    if (['submitted', 'reviewed'].includes(submission.status) && !submission.submitted_at) {
      submission.submitted_at = new Date();
    }
    if (submission.status === 'reviewed' && !submission.reviewed_at) {
      submission.reviewed_at = new Date();
    }

    return this.repo.save(submission);
  }

  async delete(id: string): Promise<{ message: string }> {
    const submission = await this.findOne(id);
    await this.repo.remove(submission);
    return { message: 'Task submission deleted' };
  }
}
