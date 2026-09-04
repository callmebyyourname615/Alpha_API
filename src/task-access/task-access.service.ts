import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Task } from '../task/task.entity';
import { Class } from '../classes/class.entity';
import { Enrollment } from '../enrollments/enrollment.entity';

const normalizeId = (value: unknown) => String(value ?? '').trim();

@Injectable()
export class TaskAccessService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
  ) {}

  async assertAdminCanMutateTask(taskId: string | null | undefined, adminId: string | null | undefined) {
    const normalizedTaskId = normalizeId(taskId);
    const normalizedAdminId = normalizeId(adminId);
    if (!normalizedTaskId || !normalizedAdminId) return;

    if (await this.isHomeroomViewerTask(normalizedTaskId, normalizedAdminId)) {
      throw new ForbiddenException('Homeroom teacher has viewer-only access to this task');
    }
  }

  async isHomeroomViewerTask(taskId: string, adminId: string) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['student', 'class'],
    });
    if (!task) throw new NotFoundException('Task not found');

    const normalizedAdminId = normalizeId(adminId);
    if (!normalizedAdminId) return false;
    if (normalizeId(task.added_by_id) === normalizedAdminId) return false;

    const homeroomClassIds = await this.getHomeroomClassIds(normalizedAdminId);
    if (!homeroomClassIds.size) return false;

    const taskClassIds = this.getTaskClassIds(task);
    if (taskClassIds.some((classId) => homeroomClassIds.has(classId))) return true;

    const taskStudentIds = this.getTaskStudentIds(task);
    if (!taskStudentIds.length) return false;

    const homeroomStudentIds = await this.getHomeroomStudentIds(homeroomClassIds);
    return taskStudentIds.some((studentId) => homeroomStudentIds.has(studentId));
  }

  private async getHomeroomClassIds(adminId: string) {
    const classes = await this.classRepo.find({ where: { homeroom_teacher_id: adminId } });
    return new Set(
      classes
        .filter((schoolClass) => schoolClass.is_deleted !== true)
        .map((schoolClass) => normalizeId(schoolClass.id))
        .filter(Boolean),
    );
  }

  private async getHomeroomStudentIds(classIds: Set<string>) {
    const ids = [...classIds];
    if (!ids.length) return new Set<string>();

    const enrollments = await this.enrollmentRepo.find({
      where: { classId: In(ids), is_active: true },
    });
    return new Set(enrollments.map((enrollment) => normalizeId(enrollment.studentId)).filter(Boolean));
  }

  private getTaskClassIds(task: Task) {
    return [
      ...(Array.isArray(task.assignment_class_ids) ? task.assignment_class_ids : []),
      task.class_id,
      task.class?.id,
    ].map(normalizeId).filter(Boolean);
  }

  private getTaskStudentIds(task: Task) {
    return [
      ...(Array.isArray(task.assignment_student_ids) ? task.assignment_student_ids : []),
      task.student?.id,
    ].map(normalizeId).filter(Boolean);
  }
}
