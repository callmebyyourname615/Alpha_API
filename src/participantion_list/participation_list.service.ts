import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ParticipationList } from './participation_list.entity';
import { Level } from '../levels/level.entity';
import { CreateParticipationListDto } from './dto/create-participation-list.dto';
import { UpdateParticipationListDto } from './dto/update-participation-list.dto';

@Injectable()
export class ParticipationListService {
  constructor(
    @InjectRepository(ParticipationList)
    private participationRepo: Repository<ParticipationList>,

    @InjectRepository(Level)
    private levelRepo: Repository<Level>,
  ) {}

  async create(dto: CreateParticipationListDto): Promise<ParticipationList> {
    const levels = await this.levelRepo.find({
      where: { id: In(dto.levelIds) },
    });

    if (levels.length !== dto.levelIds.length) {
      throw new BadRequestException('One or more level IDs do not exist');
    }

    const list = this.participationRepo.create({
      name: dto.name,
      score: dto.score,
      description: dto.description,
      levels,
    });

    return this.participationRepo.save(list);
  }

  async findAll(): Promise<ParticipationList[]> {
    return this.participationRepo.find({
      relations: ['levels'],
      order: { created_at: 'DESC' },
    });
  }

  async findByLevelId(levelId: string): Promise<ParticipationList[]> {
    return this.participationRepo
      .createQueryBuilder('list')
      .innerJoinAndSelect('list.levels', 'level')
      .where('level.id = :levelId', { levelId })
      .orderBy('list.created_at', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<ParticipationList> {
    const item = await this.participationRepo.findOne({
      where: { id },
      relations: ['levels'],
    });

    if (!item) {
      throw new NotFoundException(`Participation list ${id} not found`);
    }

    return item;
  }

  async update(
    id: string,
    dto: UpdateParticipationListDto,
  ): Promise<ParticipationList> {
    const list = await this.findOne(id);

    if (dto.name !== undefined) list.name = dto.name;
    if (dto.score !== undefined) list.score = dto.score;
    if (dto.description !== undefined) list.description = dto.description;

    if (dto.levelIds !== undefined) {
      if (dto.levelIds.length === 0) {
        list.levels = [];
      } else {
        const levels = await this.levelRepo.find({
          where: { id: In(dto.levelIds) },
        });
        if (levels.length !== dto.levelIds.length) {
          throw new BadRequestException('One or more level IDs do not exist');
        }
        list.levels = levels;
      }
    }

    return this.participationRepo.save(list);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.participationRepo.remove(item);
  }
}
