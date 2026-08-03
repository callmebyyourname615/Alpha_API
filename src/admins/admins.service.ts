import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { Admin } from './admin.entity';
import { Role } from '../roles/role.entity';
import { Branch } from '../branches/branch.entity';
import { CreateAdminDto, UpdateAdminDto } from './dto/create-admin.dto';
import {
  HistoryWork,
  EducationLevel,
  EmergencyWith,
  BosInfo,
  FamilyInfo,
  OtherRestriction,
} from './admin.entity';

// =========================
// RESPONSE DTO
// =========================

export class AdminResponseDto {
  id: string;
  username: string;
  email: string;

  // Basic info
  first_name?: string | null;
  last_name?: string | null;
  first_name_La?: string | null;
  last_name_La?: string | null;
  middle_name?: string | null;
  phone?: string | null;
  tell?: string | null;
  gender?: string | null;
  dob?: string | null;
  join_date?: string | null;

  nationality?: string | null;
  ethnicity?: string | null;
  religion?: string | null;

  id_card_number?: string | null;
  id_card_image?: string | null;
  passport_number?: string | null;
  passport_image?: string | null;
  current_status?: string | null;
  

  // Address
  notes?: string | null;
  village?: string | null;
  district?: string | null;
  province?: string | null;
  birth_village?: string | null;
  birth_district?: string | null;
  birth_province?: string | null;
  home_address?: string | null;
  home_picture_url?: string | null;
  current_academic_year?: string | null;
  profile_pic?: string | null;

  // JSONB arrays
  history_work: HistoryWork[];
  education_level: EducationLevel[];
  emergency_with: EmergencyWith[];
  bos_info: BosInfo[];
  family_info: FamilyInfo[];
  other_restriction: OtherRestriction;

  // Status
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;

  // Relations
  roles: { id: string; name: string; level: number }[];
  branch?: { id: string; name: string | null } | null;
}

// =========================
// SERVICE
// =========================

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

  // ─── CREATE ──────────────────────────────────────────────────────────────
  async create(dto: CreateAdminDto): Promise<AdminResponseDto> {
    if (!dto.username || !dto.email || !dto.password) {
      throw new BadRequestException(
        'username, email, and password are required',
      );
    }

    dto.email = dto.email.trim().toLowerCase();

    const existing = await this.adminRepository.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });
    if (existing) {
      throw new ConflictException(
        existing.username === dto.username
          ? 'Username already exists'
          : 'Email already exists',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const admin = this.adminRepository.create({
      // ── credentials ──
      username: dto.username,
      password: hashedPassword,
      email: dto.email,

      // ── basic info ──
      first_name: dto.first_name ?? null,
      last_name: dto.last_name ?? null,
      first_name_La: dto.first_name_La ?? null,
      last_name_La: dto.last_name_La ?? null,
      middle_name: dto.middle_name ?? null,
      phone: dto.phone ?? null,
      tell: dto.tell ?? null,
      gender: dto.gender ?? null,
      dob: dto.dob ? new Date(dto.dob) : null,
      join_date: dto.join_date ? new Date(dto.join_date) : null,

      // ── address ──
      notes: dto.notes ?? null,
      village: dto.village ?? null,
      district: dto.district ?? null,
      province: dto.province ?? null,
      birth_village: dto.birth_village ?? null,
      birth_district: dto.birth_district ?? null,
      birth_province: dto.birth_province ?? null,
      home_address: dto.home_address ?? null,
      home_picture_url: dto.home_picture_url ?? null,
      current_academic_year: dto.current_academic_year ?? null,
      profile_pic: dto.profile_pic ?? null,

      // ── jsonb arrays ──
      history_work: dto.history_work ?? [],
      education_level: dto.education_level ?? [],
      emergency_with: dto.emergency_with ?? [],
      bos_info: dto.bos_info ?? [],
      family_info: dto.family_info ?? [],
      other_restriction: dto.other_restriction ?? {},

      // ── flags ──
      is_active: dto.is_active ?? true,
      is_deleted: false,
    });

    if (dto.role_ids?.length) {
      const roles = await this.roleRepository.findBy({ id: In(dto.role_ids) });
      if (roles.length !== dto.role_ids.length)
        throw new BadRequestException('Invalid role IDs');
      admin.roles = roles;
    }

    if (dto.branch_id) {
      const branch = await this.branchRepository.findOneBy({
        id: dto.branch_id,
      });
      if (!branch) throw new BadRequestException('Invalid branch ID');
      admin.branch = branch;
    }

    const saved = await this.adminRepository.save(admin);
    return this.toResponseDto(saved);
  }

  // ─── FIND ALL ─────────────────────────────────────────────────────────────
  async findAll(): Promise<AdminResponseDto[]> {
    const admins = await this.adminRepository.find({
      where: { is_deleted: false },
      relations: ['roles', 'branch'],
      order: { created_at: 'DESC' },
    });
    return admins.map((a) => this.toResponseDto(a));
  }

  // ─── FIND ONE ─────────────────────────────────────────────────────────────
  async findOne(id: string): Promise<AdminResponseDto> {
    const admin = await this.adminRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['roles', 'branch'],
    });
    if (!admin) throw new NotFoundException(`Admin ${id} not found`);
    return this.toResponseDto(admin);
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateAdminDto): Promise<AdminResponseDto> {
    const admin = await this.findOneRaw(id);

    // check username / email conflict
    if (dto.username || dto.email) {
      const conflict = await this.adminRepository.findOne({
        where: [
          dto.username ? { username: dto.username } : {},
          dto.email ? { email: dto.email } : {},
        ],
      });
      if (conflict && conflict.id !== id) {
        throw new ConflictException(
          conflict.username === dto.username ? 'Username taken' : 'Email taken',
        );
      }
    }

    if (dto.password) {
      admin.password = await bcrypt.hash(dto.password, 10);
    }

    if (dto.role_ids !== undefined) {
      if (dto.role_ids.length === 0) {
        admin.roles = [];
      } else {
        const roles = await this.roleRepository.findBy({
          id: In(dto.role_ids),
        });
        if (roles.length !== dto.role_ids.length)
          throw new BadRequestException('Invalid role IDs');
        admin.roles = roles;
      }
    }

    if (dto.branch_id !== undefined) {
      if (!dto.branch_id) {
        admin.branch = null;
      } else {
        const branch = await this.branchRepository.findOneBy({
          id: dto.branch_id,
        });
        if (!branch) throw new BadRequestException('Invalid branch ID');
        admin.branch = branch;
      }
    }

    Object.assign(admin, {
      // ── credentials ──
      username: dto.username ?? admin.username,
      email: dto.email ?? admin.email,

      // ── basic info ──
      first_name: dto.first_name ?? admin.first_name,
      last_name: dto.last_name ?? admin.last_name,
      first_name_La: dto.first_name_La ?? admin.first_name_La,
      last_name_La: dto.last_name_La ?? admin.last_name_La,
      middle_name: dto.middle_name ?? admin.middle_name,
      phone: dto.phone ?? admin.phone,
      tell: dto.tell ?? admin.tell,
      gender: dto.gender ?? admin.gender,
      dob: dto.dob ? new Date(dto.dob) : admin.dob,
      join_date: dto.join_date ? new Date(dto.join_date) : admin.join_date,

      // ── identity ──
      nationality: dto.nationality ?? admin.nationality,
      ethnicity: dto.ethnicity ?? admin.ethnicity,
      religion: dto.religion ?? admin.religion,
      id_card_number: dto.id_card_number ?? admin.id_card_number,
      id_card_image: dto.id_card_image ?? admin.id_card_image,
      passport_number: dto.passport_number ?? admin.passport_number,
      passport_image: dto.passport_image ?? admin.passport_image,
      current_status: dto.current_status ?? admin.current_status,

      // ── address ──
      notes: dto.notes ?? admin.notes,
      village: dto.village ?? admin.village,
      district: dto.district ?? admin.district,
      province: dto.province ?? admin.province,
      birth_village: dto.birth_village ?? admin.birth_village,
      birth_district: dto.birth_district ?? admin.birth_district,
      birth_province: dto.birth_province ?? admin.birth_province,
      home_address: dto.home_address ?? admin.home_address,
      home_picture_url: dto.home_picture_url ?? admin.home_picture_url,
      current_academic_year:
        dto.current_academic_year ?? admin.current_academic_year,
      profile_pic: dto.profile_pic ?? admin.profile_pic,

      // ── jsonb arrays — only replace if provided ──
      history_work: dto.history_work ?? admin.history_work,
      education_level: dto.education_level ?? admin.education_level,
      emergency_with: dto.emergency_with ?? admin.emergency_with,
      bos_info: dto.bos_info ?? admin.bos_info,
      family_info: dto.family_info ?? admin.family_info,
      other_restriction: dto.other_restriction ?? admin.other_restriction,

      // ── flags ──
      is_active: dto.is_active ?? admin.is_active,
      is_deleted: dto.is_deleted ?? admin.is_deleted,
    });

    const updated = await this.adminRepository.save(admin);
    return this.toResponseDto(updated);
  }

  // ─── SOFT DELETE ──────────────────────────────────────────────────────────
  async softRemove(id: string): Promise<{ message: string }> {
    const admin = await this.findOneRaw(id);
    admin.is_deleted = true;
    admin.is_active = false;
    await this.adminRepository.save(admin);
    return { message: `Admin ${id} soft deleted` };
  }

  // ─── HARD DELETE ──────────────────────────────────────────────────────────
  async hardRemove(id: string): Promise<{ message: string }> {
    const result = await this.adminRepository.delete(id);
    if (!result.affected) throw new NotFoundException(`Admin ${id} not found`);
    return { message: `Admin ${id} permanently deleted` };
  }

  // ─── CHANGE PASSWORD ──────────────────────────────────────────────────────
  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const admin = await this.findOneRaw(id);
    if (!admin.password) throw new BadRequestException('No password set');

    const match = await bcrypt.compare(currentPassword, admin.password);
    if (!match) throw new BadRequestException('Current password incorrect');
    if (newPassword.length < 6)
      throw new BadRequestException('Password too short');

    admin.password = await bcrypt.hash(newPassword, 10);
    await this.adminRepository.save(admin);
    return { message: 'Password updated' };
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────
  private toResponseDto(admin: Admin): AdminResponseDto {
    const toIso = (v?: string | Date | null) =>
      v ? new Date(v).toISOString() : null;
    const str = (v?: string | null) => v ?? null;

    return {
      id: admin.id,
      username: admin.username!,
      email: admin.email!,

      // basic info
      first_name: str(admin.first_name),
      last_name: str(admin.last_name),
      first_name_La: str(admin.first_name_La),
      last_name_La: str(admin.last_name_La),
      middle_name: str(admin.middle_name),
      phone: str(admin.phone),
      tell: str(admin.tell),
      gender: str(admin.gender),
      dob: toIso(admin.dob),
      join_date: toIso(admin.join_date),

      // identity
      nationality: str(admin.nationality),
      ethnicity: str(admin.ethnicity),
      religion: str(admin.religion),
      id_card_number: str(admin.id_card_number),
      id_card_image: str(admin.id_card_image),
      passport_number: str(admin.passport_number),
      passport_image: str(admin.passport_image),
      current_status: str(admin.current_status),

      // address
      notes: str(admin.notes),
      village: str(admin.village),
      district: str(admin.district),
      province: str(admin.province),
      birth_village: str(admin.birth_village),
      birth_district: str(admin.birth_district),
      birth_province: str(admin.birth_province),
      home_address: str(admin.home_address),
      home_picture_url: str(admin.home_picture_url),
      current_academic_year: str(admin.current_academic_year),
      profile_pic: str(admin.profile_pic),

      // jsonb
      history_work: admin.history_work ?? [],
      education_level: admin.education_level ?? [],
      emergency_with: admin.emergency_with ?? [],
      bos_info: admin.bos_info ?? [],
      family_info: admin.family_info ?? [],
      other_restriction: admin.other_restriction ?? {},

      // flags
      is_active: admin.is_active,
      is_deleted: admin.is_deleted,
      created_at: admin.created_at.toISOString(),
      updated_at: admin.updated_at.toISOString(),

      // relations
      roles: (admin.roles ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        level: r.level,
      })),
      branch: admin.branch
        ? { id: admin.branch.id, name: str(admin.branch.name) }
        : null,
    };
  }

  private async findOneRaw(id: string): Promise<Admin> {
    const admin = await this.adminRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['roles', 'branch'],
    });
    if (!admin) throw new NotFoundException(`Admin ${id} not found`);
    return admin;
  }
}
