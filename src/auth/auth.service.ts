import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Admin } from '../admins/admin.entity';
import { Parent } from '../parents/parent.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private adminRepo: Repository<Admin>,

    @InjectRepository(Parent)
     private parentRepo: Repository<Parent>,
    private jwtService: JwtService,
  ) {}

async login(email: string, password: string) {
  const login = email.trim().toLowerCase();
  const admin = await this.adminRepo
    .createQueryBuilder('admin')
    .addSelect('admin.password')
    .leftJoinAndSelect('admin.roles', 'roles')
    .leftJoinAndSelect('admin.branch', 'branch')
    .where('(LOWER(TRIM(admin.email)) = :login OR LOWER(TRIM(admin.username)) = :login)', { login })
    .andWhere('admin.is_active = true')
    .andWhere('admin.is_deleted = false')
    .getOne();

  if (!admin) {
    throw new UnauthorizedException('Invalid email or password');
  }

  if (!admin.password) {
    throw new UnauthorizedException('No password set for this account');
  }


  const isPasswordValid = await bcrypt.compare(password, admin.password);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid email or password');
  }

  const payload = {
    sub: admin.id,
    username: admin.username,
    email: admin.email,
    first_name: admin.first_name,
    last_name: admin.last_name,
    profile_pic: admin.profile_pic,
    roles: (admin.roles || []).map(r => ({
      id: r.id,
      name: r.name,
      level: r.level,
    })),
    branch: admin.branch ? { id: admin.branch.id, name: admin.branch.name } : { id: '', name: 'Main Branch' }, // <-- add branch
  };

  return {
    access_token: await this.jwtService.signAsync(payload),
    user: payload,
  };
}

async loginParent(email: string, password: string) {
  const login = email.trim().toLowerCase();
  // passwordHash has select: false, so we must explicitly select it
  const parent = await this.parentRepo
    .createQueryBuilder('parent')
    .addSelect('parent.passwordHash')
    .leftJoinAndSelect('parent.roles', 'roles')
    .where('(LOWER(TRIM(parent.email)) = :login OR LOWER(TRIM(parent.username)) = :login)', { login })
    .andWhere('parent.isDeleted = false')
    .getOne();

  if (!parent) {
    throw new UnauthorizedException('Invalid email or password');
  }

  if (parent.isActive && parent.approvalStatus !== 'approved') {
    parent.approvalStatus = 'approved';
    parent.rejectedAt = null;
    parent.rejectReason = null;
    await this.parentRepo.save(parent);
  }

  if (!parent.isActive && parent.approvalStatus === 'rejected') {
    throw new ForbiddenException(
      parent.rejectReason
        ? `Your account was rejected by admin: ${parent.rejectReason}`
        : 'Your account was rejected by admin. Please review your application and submit again.',
    );
  }

  if (!parent.isActive) {
    throw new ForbiddenException(
      'Your account is pending admin approval. Please wait until an administrator activates your account.',
    );
  }

  if (!parent.passwordHash) {
    throw new UnauthorizedException('No password set for this account');
  }

  const isPasswordValid = await bcrypt.compare(password, parent.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid email or password');
  }

  const payload = {
    sub: parent.id,
    username: parent.username,
    email: parent.email,
    firstName: parent.firstName_lao || parent.firstName_eng,
    lastName: parent.lastName_lao || parent.lastName_eng,
    roles: (parent.roles || []).map(r => ({
      id: r.id,
      name: r.name,
      level: r.level,
    })),
    user_type: 'parent',
  };

  return {
    access_token: this.jwtService.sign(payload),
    user: payload,
  };
}


  /*  async loginParent(email: string, password: string) {
    const parent = await this.parentRepo.findOne({
      where: { email, is_active: true, is_deleted: false },
      relations: ['branch'],
    });

    if (!parent) throw new UnauthorizedException('Invalid email or password');

    // Validate branch status
    if (
      !parent.branch ||
      parent.branch.is_deleted ||
      !parent.branch.is_active
    ) {
      throw new UnauthorizedException('Parent branch is not valid or inactive');
    }

    const isMatch = await bcrypt.compare(password, parent.password);
    if (!isMatch) throw new UnauthorizedException('Invalid email or password');

    const payload = {
      id: parent.id,
      email: parent.email,
      first_name: parent.first_name,
      last_name: parent.last_name,
      branch: { id: parent.branch.id, name: parent.branch.name },
      phone: parent.phone,
      user_type: 'parent',
    };

    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '12h' }),
      parent: payload,
    };
  }*/

  async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }
}
