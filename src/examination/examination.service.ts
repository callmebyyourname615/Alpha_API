import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Examination } from './examination.entity';
import { Subject } from '../subjects/subject.entity';
import { Admin } from '../admins/admin.entity';
import { Role } from '../roles/role.entity';
import { CreateExaminationDto } from './dto/create-examination.dto';
import { UpdateExaminationDto } from './dto/update-examination.dto';
import { NotificationsService } from '../notifications/notifications.service';
import * as fs from 'fs';

const RELATIONS = [
  'branch',
  'academicYear',
  'class',
  'subject',
  'subject.lessons',
  'subject.lessons.subjectType',
  'subject.lessons.yearLevel',
  'subject.lessons.curriculums',
  'createdBy',
  'checker',
  'superAdminRole',
];

// Super admin role levels (1 = Super Super Admin, 2 = Super admin)
const SUPER_ADMIN_MAX_LEVEL = 2;

@Injectable()
export class ExaminationService {
  constructor(
    @InjectRepository(Examination)
    private readonly examinationRepository: Repository<Examination>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    dto: CreateExaminationDto,
    files: { exam_file?: Express.Multer.File[]; answer_file?: Express.Multer.File[] },
  ): Promise<Examination> {
    const maxScore = Number(dto.maxScore ?? 100);
    const passScore = Number(dto.passScore ?? 50);

    if (passScore > maxScore) {
      throw new BadRequestException('pass_score cannot exceed max_score');
    }

    // Validate subject exists
    const subject = await this.subjectRepository.findOne({
      where: { id: dto.subjectId },
    });
    if (!subject) {
      throw new NotFoundException(`Subject ${dto.subjectId} not found`);
    }

    const superAdminRoleId =
      dto.superAdminRoleId ||
      (dto as any).super_admin_role_id ||
      (dto as any).roleId ||
      (dto as any).role_id ||
      null;

    if (superAdminRoleId) {
      const superAdminRole = await this.roleRepository.findOne({
        where: { id: superAdminRoleId, isDeleted: false },
      });
      if (!superAdminRole) {
        throw new NotFoundException(`Super admin role ${superAdminRoleId} not found`);
      }
    }

    const examDateTime = new Date(dto.examDate);
    const lockedUntil = new Date(examDateTime);
    lockedUntil.setDate(lockedUntil.getDate() + 5);

    const examination = this.examinationRepository.create({
      ...dto,
      maxScore,
      passScore,
      examFile: files.exam_file?.[0]?.path ?? null,
      answerFile: files.answer_file?.[0]?.path ?? null,
      checkerId: dto.checkerId ?? null,
      superAdminRoleId,
      checkerStatus: 'PENDING',
      superAdminStatus: 'PENDING',
      lockedUntil,
    });

    const saved = await this.examinationRepository.save(examination);

    // Send notifications asynchronously (don't block the response)
    this.sendExamNotifications(saved).catch(() => {/* silent — notification failure shouldn't break exam creation */});

    return this.findOne(saved.id);
  }

  private async sendExamNotifications(exam: Examination): Promise<void> {
    const examDate = new Date(exam.examDate);
    const dateStr = examDate.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    const title = `New examination: ${exam.title}`;
    const message = `You have been assigned to check "${exam.title}" on ${dateStr}.`;

    // Notify the assigned checker
    if (exam.checkerId) {
      await this.notificationsService.create({
        title,
        message,
        description: `You have been assigned to check the examination "${exam.title}".`,
        branch_id: exam.branchId,
        admin_id: exam.checkerId,
        module_id: exam.id,
        module_type: 'EXAMINATION',
      });
    }

  }

  private async sendSuperAdminApprovalRequestNotifications(exam: Examination): Promise<void> {
    const title = `Examination pending approval: ${exam.title}`;
    const message = `The checker has checked "${exam.title}". Please review and approve it.`;

    const superAdmins = await this.adminRepository
      .createQueryBuilder('admin')
      .innerJoin('admin.roles', 'role')
      .where('role.level <= :level', { level: SUPER_ADMIN_MAX_LEVEL })
      .andWhere('admin.is_deleted = false')
      .andWhere('admin.is_active = true')
      .getMany();

    for (const superAdmin of superAdmins) {
      if (superAdmin.id === exam.checkerId) continue;

      await this.notificationsService.create({
        title,
        message,
        description: `The examination "${exam.title}" is ready for Super admin approval.`,
        branch_id: exam.branchId,
        admin_id: superAdmin.id,
        module_id: exam.id,
        module_type: 'EXAMINATION',
      });
    }
  }

  private async sendExamApprovedNotification(exam: Examination): Promise<void> {
    if (!exam.checkerId) return;

    await this.notificationsService.create({
      title: `Examination approved: ${exam.title}`,
      message: `Super admin has approved "${exam.title}".`,
      description: `The examination "${exam.title}" has been approved and is ready for the next step.`,
      branch_id: exam.branchId,
      admin_id: exam.checkerId,
      module_id: exam.id,
      module_type: 'EXAMINATION',
    });
  }

  async findAll(): Promise<Examination[]> {
    return this.examinationRepository.find({
      where: { isDeleted: false },
      relations: RELATIONS,
      order: { examDate: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Examination> {
    const examination = await this.examinationRepository.findOne({
      where: { id, isDeleted: false },
      relations: RELATIONS,
    });

    if (!examination) {
      throw new NotFoundException(`Examination with ID ${id} not found`);
    }

    return examination;
  }

  async findByClass(classId: string): Promise<Examination[]> {
    return this.examinationRepository.find({
      where: { classId, isDeleted: false },
      relations: RELATIONS,
      order: { examDate: 'ASC' },
    });
  }

  async findByAcademicYear(academicYearId: string): Promise<Examination[]> {
    return this.examinationRepository.find({
      where: { academicYearId, isDeleted: false },
      relations: RELATIONS,
      order: { examDate: 'ASC' },
    });
  }

  async update(
    id: string,
    dto: UpdateExaminationDto,
    files: { exam_file?: Express.Multer.File[]; answer_file?: Express.Multer.File[] },
  ): Promise<Examination> {
    const examination = await this.findOne(id);

    const maxScore = Number(dto.maxScore ?? examination.maxScore);
    const passScore = Number(dto.passScore ?? examination.passScore);

    if (passScore > maxScore) {
      throw new BadRequestException('pass_score cannot exceed max_score');
    }

    // Validate subject if changed
    if (dto.subjectId && dto.subjectId !== examination.subjectId) {
      const subject = await this.subjectRepository.findOne({
        where: { id: dto.subjectId },
      });
      if (!subject) {
        throw new NotFoundException(`Subject ${dto.subjectId} not found`);
      }
    }

    // Replace old exam file if new one uploaded
    if (files.exam_file?.[0]) {
      if (examination.examFile && fs.existsSync(examination.examFile)) {
        fs.unlinkSync(examination.examFile);
      }
      examination.examFile = files.exam_file[0].path;
    }

    // Replace old answer file if new one uploaded
    if (files.answer_file?.[0]) {
      if (examination.answerFile && fs.existsSync(examination.answerFile)) {
        fs.unlinkSync(examination.answerFile);
      }
      examination.answerFile = files.answer_file[0].path;
    }

    const shouldResendToChecker =
      examination.checkerStatus === 'REJECTED' ||
      examination.superAdminStatus === 'REJECTED';

    Object.assign(examination, dto);

    if (shouldResendToChecker) {
      examination.checkerStatus = 'PENDING';
      examination.superAdminStatus = 'PENDING';
      examination.checkerRejectComment = null;
      examination.superAdminRejectComment = null;
    }

    await this.examinationRepository.save(examination);
    if (shouldResendToChecker) {
      this.sendExamNotifications(examination).catch(() => {/* silent — notification failure shouldn't break update */});
    }
    return this.findOne(id);
  }

  async check(id: string): Promise<Examination> {
    const examination = await this.findOne(id);
    examination.checkerStatus = 'CHECKED';
    examination.superAdminStatus = 'PENDING';
    examination.checkerRejectComment = null;
    await this.examinationRepository.save(examination);
    this.sendSuperAdminApprovalRequestNotifications(examination).catch(() => {/* silent — notification failure shouldn't break check */});
    return this.findOne(id);
  }

  async reject(id: string, comment?: string): Promise<Examination> {
    const examination = await this.findOne(id);
    const rejectComment = String(comment || '').trim();

    if (examination.checkerStatus === 'CHECKED') {
      examination.superAdminStatus = 'REJECTED';
      examination.superAdminRejectComment = rejectComment || null;
    } else {
      examination.checkerStatus = 'REJECTED';
      examination.checkerRejectComment = rejectComment || null;
      examination.superAdminStatus = 'PENDING';
    }

    await this.examinationRepository.save(examination);
    return this.findOne(id);
  }

  async approve(id: string): Promise<Examination> {
    const examination = await this.findOne(id);
    examination.checkerStatus = 'CHECKED';
    examination.superAdminStatus = 'APPROVED';
    examination.superAdminRejectComment = null;
    examination.lockedUntil = null;
    await this.examinationRepository.save(examination);
    this.sendExamApprovedNotification(examination).catch(() => {/* silent — notification failure shouldn't break approve */});
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const examination = await this.findOne(id);
    examination.isDeleted = true;
    await this.examinationRepository.save(examination);
    return { message: `Examination #${id} deleted successfully` };
  }
}
