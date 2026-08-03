import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment, AuditorType, ModuleType } from './comments.entity';
import { CommentReaction } from './comment-reaction.entity';
import { Parent } from '../parents/parent.entity';
import { Task } from '../task/task.entity';
import { EventActivity } from '../eventactivity/eventActivity.entity';
import { File } from '../file/files.entity';
import { Announcement } from '../announcements/announcement.entity';
import { Admin } from '../admins/admin.entity';

export interface ToggleReactionDto {
  auditor_id: string;
  auditor_type: AuditorType;
  emoji: string;
}

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepo: Repository<Comment>,

    @InjectRepository(CommentReaction)
    private reactionRepo: Repository<CommentReaction>,

    @InjectRepository(Admin)
    private adminRepo: Repository<Admin>,

    @InjectRepository(Parent)
    private parentRepo: Repository<Parent>,

    @InjectRepository(Task)
    private taskRepo: Repository<Task>,

    @InjectRepository(Event)
    private eventRepo: Repository<Event>,

    @InjectRepository(EventActivity)
    private eventActivityRepo: Repository<EventActivity>,

    @InjectRepository(File)
    private fileRepo: Repository<File>,

    @InjectRepository(Announcement)
    private announcementRepo: Repository<Announcement>,
  ) {}

  // Create comment
  async create(dto: CreateCommentDto) {
    // ตรวจสอบ auditor
    if (dto.auditor_type === AuditorType.ADMIN) {
      const admin = await this.adminRepo.findOne({ where: { id: dto.auditor_id } });
      if (!admin) throw new NotFoundException('Admin not found');
    } else if (dto.auditor_type === AuditorType.PARENT) {
      const parent = await this.parentRepo.findOne({ where: { id: dto.auditor_id } });
      if (!parent) throw new NotFoundException('Parent not found');
    }

    // ตรวจสอบ module
    if (dto.module_type === ModuleType.TASK) {
      const task = await this.taskRepo.findOne({ where: { id: dto.module_id } as any });
      if (!task) throw new NotFoundException('Task not found');
    } else if (dto.module_type === ModuleType.EVENT) {
      const event = await this.eventRepo.findOne({ where: { id: dto.module_id } as any });
      if (!event) throw new NotFoundException('Event not found');
    } else if (dto.module_type === ModuleType.EVENT_ACTIVITY) {
      const activity = await this.eventActivityRepo.findOne({ where: { id: dto.module_id } as any });
      if (!activity) throw new NotFoundException('Event Activity not found');
    } else if (dto.module_type === ModuleType.ANNOUNCEMENT) {
      const announcement = await this.announcementRepo.findOne({ where: { id: dto.module_id } as any });
      if (!announcement) throw new NotFoundException('Announcement not found');
    }

    // สร้าง comment
    const comment = this.commentRepo.create({
      comment: dto.comment,
      auditor_id: dto.auditor_id,
      auditor_type: dto.auditor_type,
      module_id: dto.module_id, // string
      module_type: dto.module_type,
      student_id: dto.module_type === ModuleType.TASK ? dto.student_id || null : null,
      reply_to_id: dto.reply_to_id || null,
    });

    return this.commentRepo.save(comment);
  }

  async update(id: string, dto: Partial<CreateCommentDto>) {
    const comment = await this.commentRepo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');

    if (dto.comment !== undefined) comment.comment = dto.comment;
    if (dto.auditor_id !== undefined) comment.auditor_id = dto.auditor_id;
    if (dto.auditor_type !== undefined) comment.auditor_type = dto.auditor_type;
    if (dto.module_id !== undefined) comment.module_id = dto.module_id;
    if (dto.module_type !== undefined) comment.module_type = dto.module_type;

    return this.commentRepo.save(comment);
  }

 async findAll(module_type?: ModuleType, module_id?: string, student_id?: string) {
  const query = this.commentRepo.createQueryBuilder('comment');

  if (module_type) {
    query.andWhere('comment.module_type = :module_type', { module_type });
  }

  if (module_id) {
    query.andWhere('comment.module_id = :module_id', { module_id });
  }

  if (student_id) {
    query.andWhere('comment.student_id = :student_id', { student_id });
  }

  query.orderBy('comment.created_at', 'ASC');

  const comments = await query.getMany();

  // Fetch auditor info for each comment
  const enrichedComments = await Promise.all(
    comments.map(async (comment) => {
      let auditor: any = null;
      if (comment.auditor_type === AuditorType.ADMIN) {
        auditor = await this.adminRepo.findOne({ 
          where: { id: comment.auditor_id },
          select: ['id', 'username', 'first_name', 'last_name', 'profile_pic']
        });
      } else if (comment.auditor_type === AuditorType.PARENT) {
        auditor = await this.parentRepo.findOne({ 
          where: { id: comment.auditor_id },
          select: ['id', 'firstName_lao', 'firstName_eng', 'lastName_lao', 'lastName_eng', 'profilePictureUrl']
        });
      }
      return { ...comment, auditor };
    })
  );

  // Fetch images for each comment
  const withImages = await Promise.all(
    enrichedComments.map(async (comment) => {
      const files = await this.fileRepo.find({
        where: { comment_id: comment.id, is_deleted: false },
      });
      const images = files.map((f) => f.file_path);
      return { ...comment, images };
    })
  );

  // Fetch reactions for each comment, grouped by emoji with counts
  const withReactions = await Promise.all(
    withImages.map(async (comment) => {
      const reactions = await this.reactionRepo.find({ where: { comment_id: comment.id } });
      const grouped = new Map<string, { emoji: string; count: number; auditor_ids: string[] }>();
      reactions.forEach((r) => {
        const entry = grouped.get(r.emoji) || { emoji: r.emoji, count: 0, auditor_ids: [] };
        entry.count += 1;
        entry.auditor_ids.push(r.auditor_id);
        grouped.set(r.emoji, entry);
      });
      return { ...comment, reactions: [...grouped.values()] };
    })
  );

  // Attach a lightweight snippet of the message being replied to, if any,
  // so the frontend can render a quoted preview without another round trip.
  const byId = new Map(enrichedComments.map((c) => [c.id, c]));
  const withReplies = withReactions.map((comment) => {
    const original = comment.reply_to_id ? byId.get(comment.reply_to_id) : null;
    const reply_to = original
      ? {
          id: original.id,
          comment: original.comment,
          auditor_type: original.auditor_type,
          auditor: original.auditor,
        }
      : null;
    return { ...comment, reply_to };
  });

  return withReplies;
}

async toggleReaction(commentId: string, dto: ToggleReactionDto) {
  const comment = await this.commentRepo.findOne({ where: { id: commentId } });
  if (!comment) throw new NotFoundException('Comment not found');

  const existing = await this.reactionRepo.findOne({
    where: {
      comment_id: commentId,
      auditor_id: dto.auditor_id,
      auditor_type: dto.auditor_type,
      emoji: dto.emoji,
    },
  });

  if (existing) {
    await this.reactionRepo.remove(existing);
    return { toggled: 'off' };
  }

  const reaction = this.reactionRepo.create({
    comment_id: commentId,
    auditor_id: dto.auditor_id,
    auditor_type: dto.auditor_type,
    emoji: dto.emoji,
  });
  await this.reactionRepo.save(reaction);
  return { toggled: 'on' };
}

async getReactions(commentId: string) {
  return this.reactionRepo.find({ where: { comment_id: commentId } });
}

  async findOne(id: string) {
    const comment = await this.commentRepo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  async remove(id: string) {
    const comment = await this.findOne(id);
    return this.commentRepo.remove(comment);
  }
}
