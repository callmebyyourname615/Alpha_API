import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceRule } from './attendance_rules';
import { CacheService } from '../common/cache.service';

@Injectable()
export class AttendanceRuleService {
  constructor(
    @InjectRepository(AttendanceRule)
    private repo: Repository<AttendanceRule>,
    private readonly cache: CacheService,
  ) {}

  private strip(rule: AttendanceRule): Omit<AttendanceRule, 'level'> {
    const obj: any = Object.assign({}, rule);
    delete obj.level;
    return obj;
  }

  async create(dto: any) {
    const entity = this.repo.create(dto as Partial<AttendanceRule>);
    const saved = await this.repo.save(entity);
    if (saved.levelId) await this.clearRuleCache(saved.levelId);
    return saved;
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
    await this.clearRuleCache(levelId);
    return this.findByLevel(levelId);
  }

  async findOne(id: string) {
    const rule = await this.repo.findOne({ where: { id } });
    if (!rule) throw new NotFoundException('Rule not found');
    return rule;
  }

  async update(id: string, dto: any) {
    const rule = await this.findOne(id);
    const previousLevelId = rule.levelId;
    Object.assign(rule, dto);
    const saved = await this.repo.save(rule);
    if (previousLevelId) await this.clearRuleCache(previousLevelId);
    if (saved.levelId && saved.levelId !== previousLevelId) {
      await this.clearRuleCache(saved.levelId);
    }
    return saved;
  }

  async remove(id: string) {
    const rule = await this.findOne(id);
    const removed = await this.repo.remove(rule);
    if (rule.levelId) await this.clearRuleCache(rule.levelId);
    return removed;
  }

  private async clearRuleCache(levelId: string) {
    await this.cache.delPattern(`attendance-rule:${levelId}:*`);
  }
}
