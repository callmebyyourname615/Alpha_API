import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UploadedFiles,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname }    from 'path';
import { v4 as uuid } from 'uuid';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

import { AdminResponseDto, AdminsService }     from './admins.service';
import { CreateAdminDto, UpdateAdminDto }    from './dto/create-admin.dto';

// =========================
// FILE UPLOAD CONFIG
// =========================

const adminFileInterceptorOptions = {
  storage: diskStorage({
    destination: './uploads/admin',
    filename: (_req, file, cb) => {
      cb(null, `${uuid()}${extname(file.originalname).toLowerCase()}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(
        new BadRequestException(
          `File type '${ext}' not allowed. Allowed: ${allowed.join(', ')}`,
        ),
        false,
      );
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
};

// =========================
// FILE FIELDS
// =========================
// For array fields (education_level, emergency_with, family_info),
// files are sent with index-based names:
//   education_level_certificate_image_0   → education_level[0].certificate_image
//   education_level_certificate_image_1   → education_level[1].certificate_image
//   emergency_with_ss_image_0             → emergency_with[0].ss_image
//   family_info_profile_0                 → family_info[0].profile
// Up to 10 items per array supported (expand maxCount if needed).

const MAX_ARRAY_ITEMS = 10;

const adminFileFields = [
  // ── Top-level files ───────────────────────────────────────────────
  { name: 'profile_pic',   maxCount: 1 },
  { name: 'home_picture',  maxCount: 1 },

  // ── education_level[].certificate_image ───────────────────────────
  ...Array.from({ length: MAX_ARRAY_ITEMS }, (_, i) => ({
    name: `education_level_certificate_image_${i}`,
    maxCount: 1,
  })),

  // ── emergency_with[].ss_image ─────────────────────────────────────
  ...Array.from({ length: MAX_ARRAY_ITEMS }, (_, i) => ({
    name: `emergency_with_ss_image_${i}`,
    maxCount: 1,
  })),

  // ── family_info[].profile ─────────────────────────────────────────
  ...Array.from({ length: MAX_ARRAY_ITEMS }, (_, i) => ({
    name: `family_info_profile_${i}`,
    maxCount: 1,
  })),
];

// =========================
// UPLOADED FILES TYPE
// =========================

type AdminUploadedFiles = {
  profile_pic?:  Express.Multer.File[];
  home_picture?: Express.Multer.File[];
  [key: string]: Express.Multer.File[] | undefined;
  // keys: education_level_certificate_image_0..N
  //       emergency_with_ss_image_0..N
  //       family_info_profile_0..N
};

// =========================
// HELPER — inject file paths into array dto items
// =========================

function injectArrayFilePaths(
  dto: CreateAdminDto | UpdateAdminDto,
  files: AdminUploadedFiles,
): void {
  // education_level[i].certificate_image
  if (dto.education_level?.length) {
    dto.education_level.forEach((item, i) => {
      const file = files[`education_level_certificate_image_${i}`]?.[0];
      if (file) {
        item.certificate_image = `uploads/admin/${file.filename}`;
      }
    });
  }

  // emergency_with[i].ss_image
  if (dto.emergency_with?.length) {
    dto.emergency_with.forEach((item, i) => {
      const file = files[`emergency_with_ss_image_${i}`]?.[0];
      if (file) {
        item.ss_image = `uploads/admin/${file.filename}`;
      }
    });
  }

  // family_info[i].profile
  if (dto.family_info?.length) {
    dto.family_info.forEach((item, i) => {
      const file = files[`family_info_profile_${i}`]?.[0];
      if (file) {
        item.profile = `uploads/admin/${file.filename}`;
      }
    });
  }
}

// =========================
// CONTROLLER
// =========================

@ApiTags('Admins')
@ApiBearerAuth()
@Controller('admins')
@UsePipes(
  new ValidationPipe({
    transform:           true,
    whitelist:           true,
    forbidNonWhitelisted: true,
  }),
)
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  // ─── CREATE ────────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new admin' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(adminFileFields, adminFileInterceptorOptions),
  )
  async create(
    @Body() dto: CreateAdminDto,
    @UploadedFiles() files: AdminUploadedFiles,
  ): Promise<AdminResponseDto> {

   
    // Top-level files
    if (files?.profile_pic?.[0]) {
      dto.profile_pic = `uploads/admin/${files.profile_pic[0].filename}`;
    }
    if (files?.home_picture?.[0]) {
      dto.home_picture_url = `uploads/admin/${files.home_picture[0].filename}`;
    }

    // Array item files
    injectArrayFilePaths(dto, files);

     console.log( injectArrayFilePaths(dto, files))
    return this.adminsService.create(dto);
  }

  // ─── FIND ALL ──────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get all active admins' })
  @ApiResponse({ status: 200, type: [AdminResponseDto] })
  async findAll(): Promise<AdminResponseDto[]> {
    return this.adminsService.findAll();
  }

  // ─── FIND ONE ──────────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get single admin by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminResponseDto> {
    return this.adminsService.findOne(id);
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  @Put(':id')
  @ApiOperation({ summary: 'Update an admin' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @UseInterceptors(
    FileFieldsInterceptor(adminFileFields, adminFileInterceptorOptions),
  )
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminDto,
    @UploadedFiles() files: AdminUploadedFiles,
  ): Promise<AdminResponseDto> {
    // Top-level files
    if (files?.profile_pic?.[0]) {
      dto.profile_pic = `uploads/admin/${files.profile_pic[0].filename}`;
    }
    if (files?.home_picture?.[0]) {
      dto.home_picture_url = `uploads/admin/${files.home_picture[0].filename}`;
    }

    // Array item files
    injectArrayFilePaths(dto, files);

    return this.adminsService.update(id, dto);
  }

  // ─── SOFT DELETE ───────────────────────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete an admin' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.adminsService.softRemove(id);
  }
}