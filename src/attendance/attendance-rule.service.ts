import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceRule } from './attendance_rules';

@Injectable()
export class AttendanceRuleService {
  constructor(
    @InjectRepository(AttendanceRule)
    private repo: Repository<AttendanceRule>,
  ) {}

  private strip(rule: AttendanceRule): Omit<AttendanceRule, 'level'> {
    const obj: any = Object.assign({}, rule);
    delete obj.level;
    return obj;
  }

  create(dto: any) {
    return this.repo.save(this.repo.create(dto));
  }

  findAll() {
    return this.repo.find().then((rules) => rules.map((r) => this.strip(r)));
  }

  findByLevel(levelId: string) {
    return this.repo
      .find({ where: { levelId } })
      .then((rules) => rules.map((r) => this.strip(r)));
  }

  async upsertByLevel(
    levelId: string,
    rules: {
      dayOfWeek: string;
      checkInStart: string;
      lateAfter: string;
      earlyBefore: string;
      checkOutEnd: string;
    }[],
  ) {
    for (const rule of rules) {
      const existing = await this.repo.findOne({
        where: { levelId, dayOfWeek: rule.dayOfWeek },
      });
      if (existing) {
        Object.assign(existing, rule);
        await this.repo.save(existing);
      } else {
        await this.repo.save(
          this.repo.create({
            levelId,
            checkOutTime: rule.checkInStart,
            ...rule,
          }),
        );
      }
    }
    return this.findByLevel(levelId);
  }

  async findOne(id: string) {
    const rule = await this.repo.findOne({ where: { id } });
    if (!rule) throw new NotFoundException('Rule not found');
    return rule;
  }

  async update(id: string, dto: any) {
    const rule = await this.findOne(id);
    Object.assign(rule, dto);
    return this.repo.save(rule);
  }

  async remove(id: string) {
    const rule = await this.findOne(id);
    return this.repo.remove(rule);
  }
}