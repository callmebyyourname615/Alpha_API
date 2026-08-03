export class SearchStudentByClassDto {
  classIds: string[]; // รองรับหลาย class
  branchId?: string;
  academicYearId?: string;
  isActive?: boolean;
}