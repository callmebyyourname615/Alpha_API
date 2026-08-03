import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Parent } from '../parents/parent.entity';
import {
  CreateSiblingGroupDto,
  UpdateSiblingGroupDto,
  AddMembersDto,
  RemoveMembersDto,
  DetectSiblingGroupsDto,
} from './dto/sibling-group.dto';
import { SiblingGroup, SiblingRelationType } from './sibling-group.entity';
import { SiblingGroupMember } from './sibling-group-member.entity';
import { Student } from '../students/student.entity';

@Injectable()
export class SiblingGroupService {
  constructor(
    @InjectRepository(SiblingGroup)
    private readonly groupRepo: Repository<SiblingGroup>,

    @InjectRepository(SiblingGroupMember)
    private readonly memberRepo: Repository<SiblingGroupMember>,

    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,

    @InjectRepository(Parent)
    private readonly parentRepo: Repository<Parent>,

    private readonly dataSource: DataSource,
  ) {}

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async getStudentsWithParents(ids: string[]): Promise<Student[]> {
    const students = await this.studentRepo.find({
      where: { id: In(ids), is_deleted: false },
      relations: ['parents'],
    });

    if (students.length !== ids.length) {
      const found = new Set(students.map((s) => s.id));
      const missing = ids.filter((id) => !found.has(id));
      throw new NotFoundException(`Student(s) not found: ${missing.join(', ')}`);
    }

    return students;
  }

  // Union parents across all students in the group.
  // Every student ends up with the combined parent list of the whole group.
  private async linkParentsAcrossGroup(students: Student[]): Promise<number> {
    const allParentsMap = new Map<string, Parent>();
    for (const s of students) {
      for (const p of s.parents ?? []) {
        allParentsMap.set(p.id, p);
      }
    }

    const allParents = [...allParentsMap.values()];
    let changed = 0;

    for (const s of students) {
      const currentIds = new Set((s.parents ?? []).map((p) => p.id));
      const toAdd = allParents.filter((p) => !currentIds.has(p.id));
      if (toAdd.length) {
        s.parents = [...(s.parents ?? []), ...toAdd];
        await this.studentRepo.save(s);
        changed++;
      }
    }

    return changed;
  }

  private async loadGroup(id: string): Promise<SiblingGroup> {
    const group = await this.groupRepo.findOne({
      where: { id, is_deleted: false },
      relations: ['students', 'students.parents', 'members', 'members.student'],
    });
    if (!group) throw new NotFoundException(`Sibling group ${id} not found`);
    return group;
  }

  // ─── CREATE ────────────────────────────────────────────────────────────────

  async createGroup(dto: CreateSiblingGroupDto): Promise<SiblingGroup> {
    const uniqueIds = [...new Set(dto.studentIds)];
    if (uniqueIds.length < 2) {
      throw new BadRequestException('A sibling group requires at least 2 distinct students');
    }

    const students = await this.getStudentsWithParents(uniqueIds);

    // Check: none of these students should already share the same group
    const existingMember = await this.memberRepo.findOne({
      where: { studentId: In(uniqueIds) },
      relations: ['group'],
    });

    // (allow it — a student can belong to multiple groups e.g. half-siblings;
    //  only warn if the exact same set already exists)

    const shouldLink = dto.autoLinkParents ?? true;
    let parentsLinked = false;

    if (shouldLink) {
      const changed = await this.linkParentsAcrossGroup(students);
      parentsLinked = changed > 0;
    }

    const group = this.groupRepo.create({
      name: dto.name ?? null,
      relation_type: dto.relation_type ?? SiblingRelationType.FULL,
      parents_linked: parentsLinked,
      auto_detected: false,
      note: dto.note ?? null,
      is_active: true,
      is_deleted: false,
    });

    const saved = await this.groupRepo.save(group);

    // Create explicit member records
    const memberEntities = students.map((s) =>
      this.memberRepo.create({
        groupId: saved.id,
        studentId: s.id,
        addedById: dto.added_by,
      }),
    );
    await this.memberRepo.save(memberEntities);

    // Also populate the convenience many-to-many
    saved.students = students;
    await this.groupRepo.save(saved);

    return this.loadGroup(saved.id);
  }

  // ─── READ ──────────────────────────────────────────────────────────────────

  async findAll(): Promise<SiblingGroup[]> {
    return this.groupRepo.find({
      where: { is_deleted: false },
      relations: ['students', 'members', 'members.student','members.student.parents', ],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<SiblingGroup> {
    return this.loadGroup(id);
  }

  // All sibling groups that a specific student belongs to
  async findByStudent(studentId: string): Promise<SiblingGroup[]> {
    const members = await this.memberRepo.find({
      where: { studentId },
      relations: ['group', 'group.students', 'group.members', 'group.members.student'],
    });

    return members
      .map((m) => m.group)
      .filter((g) => g && !g.is_deleted);
  }

  // Flat list of all sibling Students for a given student
  // (all students in every group this student belongs to, excluding themselves)
  async findSiblingStudents(studentId: string): Promise<Student[]> {
    const groups = await this.findByStudent(studentId);
    const seen = new Set<string>([studentId]);
    const siblings: Student[] = [];

    for (const group of groups) {
      for (const s of group.students ?? []) {
        if (!seen.has(s.id)) {
          seen.add(s.id);
          siblings.push(s);
        }
      }
    }

    return siblings;
  }

  // ─── UPDATE GROUP METADATA ─────────────────────────────────────────────────

  async updateGroup(id: string, dto: UpdateSiblingGroupDto): Promise<SiblingGroup> {
    const group = await this.loadGroup(id);

    Object.assign(group, {
      name:          dto.name          ?? group.name,
      relation_type: dto.relation_type ?? group.relation_type,
      note:          dto.note          ?? group.note,
      is_active:     dto.is_active     ?? group.is_active,
    });

    await this.groupRepo.save(group);
    return this.loadGroup(id);
  }

  // ─── ADD MEMBERS ───────────────────────────────────────────────────────────

  async addMembers(groupId: string, dto: AddMembersDto): Promise<SiblingGroup> {
    const group = await this.loadGroup(groupId);
    const currentIds = new Set((group.students ?? []).map((s) => s.id));

    const newIds = dto.studentIds.filter((id) => !currentIds.has(id));
    if (!newIds.length) {
      throw new ConflictException('All provided students are already members of this group');
    }

    const newStudents = await this.getStudentsWithParents(newIds);

    // Add to many-to-many
    group.students = [...(group.students ?? []), ...newStudents];
    await this.groupRepo.save(group);

    // Add member records
    const memberEntities = newStudents.map((s) =>
      this.memberRepo.create({ groupId, studentId: s.id,  addedById: dto.added_by }),
    );
    await this.memberRepo.save(memberEntities);

    // Re-link parents across the now-larger group if requested
    const shouldLink = dto.autoLinkParents ?? true;
    if (shouldLink) {
      const allStudents = await this.getStudentsWithParents(
        (group.students ?? []).map((s) => s.id),
      );
      await this.linkParentsAcrossGroup(allStudents);
      group.parents_linked = true;
      await this.groupRepo.save(group);
    }

    return this.loadGroup(groupId);
  }

  // ─── REMOVE MEMBERS ────────────────────────────────────────────────────────

  async removeMembers(groupId: string, dto: RemoveMembersDto): Promise<SiblingGroup> {
    const group = await this.loadGroup(groupId);
    const toRemove = new Set(dto.studentIds);

    const remaining = (group.students ?? []).filter((s) => !toRemove.has(s.id));

    if (remaining.length < 2) {
      throw new BadRequestException(
        'Removing these students would leave fewer than 2 members. Delete the group instead.',
      );
    }

    group.students = remaining;
    await this.groupRepo.save(group);

    await this.memberRepo.delete({
      groupId,
      studentId: In(dto.studentIds),
    });

    return this.loadGroup(groupId);
  }

  // ─── AUTO-DETECT by shared parent ──────────────────────────────────────────

  async detectGroups(dto: DetectSiblingGroupsDto): Promise<{
    candidateGroups: number;
    created: SiblingGroup[];
    skipped: number;
  }> {
    const where: any = { is_deleted: false };
    if (dto.branchId) where.branchId = dto.branchId;

    const students = await this.studentRepo.find({
      where,
      relations: ['parents'],
    });

    // Map parentId → studentIds[]
    const parentToStudents = new Map<string, string[]>();
    for (const s of students) {
      for (const p of s.parents ?? []) {
        const list = parentToStudents.get(p.id) ?? [];
        list.push(s.id);
        parentToStudents.set(p.id, list);
      }
    }

    // Build candidate groups: each set of 2+ students sharing a parent
    // Use a signature (sorted student ids joined) to deduplicate
    const groupSignatures = new Map<string, string[]>();
    for (const studentIds of parentToStudents.values()) {
      const unique = [...new Set(studentIds)].sort();
      if (unique.length < 2) continue;
      const sig = unique.join(':');
      if (!groupSignatures.has(sig)) groupSignatures.set(sig, unique);
    }

    const persist = dto.persist ?? true;
    const shouldLink = dto.autoLinkParents ?? true;
    const created: SiblingGroup[] = [];
    let skipped = 0;

    for (const [sig, studentIds] of groupSignatures) {
      // Check if a group with this exact member set already exists
      const existingMembers = await this.memberRepo.find({
        where: { studentId: In(studentIds) },
        relations: ['group'],
      });

      // Group existing members by groupId
      const groupMemberCount = new Map<string, Set<string>>();
      for (const m of existingMembers) {
        if (!groupMemberCount.has(m.groupId)) groupMemberCount.set(m.groupId, new Set());
        groupMemberCount.get(m.groupId)!.add(m.studentId);
      }

      // If any group already covers exactly this student set, skip
      const alreadyExists = [...groupMemberCount.values()].some(
        (memberSet) =>
          memberSet.size === studentIds.length &&
          studentIds.every((id) => memberSet.has(id)),
      );

      if (alreadyExists) { skipped++; continue; }
      if (!persist) continue;

      const group = await this.createGroup({
        studentIds,
        relation_type: SiblingRelationType.FULL,
        autoLinkParents: shouldLink,
        note: 'Auto-detected via shared parent',
        added_by: dto.added_by,
      });

      // Mark as auto-detected
      group.auto_detected = true;
      await this.groupRepo.save(group);

      created.push(group);
    }

    return { candidateGroups: groupSignatures.size, created, skipped };
  }

  // ─── DELETE (soft) ─────────────────────────────────────────────────────────

  async deleteGroup(id: string): Promise<{ message: string }> {
    const group = await this.loadGroup(id);
    group.is_deleted = true;
    group.is_active  = false;
    await this.groupRepo.save(group);
    return { message: `Sibling group ${id} deleted successfully` };
  }
}