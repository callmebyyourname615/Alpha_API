import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../task/task.entity';
import { TaskSubmission } from '../task-submission/task-submission.entity';
import { TaskSubmissionAttempt } from '../task-submission/task-submission-attempt.entity';
import { Comment, ModuleType } from '../comments/comments.entity';
import { Notification } from '../notifications/notification.entity';
import { TaskSubmissionSlot } from '../task-submission/task-submission-slot.entity';

export type TaskActivityCategory = 'task' | 'submission' | 'message' | 'notification';

export interface TaskActivityEntry {
  id: string;
  category: TaskActivityCategory;
  title: string;
  description: string;
  actor_id: string | null;
  actor_type: string | null;
  created_at: Date;
}

@Injectable()
export class TaskActivityService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,

    @InjectRepository(TaskSubmission)
    private readonly submissionRepo: Repository<TaskSubmission>,

    @InjectRepository(TaskSubmissionAttempt)
    private readonly attemptRepo: Repository<TaskSubmissionAttempt>,

    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,

    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,

    @InjectRepository(TaskSubmissionSlot)
    private readonly slotRepo: Repository<TaskSubmissionSlot>,
  ) {}

  // No dedicated audit-log table: the timeline is derived from the task
  // itself plus every module that already references it (submissions,
  // chat messages, reminder notifications) so it can never drift out of
  // sync with what actually happened.
  async getTimeline(taskId: string): Promise<TaskActivityEntry[]> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    const [submissions, attempts, slots, comments, notifications] = await Promise.all([
      this.submissionRepo.find({ where: { task_id: taskId } }),
      this.attemptRepo.find({ where: { task_id: taskId }, order: { submitted_at: 'DESC' } }),
      this.slotRepo.find({ where: { task_id: taskId }, order: { schedule_index: 'ASC' } }),
      this.commentRepo.find({ where: { module_type: ModuleType.TASK, module_id: taskId } }),
      this.notificationRepo.find({ where: { module_id: taskId, module_type: 'TASK', is_deleted: false } }),
    ]);

    const entries: TaskActivityEntry[] = [];

    entries.push({
      id: `task-created-${task.id}`,
      category: 'task',
      title: 'Task Created',
      description: `"${task.name}" was created`,
      actor_id: task.added_by_id ?? null,
      actor_type: task.added_by_type ?? null,
      created_at: task.created_at,
    });

    if (task.updated_at && task.updated_at.getTime() !== task.created_at.getTime()) {
      entries.push({
        id: `task-updated-${task.id}`,
        category: 'task',
        title: 'Task Updated',
        description: `"${task.name}" details were updated`,
        actor_id: task.added_by_id ?? null,
        actor_type: task.added_by_type ?? null,
        created_at: task.updated_at,
      });
    }

    const studentsWithPlannedSlots = new Set(slots.map((slot) => slot.student_id));
    attempts.forEach((attempt) => {
      if (studentsWithPlannedSlots.has(attempt.student_id)) return;
      entries.push({
        id: `submission-attempt-${attempt.id}`,
        category: 'submission',
        title: `Submission #${attempt.submission_number}`,
        description: attempt.submission_number === 1 ? 'File submitted for review' : 'Additional file submitted for review',
        actor_id: attempt.student_id,
        actor_type: 'student',
        created_at: attempt.submitted_at,
      });
    });

    slots.forEach((slot) => {
      if (slot.submitted_at) {
        entries.push({
          id: `submission-round-${slot.id}`,
          category: 'submission',
          title: `Round #${slot.schedule_index} submitted`,
          description: slot.status === 'late' ? 'Submitted after the deadline' : 'Submitted for review',
          actor_id: slot.submitted_by_id ?? slot.student_id,
          actor_type: slot.submitted_by_type ?? 'student',
          created_at: slot.submitted_at,
        });
      }
      if (slot.reviewed_at) {
        const score = slot.score != null ? ` · scored ${slot.score}/${slot.max_score ?? ''}` : '';
        const progress = slot.progress_pct != null ? `Progress ${slot.progress_pct}%${score}` : score ? score.slice(3) : 'Feedback published';
        entries.push({
          id: `submission-round-${slot.id}-reviewed`,
          category: 'submission',
          title: `Round #${slot.schedule_index} feedback`,
          description: progress,
          actor_id: slot.reviewed_by_id ?? null,
          actor_type: 'admin',
          created_at: slot.reviewed_at,
        });
      }
    });

    submissions.forEach((s) => {
      // Keep the original timeline entry for submissions made before attempt
      // tracking was introduced. New uploads are represented by attempts.
      if (s.submitted_at && !studentsWithPlannedSlots.has(s.student_id)) {
        entries.push({
          id: `submission-${s.id}-submitted`,
          category: 'submission',
          title: 'New Submission',
          description: 'File submitted for review',
          actor_id: s.student_id,
          actor_type: 'student',
          created_at: s.submitted_at,
        });
      }
      if (s.reviewed_at && !studentsWithPlannedSlots.has(s.student_id)) {
        entries.push({
          id: `submission-${s.id}-reviewed`,
          category: 'submission',
          title: 'Teacher Feedback',
          description: s.feedback ? s.feedback : `Submission reviewed${s.score != null ? ` — scored ${s.score}/${s.max_score ?? ''}` : ''}`,
          actor_id: s.reviewed_by_id ?? null,
          actor_type: s.reviewed_by_type ?? null,
          created_at: s.reviewed_at,
        });
      }
    });

    comments.forEach((c) => {
      entries.push({
        id: `message-${c.id}`,
        category: 'message',
        title: 'New Message',
        description: c.comment || '',
        actor_id: c.auditor_id,
        actor_type: c.auditor_type,
        created_at: c.created_at,
      });
    });

    notifications.forEach((n) => {
      entries.push({
        id: `notification-${n.id}`,
        category: 'notification',
        title: n.title || 'Reminder Sent',
        description: n.message || n.description || 'A reminder was sent',
        actor_id: n.admin_id ?? null,
        actor_type: 'admin',
        created_at: n.created_at,
      });
    });

    entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return entries;
  }
}
