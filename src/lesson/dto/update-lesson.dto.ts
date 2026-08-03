import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

const normalizeCurriculumIds = (value: unknown, obj?: Record<string, unknown>): string[] => {
  const collected = new Set<string>();

  const append = (item: unknown): void => {
    if (Array.isArray(item)) {
      for (const nested of item) append(nested);
      return;
    }

    if (typeof item !== 'string') return;

    const trimmed = item.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        append(parsed);
        return;
      } catch {
        // fall through and treat as a single string
      }
    }

    collected.add(trimmed);
  };

  append(value);

  if (obj) {
    for (const key of ['curriculumIds_json', 'curriculum_ids', 'curriculum_ids[]', 'curriculum_ids_json', 'curriculums', 'curriculums[]', 'curriculums_json']) {
      append(obj[key]);
    }

    const indexedKeys = Object.keys(obj)
      .filter((key) => /^(curriculumIds|curriculum_ids|curriculums)\\[\\d+\\]$/.test(key))
      .sort((a, b) => Number(a.match(/\d+/)?.[0] ?? 0) - Number(b.match(/\d+/)?.[0] ?? 0));

    for (const key of indexedKeys) {
      append(obj[key]);
    }
  }

  return [...collected];
};

export class UpdateLessonDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  subjectTypeId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  yearLevelId?: string;

  @ApiPropertyOptional({ type: [String] })
  @Transform(({ value, obj }) => normalizeCurriculumIds(value, obj), {
    toClassOnly: true,
  })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  curriculumIds?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(10)
  s_year?: string | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(10)
  t_year?: string | null;
}
