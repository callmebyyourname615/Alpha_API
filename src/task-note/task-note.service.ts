import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskNote } from './task-note.entity';
import { CreateTaskNoteDto } from './dto/create-task-note.dto';
import { UpdateTaskNoteDto } from './dto/update-task-note.dto';

@Injectable()
export class TaskNoteService {
  constructor(
    @InjectRepository(TaskNote)
    private readonly repo: Repository<TaskNote>,
  ) {}

  // Notes are private: only the authoring admin's notes are ever returned.
  async findForAdmin(taskId: string, adminId: string): Promise<TaskNote[]> {
    return this.repo.find({
      where: { task_id: taskId, admin_id: adminId },
      order: { created_at: 'DESC' },
    });
  }

  async create(dto: CreateTaskNoteDto): Promise<TaskNote> {
    const note = this.repo.create(dto);
    return this.repo.save(note);
  }

  async update(id: string, dto: UpdateTaskNoteDto): Promise<TaskNote> {
    const note = await this.repo.findOne({ where: { id } });
    if (!note) throw new NotFoundException('Task note not found');
    note.note = dto.note;
    return this.repo.save(note);
  }

  async delete(id: string): Promise<{ message: string }> {
    const note = await this.repo.findOne({ where: { id } });
    if (!note) throw new NotFoundException('Task note not found');
    await this.repo.remove(note);
    return { message: 'Task note deleted' };
  }
}
