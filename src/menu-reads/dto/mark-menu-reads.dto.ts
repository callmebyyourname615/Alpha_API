import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsUUID,
} from 'class-validator';

export const SUPPORTED_MENU_RESOURCES = ['homework', 'appointment'] as const;
export type MenuResource = (typeof SUPPORTED_MENU_RESOURCES)[number];

export class MarkMenuReadsDto {
  @IsUUID()
  studentId: string;

  @IsIn(SUPPORTED_MENU_RESOURCES as unknown as string[])
  resource: MenuResource;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(1000)
  @IsUUID('all', { each: true })
  resourceIds: string[];
}
