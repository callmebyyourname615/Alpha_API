import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeAssignment } from '../entities/fee-assignment.entity';
import { FeeTemplateService } from './fee-template.service';
import { CreateFeeAssignmentDto, FeeAssignmentQueryDto } from '../dto/fee-assignment.dto';

@Injectable()
export class FeeAssignmentService {
  constructor(
    @InjectRepository(FeeAssignment)
    private readonly feeAssignmentRepo: Repository<FeeAssignment>,
    private readonly feeTemplateService: FeeTemplateService,
  ) {}

  async create(
    dto: CreateFeeAssignmentDto,
    assignedBy: string,       // user id from JWT / auth guard
  ): Promise<FeeAssignment> {
    // Validate fee template exists and is active
    const template = await this.feeTemplateService.findOne(dto.fee_template_id);
    if (!template.is_active) {
      throw new ConflictException('Fee template is inactive.');
    }

    // Prevent duplicate assignment of same fee to same class in same academic year
    const existing = await this.feeAssignmentRepo.findOne({
      where: {
        fee_template_id: dto.fee_template_id,
        class_id: dto.class_id,
        academic_year_id: dto.academic_year_id,
      },
    });
    if (existing) {
      throw new ConflictException(
        'This fee is already assigned to this class for the selected academic year.',
      );
    }

    const assignment = this.feeAssignmentRepo.create({
      ...dto,
      yearly_discount: dto.yearly_discount ?? 0,
      assigned_by: assignedBy,
    });
    return this.feeAssignmentRepo.save(assignment);
  }

  async findAll(query: FeeAssignmentQueryDto): Promise<FeeAssignment[]> {
    const qb = this.feeAssignmentRepo
      .createQueryBuilder('fa')
      .leftJoinAndSelect('fa.fee_template', 'ft')
      .orderBy('fa.created_at', 'DESC');

    if (query.class_id) qb.andWhere('fa.class_id = :class_id', { class_id: query.class_id });
    if (query.academic_year_id) qb.andWhere('fa.academic_year_id = :ay', { ay: query.academic_year_id });
    if (query.fee_template_id) qb.andWhere('fa.fee_template_id = :ft', { ft: query.fee_template_id });

    return qb.getMany();
  }

  async findOne(id: string): Promise<FeeAssignment> {
    const assignment = await this.feeAssignmentRepo.findOne({
      where: { id },
      relations: ['fee_template'],
    });
    if (!assignment) throw new NotFoundException(`Fee assignment ${id} not found`);
    return assignment;
  }

  async remove(id: string): Promise<void> {
    const assignment = await this.findOne(id);
    await this.feeAssignmentRepo.remove(assignment);
  }
}