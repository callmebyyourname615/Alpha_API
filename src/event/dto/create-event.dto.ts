// create-event.dto.ts
export class CreateEventDto {
  branch_id: string;
  academic_year: string;
  name: string;
  image_path?: string; // optional main image
  is_active?: boolean;
}
