import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import {
  CreateSiblingGroupDto,
  UpdateSiblingGroupDto,
  AddMembersDto,
  RemoveMembersDto,
  DetectSiblingGroupsDto,
} from './dto/sibling-group.dto';
import { SiblingGroupService } from './sibling.service';

@Controller('sibling-groups')
export class SiblingGroupController {
  constructor(private readonly service: SiblingGroupService) {}

  // ── GET /sibling-groups ──────────────────────────────────────────────────
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // ── GET /sibling-groups/:id ──────────────────────────────────────────────
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  // ── GET /sibling-groups/by-student/:studentId ────────────────────────────
  // Returns all sibling groups the student belongs to
  @Get('by-student/:studentId')
  findByStudent(@Param('studentId') studentId: string) {
    return this.service.findByStudent(studentId);
  }

  // ── GET /sibling-groups/by-student/:studentId/students ───────────────────
  // Returns flat list of sibling Student records (excluding the queried student)
  @Get('by-student/:studentId/students')
  findSiblingStudents(@Param('studentId') studentId: string) {
    return this.service.findSiblingStudents(studentId);
  }

  // ── POST /sibling-groups ─────────────────────────────────────────────────
  // Body: { studentIds: string[], name?, relation_type?, autoLinkParents?, note? }
  // Sample: { "studentIds": ["uuid-a", "uuid-b", "uuid-c"], "relation_type": "full", "autoLinkParents": true }
  @Post()
  createGroup(@Body() dto: CreateSiblingGroupDto) {
    return this.service.createGroup(dto);
  }

  // ── POST /sibling-groups/detect ──────────────────────────────────────────
  // Auto-detect sibling groups by shared parent
  // Body: { branchId?, persist?, autoLinkParents? }
  @Post('detect')
  detectGroups(@Body() dto: DetectSiblingGroupsDto) {
    return this.service.detectGroups(dto);
  }

  // ── PUT /sibling-groups/:id ──────────────────────────────────────────────
  // Update group metadata (name, relation_type, note, is_active)
  @Put(':id')
  updateGroup(@Param('id') id: string, @Body() dto: UpdateSiblingGroupDto) {
    return this.service.updateGroup(id, dto);
  }

  // ── POST /sibling-groups/:id/members ─────────────────────────────────────
  // Add more students to an existing group
  // Body: { studentIds: string[], autoLinkParents?: boolean }
  @Post(':id/members')
  addMembers(@Param('id') id: string, @Body() dto: AddMembersDto) {
    return this.service.addMembers(id, dto);
  }

  // ── DELETE /sibling-groups/:id/members ───────────────────────────────────
  // Remove students from a group (group must still have ≥2 members)
  // Body: { studentIds: string[] }
  @Delete(':id/members')
  removeMembers(@Param('id') id: string, @Body() dto: RemoveMembersDto) {
    return this.service.removeMembers(id, dto);
  }

  // ── DELETE /sibling-groups/:id ───────────────────────────────────────────
  // Soft-delete the entire group
  @Delete(':id')
  deleteGroup(@Param('id') id: string) {
    return this.service.deleteGroup(id);
  }
}