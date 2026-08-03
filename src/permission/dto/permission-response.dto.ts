export class PermissionResponseDto {
  id: string;
  roleId: string;
  roleName: string;
  moduleId: string | null;
  moduleName: string | null;
  canCreate: boolean;
  canView: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
  canUpdatePassword: boolean;
  createdAt: string;
  updatedAt: string;
}