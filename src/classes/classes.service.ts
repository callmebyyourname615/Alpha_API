import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './class.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

type ClassResponse = Omit<Class, 'homeroomTeacher'> & {
  homeroomTeacher?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    first_name_La: string | null;
    last_name_La: string | null;
    email: string | null;
    phone: string | null;
    roles?: { id: string; name: string; level: number }[];
  } | null;
};

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private readonly repo: Repository<Class>,
  ) {}

  async create(dto: CreateClassDto): Promise<ClassResponse | null> {
    const entity = this.repo.create(dto);
    const saved = await this.repo.save(entity);
    return this.findOne(saved.id);
  }

  async findAll(): Promise<ClassResponse[]> {
    const classes = await this.repo.find({
      relations: ['yearLevel', 'homeroomTeacher', 'homeroomTeacher.roles'],
    });
    return classes.map((schoolClass) => this.toResponse(schoolClass));
  }

  async findOne(id: string): Promise<ClassResponse | null> {
    const schoolClass = await this.repo.findOne({
      where: { id },
      relations: ['yearLevel', 'homeroomTeacher', 'homeroomTeacher.roles'],
    });
    return schoolClass ? this.toResponse(schoolClass) : null;
  }

  async update(id: string, dto: UpdateClassDto): Promise<ClassResponse | null> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  private toResponse(schoolClass: Class): ClassResponse {
    const teacher = schoolClass.homeroomTeacher;

    return {
      ...schoolClass,
      homeroomTeacher: teacher
        ? {
            id: teacher.id,
            first_name: teacher.first_name,
            last_name: teacher.last_name,
            first_name_La: teacher.first_name_La,
            last_name_La: teacher.last_name_La,
            email: teacher.email,
            phone: teacher.phone,
            roles: (teacher.roles ?? []).map((role) => ({
              id: role.id,
              name: role.name,
              level: role.level,
            })),
          }
        : null,
    };
  }
}
