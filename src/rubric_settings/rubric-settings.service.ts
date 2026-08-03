import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaveRubricWorkspaceDto } from './dto/save-rubric-workspace.dto';
import { RubricWorkspace } from './rubric-workspace.entity';

@Injectable()
export class RubricSettingsService {
  constructor(
    @InjectRepository(RubricWorkspace)
    private readonly workspaceRepository: Repository<RubricWorkspace>,
  ) {}

  private normalizeWorkspaceKey(workspaceKey?: string) {
    return String(workspaceKey || 'default').trim() || 'default';
  }

  async getWorkspace(workspaceKey?: string): Promise<RubricWorkspace> {
    const key = this.normalizeWorkspaceKey(workspaceKey);
    let workspace = await this.workspaceRepository.findOne({
      where: { workspaceKey: key },
    });

    if (!workspace) {
      workspace = this.workspaceRepository.create({ workspaceKey: key, objects: [] });
      workspace = await this.workspaceRepository.save(workspace);
    }

    return workspace;
  }

  async saveWorkspace(dto: SaveRubricWorkspaceDto): Promise<RubricWorkspace> {
    const workspace = await this.getWorkspace(dto.workspaceKey);
    workspace.objects = Array.isArray(dto.objects) ? dto.objects : [];
    return this.workspaceRepository.save(workspace);
  }
}
