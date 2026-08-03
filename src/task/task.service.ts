import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Task } from './task.entity';
import { FileService } from '../file/file.service';
import { CreateTaskDto } from './dto/CreateTaskDto';
import { UpdateTaskDto } from './dto/UpdateTaskDto';
import { Enrollment } from '../enrollments/enrollment.entity';
import { Student } from '../students/student.entity';
import { TaskSubmissionSlot } from '../task-submission/task-submission-slot.entity';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(TaskSubmissionSlot)
    private readonly submissionSlotRepo: Repository<TaskSubmissionSlot>,
    private readonly fileService: FileService,
  ) {}

  async create(
    data: CreateTaskDto,
    files?: Express.Multer.File[],
  ): Promise<Task> {
    const {
      student_id,
      class_id,
      deadline,
      start_date,
      reminders,
      settings,
      assignment_student_ids,
      assignment_class_ids,
      status,
      assignment_mode,
      ...rest
    } = data;

    // Multipart bodies arrive as strings — normalize obvious ones.
    const normalizedReminders = this.parseJsonMaybe(reminders);
    const normalizedSettings = this.parseJsonMaybe(settings);
    const normalizedStudentIds = this.parseJsonArrayMaybe(assignment_student_ids);
    const normalizedClassIds = this.parseJsonArrayMaybe(assignment_class_ids);

    // Cross-field defaults derived from assignment_mode
    const resolvedMode = assignment_mode
      ?? this.inferAssignmentMode({ student_id, class_id, normalizedStudentIds, normalizedClassIds });

    if (!this.hasAssignment({ student_id, class_id, normalizedStudentIds, normalizedClassIds })) {
      throw new BadRequestException('Task must be assigned to at least one student or class.');
    }
    if (status === 'assigned') {
      this.assertReadyForAssignment({
        name: data.name,
        description: data.description,
        subject: data.subject,
        deadline,
        settings: normalizedSettings,
      });
    }

    const newTask = this.taskRepo.create({
      ...rest,
      deadline: deadline ? new Date(deadline) : undefined,
      start_date: start_date ? new Date(start_date) : undefined,
      status: status ?? 'draft',
      assignment_mode: resolvedMode,
      assignment_student_ids: normalizedStudentIds ?? undefined,
      assignment_class_ids: normalizedClassIds ?? undefined,
      reminders: normalizedReminders ?? undefined,
      settings: normalizedSettings ?? undefined,
      class: class_id ? ({ id: class_id } as any) : undefined,
      student: student_id ? ({ id: student_id } as any) : undefined,
      added_by_id: data.added_by_id,
      added_by_type: data.added_by_type,
    });

    const savedTask = await this.taskRepo.save(newTask);

    // Save multiple files
    if (files?.length) {
      for (const file of files) {
        if (!file.path) continue; // skip if no path
        await this.fileService.create({
          module: 'task',
          task_id: savedTask.id,
          file_path: file.path,
        } as any);
      }
    }

    const task = await this.taskRepo.findOne({
      where: { id: savedTask.id },
      relations: ['student', 'files', 'class'],
    });

    if (!task) {
      throw new NotFoundException('Task not found after saving');
    }

    return task;
  }

  // Multipart form-data serializes nested objects as JSON strings; accept both.
  private parseJsonMaybe<T>(value: T | string | undefined): T | undefined {
    if (value == null) return undefined;
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  }

  private parseJsonArrayMaybe(value: unknown): string[] | undefined {
    if (value == null) return undefined;
    if (Array.isArray(value)) return value as string[];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : undefined;
      } catch {
        // fallback: comma-separated form field
        return value.split(',').map((v) => v.trim()).filter(Boolean);
      }
    }
    return undefined;
  }

  private inferAssignmentMode(input: {
    student_id?: string;
    class_id?: string;
    normalizedStudentIds?: string[];
    normalizedClassIds?: string[];
  }) {
    if (input.normalizedClassIds && input.normalizedClassIds.length > 1) return 'multiple';
    if (input.class_id || (input.normalizedClassIds && input.normalizedClassIds.length === 1)) return 'class';
    if (input.student_id || (input.normalizedStudentIds && input.normalizedStudentIds.length)) return 'individual';
    return undefined;
  }

  private hasAssignment(input: {
    student_id?: string;
    class_id?: string;
    normalizedStudentIds?: string[];
    normalizedClassIds?: string[];
  }) {
    return Boolean(
      input.student_id
        || input.class_id
        || (input.normalizedStudentIds && input.normalizedStudentIds.length > 0)
        || (input.normalizedClassIds && input.normalizedClassIds.length > 0),
    );
  }

  /** Draft tasks may be incomplete. Once a task is assigned, enforce the
   * same required wizard data even when a caller bypasses the web portal. */
  private assertReadyForAssignment(input: {
    name?: string;
    description?: string;
    subject?: string;
    deadline?: string | Date;
    settings?: unknown;
  }) {
    const missing: string[] = [];
    if (!input.name?.trim()) missing.push('task title');
    const description = String(input.description || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .trim();
    if (!description) missing.push('instructions');
    if (!input.subject?.trim()) missing.push('subject or task category');

    const deadline = input.deadline ? new Date(input.deadline) : null;
    if (!deadline || Number.isNaN(deadline.getTime())) missing.push('due date');

    const submissionSchedule = (input.settings as any)?.submission_schedule;
    const count = Number(submissionSchedule?.count);
    const dates = Array.isArray(submissionSchedule?.dates) ? submissionSchedule.dates : [];
    if (!Number.isInteger(count) || count < 1 || count > 52 || dates.length !== count)
      missing.push('submission plan');
    else if (dates.some((date) => Number.isNaN(new Date(String(date)).getTime())))
      missing.push('valid submission dates');

    if (missing.length)
      throw new BadRequestException({
        message: `Complete the task before assigning it: ${missing.join(', ')}`,
        missing,
      });
  }

  async findAll(): Promise<Task[]> {
    return this.taskRepo.find({
      relations: ['student', 'files'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Workload for students assigned to one task. A task counts as active until
   * completed; this includes overdue work because it still needs attention.
   */
  async getWorkload(taskId?: string) {
    const selectedTask = taskId
      ? await this.taskRepo.findOne({
          where: { id: taskId },
          relations: ['student'],
        })
      : null;
    if (taskId && !selectedTask) throw new NotFoundException('Task not found');

    const directStudentIds = new Set<string>([
      ...(selectedTask?.assignment_student_ids || []),
      ...(selectedTask?.student?.id ? [selectedTask.student.id] : []),
    ]);
    const selectedUsesClass = ['class', 'multiple'].includes(
      selectedTask?.assignment_mode || '',
    );
    const classIds = new Set<string>(
      selectedUsesClass
        ? [
            ...(selectedTask?.assignment_class_ids || []),
            ...(selectedTask?.class_id ? [selectedTask.class_id] : []),
          ]
        : [],
    );
    const activeEnrollments = await this.enrollmentRepo.find({
      where: { is_active: true },
      relations: ['student', 'class'],
    });
    const targetStudents = new Map<string, any>();
    if (!taskId) {
      for (const enrollment of activeEnrollments) {
        if (enrollment.student?.id) targetStudents.set(enrollment.student.id, enrollment.student);
      }
    }
    for (const enrollment of activeEnrollments) {
      if (!classIds.has(enrollment.classId) || !enrollment.student?.id) continue;
      targetStudents.set(enrollment.student.id, enrollment.student);
    }
    if (directStudentIds.size) {
      for (const enrollment of activeEnrollments) {
        if (directStudentIds.has(enrollment.studentId) && enrollment.student?.id)
          targetStudents.set(enrollment.student.id, enrollment.student);
      }
      const directStudents = await this.studentRepo.find({
        where: { id: In([...directStudentIds]) },
      });
      for (const student of directStudents) targetStudents.set(student.id, student);
    }
    if (selectedTask?.student?.id)
      targetStudents.set(selectedTask.student.id, selectedTask.student);

    const activeTasks = await this.taskRepo.find({ relations: ['student'] });
    const activeStatuses = new Set(['assigned', 'in_progress', 'submitted', 'overdue']);
    const threshold = 5;
    const now = new Date();
    const soon = new Date(now);
    soon.setDate(soon.getDate() + 7);
    const submissionSlots = await this.submissionSlotRepo.find();
    const slotByTaskStudentRound = new Map(
      submissionSlots.map((slot) => [`${slot.task_id}:${slot.student_id}:${slot.schedule_index}`, slot]),
    );

    const students = [...targetStudents.values()].map((student) => {
      const active = activeTasks.filter((task) => {
        if (!activeStatuses.has(task.status)) return false;
        const individual = (task.assignment_student_ids || []).includes(student.id)
          || task.student?.id === student.id;
        const studentClassIds = activeEnrollments
          .filter((entry) => entry.studentId === student.id)
          .map((entry) => entry.classId);
        const taskUsesClass = ['class', 'multiple'].includes(
          task.assignment_mode || '',
        );
        const byClass = taskUsesClass && studentClassIds.some((classId) =>
          (task.assignment_class_ids || []).includes(classId) || task.class_id === classId,
        );
        return individual || byClass;
      });
      const dueSoon = active.filter((task) => task.deadline >= now && task.deadline <= soon);
      const rooms = activeEnrollments
        .filter((entry) => entry.studentId === student.id)
        .map((entry) => entry.class?.name)
        .filter(Boolean);
      return {
        id: student.id,
        student_id: student.student_id,
        first_name_eng: student.first_name_eng,
        last_name_eng: student.last_name_eng,
        first_name_lao: student.first_name_lao,
        last_name_lao: student.last_name_lao,
        active_task_count: active.length,
        due_soon_count: dueSoon.length,
        estimated_minutes: active.reduce((sum, task) => sum + (Number(task.estimated_time_minutes) || 0), 0),
        class_name: rooms.join(', ') || 'No class',
        assigned_tasks: active.map((task) => ({
          id: task.id,
          title: task.name || 'Untitled task',
          submission_plan: (Array.isArray((task.settings as any)?.submission_schedule?.dates)
            ? (task.settings as any).submission_schedule.dates
            : task.deadline
              ? [task.deadline.toISOString().slice(0, 10)]
              : []).map((date: string, index: number) => {
                const slot = slotByTaskStudentRound.get(`${task.id}:${student.id}:${index + 1}`);
                const dueAt = slot?.due_at ?? new Date(`${date}T${task.due_time || '23:59'}:00`);
                const isPastDue = dueAt < now;
                const lateAllowed = task.settings?.allow_late_submission === true;
                const submittedAt = slot?.submitted_at ? new Date(slot.submitted_at) : null;
                // Keep the workload chips aligned with Task Submission: a
                // reviewed round is still late when its original upload was
                // after the round deadline.
                const status = slot?.status === 'missed'
                  ? 'missed'
                  : submittedAt
                    ? submittedAt.getTime() < dueAt.getTime()
                      ? 'early'
                      : submittedAt.getTime() > dueAt.getTime()
                        ? 'late'
                        : 'on_time'
                    : isPastDue && !lateAllowed ? 'missed' : 'pending';
                return { date, due_at: dueAt, submitted_at: slot?.submitted_at ?? null, status };
              }),
        })),
        overload: active.length >= threshold,
      };
    });
    return { overload_threshold: threshold, students };
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['student', 'files'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task; // ตอนนี้ guaranteed non-null
  }

  async update(
    id: string,
    data: UpdateTaskDto,
    files?: Express.Multer.File[], // รับไฟล์ใหม่จาก frontend
  ): Promise<Task> {
    const task = await this.findOne(id); // findOne already throws NotFoundException

    const {
      student_id,
      class_id,
      deadline,
      start_date,
      reminders,
      settings,
      assignment_student_ids,
      assignment_class_ids,
      ...rest
    } = data;

    // ถ้ามี student_id ให้ map ไปยัง relation
    if (student_id) {
      task.student = { id: student_id } as any;
    }

    if (class_id) {
      task.class = { id: class_id } as any;
    }

    // แปลง deadline/start_date ถ้าเป็น string ให้เป็น Date
    if (deadline) {
      task.deadline = new Date(deadline);
    }
    if (start_date) {
      task.start_date = new Date(start_date);
    }

    // Multipart bodies arrive as strings — normalize the same way create() does.
    const normalizedReminders = this.parseJsonMaybe(reminders);
    if (normalizedReminders !== undefined) task.reminders = normalizedReminders;

    const normalizedSettings = this.parseJsonMaybe(settings);
    if (normalizedSettings !== undefined) task.settings = normalizedSettings;

    const normalizedStudentIds = this.parseJsonArrayMaybe(assignment_student_ids);
    if (normalizedStudentIds !== undefined) task.assignment_student_ids = normalizedStudentIds;

    const normalizedClassIds = this.parseJsonArrayMaybe(assignment_class_ids);
    if (normalizedClassIds !== undefined) task.assignment_class_ids = normalizedClassIds;

    if (data.status === 'assigned') {
      const hasNextAssignment = this.hasAssignment({
        student_id: student_id ?? task.student?.id,
        class_id: class_id ?? task.class_id,
        normalizedStudentIds: normalizedStudentIds ?? task.assignment_student_ids,
        normalizedClassIds: normalizedClassIds ?? task.assignment_class_ids,
      });
      if (!hasNextAssignment)
        throw new BadRequestException('Task must be assigned to at least one student or class.');
      this.assertReadyForAssignment({
        name: data.name ?? task.name,
        description: data.description ?? task.description,
        subject: data.subject ?? task.subject,
        deadline: deadline ?? task.deadline,
        settings: normalizedSettings ?? task.settings,
      });
    }

    // update field อื่น ๆ (name, description, status, subject, difficulty,
    // estimated_time_minutes, points, assignment_mode, due_time, visibility, ...)
    Object.assign(task, rest);
    const updatedTask = await this.taskRepo.save(task);

    // ถ้ามีไฟล์ใหม่
    if (files?.length) {
      for (const file of files) {
        await this.fileService.create({
          module: 'task',
          task_id: updatedTask.id,
          file_path: file.path,
        });
      }
    }

    return updatedTask;
  }

  async delete(id: string): Promise<{ message: string }> {
    const task = await this.findOne(id); // findOne throws NotFoundException

    // 1️⃣ ดึงไฟล์ทั้งหมดที่เกี่ยวข้องกับ Task
    const files = await this.fileService.findByModuleAndOwner('task', id);

    // 2️⃣ ลบไฟล์ทั้งหมด (soft delete)
    for (const file of files) {
      await this.fileService.softDelete(file.id);
    }

    // 3️⃣ ลบ Task
    await this.taskRepo.remove(task);

    return { message: 'Task and its files deleted' };
  }
}
