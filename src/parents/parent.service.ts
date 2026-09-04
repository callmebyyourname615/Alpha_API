import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parent } from './parent.entity';
import { Student } from '../students/student.entity';
import * as bcrypt from 'bcrypt';
import { CreateParentDto } from './dto/CreateParentDto';
import { UpdateParentDto } from './dto/UpdateParentDto';
import { CacheService } from '../common/cache.service';

const resolveBranchId = (dto: Pick<CreateParentDto, 'branch_id' | 'branchId'>) =>
  (dto.branch_id ?? dto.branchId ?? '').toString().trim() || null;

@Injectable()
export class ParentService {
  constructor(
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly cache: CacheService,
  ) {}

  private readonly parentListTtlSeconds = 60;
  private readonly parentDetailTtlSeconds = 120;

  async create(dto: CreateParentDto): Promise<Parent> {
    let passwordHash: string | undefined;

    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const parent = this.parentRepository.create({
      branchId: resolveBranchId(dto),
      email: dto.email,
      username: dto.username,
      passwordHash,

      firstName_lao: dto.first_name_lao,
      firstName_eng: dto.first_name_eng,
      midleName_lao: dto.midle_name_lao,
      midleName_eng: dto.midle_name_eng,
      lastName_lao: dto.last_name_lao,
      lastName_eng: dto.last_name_eng,
      nickname: dto.nickname,

      dateOfBirth: dto.dob,
      gender: dto.gender,

      nationality: dto.nationality,
      ethnicity: dto.ethnicity,
      religion: dto.religion,

      family_book_number: dto.family_book_number,
      family_book_url: dto.family_book_url ?? null,

      idCard_no: dto.idCard_no,
      id_card_url: dto.id_card ?? dto.id_card_url,

      passport_number: dto.passport_number,
      passport_image_url: dto.passport_image_url,

      education_level: dto.education_level,
      relation_type: dto.relation_type,

      phone: dto.phone,
      mobile_phone: dto.mobile_phone,

      village: dto.village,
      district: dto.district,
      province: dto.province,

      home_number: dto.home_number,
      home_unit: dto.home_unit,
      home_address: dto.home_address,

      home_picture_url: dto.home_picture_url,

      work_province: dto.work_province,
      work_district: dto.work_district,
      work_village: dto.work_village,

      occupation: dto.occupation,
      company_name: dto.company_name,

      profilePictureUrl: dto.profile_pic,

      isActive: false,
      approvalStatus: 'pending',
      rejectedAt: null,
    });

    const saved = await this.parentRepository.save(parent);
    await this.clearParentCache(saved.id);
    return saved;
  }

  async update(id: string, dto: UpdateParentDto): Promise<Parent> {
    const parent = await this.findOneUncached(id);

    if (dto.password) {
      parent.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (dto.branch_id !== undefined || dto.branchId !== undefined) {
      parent.branchId = resolveBranchId(dto);
    }

    if (dto.first_name_lao !== undefined) parent.firstName_lao = dto.first_name_lao;
    if (dto.first_name_eng !== undefined) parent.firstName_eng = dto.first_name_eng;
    if (dto.midle_name_lao !== undefined) parent.midleName_lao = dto.midle_name_lao;
    if (dto.midle_name_eng !== undefined) parent.midleName_eng = dto.midle_name_eng;
    if (dto.last_name_lao !== undefined) parent.lastName_lao = dto.last_name_lao;
    if (dto.last_name_eng !== undefined) parent.lastName_eng = dto.last_name_eng;
    if (dto.dob !== undefined) parent.dateOfBirth = dto.dob;
    if (dto.gender !== undefined) parent.gender = dto.gender;
    if (dto.nationality !== undefined) parent.nationality = dto.nationality;
    if (dto.ethnicity !== undefined) parent.ethnicity = dto.ethnicity;
    if (dto.religion !== undefined) parent.religion = dto.religion;
    if (dto.phone !== undefined) parent.phone = dto.phone;
    if (dto.mobile_phone !== undefined) parent.mobile_phone = dto.mobile_phone;
    if (dto.village !== undefined) parent.village = dto.village;
    if (dto.district !== undefined) parent.district = dto.district;
    if (dto.province !== undefined) parent.province = dto.province;
    if (dto.home_address !== undefined) parent.home_address = dto.home_address;
    if (dto.work_province !== undefined)
      parent.work_province = dto.work_province;
    if (dto.work_district !== undefined)
      parent.work_district = dto.work_district;
    if (dto.work_village !== undefined) parent.work_village = dto.work_village;
    if (dto.occupation !== undefined) parent.occupation = dto.occupation;
    if (dto.company_name !== undefined) parent.company_name = dto.company_name;
    if (dto.email !== undefined) parent.email = dto.email;
    if (dto.username !== undefined) parent.username = dto.username;
    if (dto.profile_pic !== undefined)
      parent.profilePictureUrl = dto.profile_pic;
    if (dto.id_card !== undefined) {
      parent.id_card_url = dto.id_card;
    }
    if (dto.home_picture_url !== undefined)
      parent.home_picture_url = dto.home_picture_url;
    if (dto.family_book_url !== undefined)
      parent.family_book_url = dto.family_book_url;

    if (dto.relation_type !== undefined)
      parent.relation_type = dto.relation_type;

    if (dto.is_active !== undefined) {
      const activeBool = typeof dto.is_active === 'boolean'
        ? dto.is_active
        : String(dto.is_active).trim().toLowerCase() === 'true';
      parent.isActive = activeBool;
      if (dto.approval_status === undefined) {
        parent.approvalStatus = activeBool ? 'approved' : 'pending';
        parent.rejectedAt = null;
      }
    }

    if (dto.approval_status !== undefined) {
      parent.approvalStatus = dto.approval_status;
      parent.isActive = dto.approval_status === 'approved';
      parent.rejectedAt = dto.approval_status === 'rejected' ? new Date() : null;
      if (dto.approval_status === 'rejected') {
        parent.rejectReason = (dto.reject_reason ?? '').trim() || null;
      } else {
        parent.rejectReason = null;
      }
    } else if (dto.reject_reason !== undefined) {
      parent.rejectReason = dto.reject_reason.trim() || null;
    }

    if (dto.nickname !== undefined) parent.nickname = dto.nickname;

    if (dto.family_book_number !== undefined)
      parent.family_book_number = dto.family_book_number;

    if (dto.idCard_no !== undefined) parent.idCard_no = dto.idCard_no;

    if (dto.passport_number !== undefined)
      parent.passport_number = dto.passport_number;

    if (dto.education_level !== undefined)
      parent.education_level = dto.education_level;

    if (dto.home_number !== undefined) parent.home_number = dto.home_number;

    if (dto.home_unit !== undefined) parent.home_unit = dto.home_unit;

    if (dto.passport_image_url !== undefined)
      parent.passport_image_url = dto.passport_image_url;

    if (parent.isActive) {
      parent.approvalStatus = 'approved';
      parent.rejectedAt = null;
      parent.rejectReason = null;
    } else if (parent.approvalStatus === 'approved') {
      parent.isActive = true;
      parent.rejectedAt = null;
      parent.rejectReason = null;
    }

    const saved = await this.parentRepository.save(parent);

    if (dto.is_active !== undefined) {
      const activeBool = typeof dto.is_active === 'boolean'
        ? dto.is_active
        : String(dto.is_active).trim().toLowerCase() === 'true';
      await this.studentRepository
        .createQueryBuilder()
        .update(Student)
        .set({ is_active: activeBool })
        .where(
          `id IN (SELECT student_id FROM student_parents WHERE parent_id = :pid)`,
          { pid: id },
        )
        .execute();
      await this.clearStudentCache();
    }

    await this.clearParentCache(id);
    return saved;
  }

  async findAll(branchId?: string): Promise<Parent[]> {
    const normalizedBranchId = branchId?.trim();
    return this.cache.getOrSet(
      `parents:all:branch:${normalizedBranchId || 'all'}`,
      this.parentListTtlSeconds,
      async () => {
        const parents = await this.parentRepository.find({
          where: {
            isDeleted: false,
            ...(normalizedBranchId ? { branchId: normalizedBranchId } : {}),
          },
          relations: ['branch'],
          order: { createdAt: 'DESC' },
        });
        await this.attachRoles(parents);
        return parents;
      },
    );
  }

  async findOne(id: string): Promise<Parent> {
    return this.cache.getOrSet(
      `parents:${id}`,
      this.parentDetailTtlSeconds,
      () => this.findOneUncached(id),
    );
  }

  private async findOneUncached(id: string): Promise<Parent> {
    const parent = await this.parentRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['roles', 'branch'],
    });

    if (!parent) {
      throw new NotFoundException(`Parent with ID ${id} not found`);
    }

    return parent;
  }

  private async attachRoles(parents: Parent[]) {
    if (!parents.length) return;

    const parentIds = parents.map((parent) => parent.id);
    const parentsWithRoles = await this.parentRepository
      .createQueryBuilder('parent')
      .leftJoinAndSelect('parent.roles', 'role')
      .select('parent.id')
      .addSelect('role')
      .where('parent.id IN (:...parentIds)', { parentIds })
      .getMany();

    const rolesByParentId = new Map(
      parentsWithRoles.map((parent) => [parent.id, parent.roles ?? []]),
    );

    for (const parent of parents) {
      parent.roles = rolesByParentId.get(parent.id) ?? [];
    }
  }

  async softDelete(id: string): Promise<{ message: string }> {
    const parent = await this.findOneUncached(id);
    parent.isDeleted = true;
    parent.isActive = false;
    await this.parentRepository.save(parent);
    await this.clearParentCache(id);
    await this.clearStudentCache();
    return { message: 'Parent soft deleted successfully' };
  }

  private async clearParentCache(id?: string): Promise<void> {
    await this.cache.delPattern('parents:*');
    if (id) await this.cache.del(`parents:${id}`);
  }

  private async clearStudentCache(): Promise<void> {
    await this.cache.delPattern('students:*');
  }
}
