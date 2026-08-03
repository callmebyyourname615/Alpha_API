import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  StudentLinkRequest,
  StudentLinkRequestStatus,
} from './student-link-request.entity';
import { Student } from '../students/student.entity';
import { Parent } from '../parents/parent.entity';
import { StudentsService } from '../students/student.service';

@Injectable()
export class StudentLinkRequestsService {
  constructor(
    @InjectRepository(StudentLinkRequest)
    private readonly repo: Repository<StudentLinkRequest>,

    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,

    @InjectRepository(Parent)
    private readonly parentRepo: Repository<Parent>,

    private readonly studentsService: StudentsService,
  ) {}

  // ─── Create (parent scans a student's QR) ─────────────────────────────
  async create(dto: {
    studentId: string;
    parentId: string;
  }): Promise<StudentLinkRequest> {
    const student = await this.studentRepo.findOne({
      where: { id: dto.studentId, is_deleted: false },
      relations: ['parents'],
    });
    if (!student) throw new NotFoundException('Student not found');

    const parent = await this.parentRepo.findOne({
      where: { id: dto.parentId },
    });
    if (!parent) throw new NotFoundException('Parent not found');

    const alreadyLinked = (student.parents ?? []).some(
      (p) => p.id === dto.parentId,
    );
    if (alreadyLinked) {
      throw new ConflictException(
        'This student is already linked to your account.',
      );
    }

    const existingPending = await this.repo.findOne({
      where: {
        studentId: dto.studentId,
        parentId: dto.parentId,
        status: StudentLinkRequestStatus.PENDING,
        isDeleted: false,
      },
    });
    if (existingPending) {
      throw new ConflictException(
        'A request to link this student is already pending review.',
      );
    }

    const request = this.repo.create({
      studentId: dto.studentId,
      parentId: dto.parentId,
      status: StudentLinkRequestStatus.PENDING,
    });
    const saved = await this.repo.save(request);
    // Re-fetch with relations so the caller (the scanning parent's app) can
    // show the student's name immediately without a second round trip.
    return this.findOne(saved.id);
  }

  // ─── Read ──────────────────────────────────────────────────────────────
  async findPending(): Promise<StudentLinkRequest[]> {
    return this.repo.find({
      where: { status: StudentLinkRequestStatus.PENDING, isDeleted: false },
      relations: ['student', 'parent'],
      order: { createdAt: 'ASC' },
    });
  }

  async findForParent(
    parentId: string,
    status?: StudentLinkRequestStatus,
  ): Promise<StudentLinkRequest[]> {
    if (!parentId) throw new BadRequestException('parentId is required');
    return this.repo.find({
      where: {
        parentId,
        ...(status ? { status } : {}),
        isDeleted: false,
      },
      relations: ['student', 'parent'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<StudentLinkRequest> {
    const request = await this.repo.findOne({
      where: { id },
      relations: ['student', 'parent'],
    });
    if (!request) throw new NotFoundException('Link request not found');
    return request;
  }

  /// Lets the scanning parent's app poll for the outcome without needing an
  /// id (they only know studentId/parentId at scan time).
  async findLatestForParentAndStudent(
    parentId: string,
    studentId: string,
  ): Promise<StudentLinkRequest | null> {
    return this.repo.findOne({
      where: { parentId, studentId, isDeleted: false },
      relations: ['student', 'parent'],
      order: { createdAt: 'DESC' },
    });
  }

  // ─── Review ────────────────────────────────────────────────────────────
  async approve(id: string, reviewerId?: string): Promise<StudentLinkRequest> {
    const request = await this.findOne(id);
    if (request.status !== StudentLinkRequestStatus.PENDING) {
      throw new BadRequestException('This request has already been reviewed.');
    }

    const student = await this.studentRepo.findOne({
      where: { id: request.studentId },
      relations: ['parents'],
    });
    if (!student) throw new NotFoundException('Student not found');

    // linkParents() replaces the whole parents list, so union the existing
    // ids with the new one rather than overwriting the other guardian(s).
    const existingParentIds = (student.parents ?? []).map((p) => p.id);
    const nextParentIds = existingParentIds.includes(request.parentId)
      ? existingParentIds
      : [...existingParentIds, request.parentId];
    await this.studentsService.linkParents(request.studentId, nextParentIds);

    request.status = StudentLinkRequestStatus.APPROVED;
    request.reviewedBy = reviewerId ?? null;
    request.reviewedAt = new Date();
    return this.repo.save(request);
  }

  async reject(
    id: string,
    reviewerId?: string,
    reason?: string,
  ): Promise<StudentLinkRequest> {
    const request = await this.findOne(id);
    if (request.status !== StudentLinkRequestStatus.PENDING) {
      throw new BadRequestException('This request has already been reviewed.');
    }

    request.status = StudentLinkRequestStatus.REJECTED;
    request.reviewedBy = reviewerId ?? null;
    request.reviewedAt = new Date();
    request.rejectionReason = (reason ?? '').trim() || null;
    return this.repo.save(request);
  }
}
