import {
  Controller,
  Post,
  Put,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UploadedFiles,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CreateStudentDto } from './dto/create-student.dto';
import { CreateEnrollmentDto } from '../enrollments/dto/create-enrollment.dto';
import { SearchStudentByClassDto } from './dto/search-students.dto';
import { StudentsService } from './student.service';
import { ImageToWebpPipe } from './image-to-webp.pipe';

const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const fileStorage = (subDir: string) =>
  diskStorage({
    destination: `./uploads/students/${subDir}`,
    filename: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + extname(file.originalname));
    },
  });

const fileFilter = (req: any, file: any, cb: any) => {
  const ext = extname(file.originalname).toLowerCase();
  if (!allowedExts.includes(ext)) {
    return cb(
      new BadRequestException(`File type '${ext}' not allowed.`),
      false,
    );
  }
  cb(null, true);
};

export const studentFilesInterceptor = FileFieldsInterceptor(
  [
    { name: 'profile_image', maxCount: 1 },
    { name: 'image_passport', maxCount: 1 },
    { name: 'image_url', maxCount: 1 },
  ],
  {
    storage: fileStorage('main'),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter,
  },
);

export const liveWithFilesInterceptor = FileFieldsInterceptor(
  [
    { name: 'id_card_image_url', maxCount: 1 },
    { name: 'passport_image_url', maxCount: 1 },
    { name: 'profile_image', maxCount: 1 },
  ],
  {
    storage: fileStorage('live_with'),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter,
  },
);

export const bosInfoFileInterceptor = FileInterceptor('image_url', {
  storage: fileStorage('bos_info'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

export const siblingsInfoFileInterceptor = FileInterceptor('image_url', {
  storage: fileStorage('siblings_info'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

interface StudentUploadedFiles {
  profile_image?: Express.Multer.File[];
  image_passport?: Express.Multer.File[];
  image_url?: Express.Multer.File[];
}

interface LiveWithUploadedFiles {
  id_card_image_url?: Express.Multer.File[];
  passport_image_url?: Express.Multer.File[];
  profile_image?: Express.Multer.File[];
}

// Small helper so we don't repeat the same "string -> JSON.parse, else keep / default" logic
// six times per handler. Pass `fallback` for create (defaults to []) and leave it undefined
// for update (so unspecified fields are left untouched downstream).
function parseMaybeJson<T>(value: unknown, fallback?: T): T | undefined {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      throw new BadRequestException('Invalid JSON in request body field');
    }
  }
  if (value !== undefined) return value as T;
  return fallback;
}

function parseMaybeBoolean(value: unknown): boolean | undefined {
  if (value === true || value === false) return value;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  return undefined;
}

type StudentDtoExtraProperties = {
  health_history?: unknown;
  physical_disability?: unknown;
  health_review_required?: boolean;
  healthReviewRequired?: boolean;
  health_review_reasons?: unknown;
  healthReviewReasons?: unknown;
  protective_info?: unknown;
  parentIds?: unknown;
};

@Controller('students')
export class StudentsController {
  constructor(private readonly service: StudentsService) {}

  // ================= GET ALL =================
  @Get()
  findAll(
    @Query('branch_id') branchId?: string,
    @Query('branchId') branchIdAlias?: string,
  ) {
    return this.service.findAll(branchId ?? branchIdAlias);
  }

  // ================= GET BY ID =================
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  // ================= UPLOAD: LiveWith nested images =================
  // POST /students/:id/live-with/:index/upload
  @Post(':id/live-with/:index/upload')
  @UseInterceptors(liveWithFilesInterceptor)
  async uploadLiveWithImages(
    @Param('id') id: string,
    @Param('index') index: string,
    @UploadedFiles() files: LiveWithUploadedFiles,
  ) {
    const [idCardFile, passportFile, profileFile] = await Promise.all([
      ImageToWebpPipe.convertOne(files?.id_card_image_url),
      ImageToWebpPipe.convertOne(files?.passport_image_url),
      ImageToWebpPipe.convertOne(files?.profile_image),
    ]);

    const patch: Partial<{
      id_card_image_url: string;
      passport_image_url: string;
      profile_image: string;
    }> = {};

    if (idCardFile) patch.id_card_image_url = idCardFile.path;
    if (passportFile) patch.passport_image_url = passportFile.path;
    if (profileFile) patch.profile_image = profileFile.path;

    return this.service.updateLiveWithImages(id, Number(index), patch);
  }

  // ================= UPLOAD: BosInfo image =================
  // POST /students/:id/bos-info/:index/upload
  @Post(':id/bos-info/:index/upload')
  @UseInterceptors(bosInfoFileInterceptor)
  async uploadBosInfoImage(
    @Param('id') id: string,
    @Param('index') index: string,
    @UploadedFile(new ImageToWebpPipe()) file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('image_url file is required');
    return this.service.updateBosInfoImage(id, Number(index), file.path);
  }

  // ================= UPLOAD: SiblingsInfo image =================
  // POST /students/:id/Siblings-info/:index/upload
  @Post(':id/Siblings-info/:index/upload')
  @UseInterceptors(siblingsInfoFileInterceptor)
  async uploadSiblingsInfoImage(
    @Param('id') id: string,
    @Param('index') index: string,
    @UploadedFile(new ImageToWebpPipe()) file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('image_url file is required');
    return this.service.updateSiblingsInfoImage(id, Number(index), file.path);
  }

  // ================= CREATE =================
  @Post()
  @UseInterceptors(studentFilesInterceptor)
  async createStudent(
    @UploadedFiles() files: StudentUploadedFiles,
    @Body() body: CreateStudentDto,
  ) {
    const [profileFile, passportFile, imageUrlFile] = await Promise.all([
      ImageToWebpPipe.convertOne(files?.profile_image),
      ImageToWebpPipe.convertOne(files?.image_passport),
      ImageToWebpPipe.convertOne(files?.image_url),
    ]);

    const dto: CreateStudentDto & StudentDtoExtraProperties = {
      ...body,
      live_with: parseMaybeJson(body.live_with, []),
      emergency_contacts: parseMaybeJson(body.emergency_contacts, []),
      Siblings_info: parseMaybeJson((body as any).Siblings_info, []),
      his_school_kindergarten: parseMaybeJson(
        (body as any).his_school_kindergarten,
        [],
      ),
      his_school_primary: parseMaybeJson(
        (body as any).his_school_primary,
        [],
      ),
      his_school_nursery: parseMaybeJson(
        (body as any).his_school_nursery,
        [],
      ),
      health_history: parseMaybeJson((body as any).health_history, []),
      physical_disability: parseMaybeJson(
        (body as any).physical_disability,
        [],
      ),
      health_review_required: parseMaybeBoolean(
        (body as any).health_review_required,
      ),
      healthReviewRequired: parseMaybeBoolean(
        (body as any).healthReviewRequired,
      ),
      health_review_reasons: parseMaybeJson(
        (body as any).health_review_reasons,
        [],
      ),
      healthReviewReasons: parseMaybeJson(
        (body as any).healthReviewReasons,
        [],
      ),
      is_active: parseMaybeBoolean((body as any).is_active),
      protective_info: parseMaybeJson((body as any).protective_info, []),
      parentIds: parseMaybeJson((body as any).parentIds, []),
    };

    if (profileFile) dto.profile_image_path = profileFile.path;
    if (passportFile) dto.image_passport = passportFile.path;
    if (imageUrlFile) dto.image_url = imageUrlFile.path;

    return this.service.createStudent(dto);
  }

  // ================= LINK PARENTS =================
  @Post(':id/parents')
  linkParents(
    @Param('id') id: string,
    @Body('parentIds') parentIds: string[],
  ) {
    return this.service.linkParents(id, parentIds);
  }

  // ================= BY CLASS =================
  @Post('by-class')
  findByClass(@Body() dto: SearchStudentByClassDto) {
    return this.service.findByClass(dto);
  }

  // ================= ENROLL =================
  @Post('enroll')
  enrollStudent(@Body() dto: CreateEnrollmentDto) {
    return this.service.enrollStudent(dto);
  }

  // ================= UPDATE =================
  @Put(':id')
  @UseInterceptors(studentFilesInterceptor)
  async updateStudent(
    @Param('id') id: string,
    @UploadedFiles() files: StudentUploadedFiles,
    @Body() body: any,
  ) {
    const [profileFile, passportFile, imageUrlFile] = await Promise.all([
      ImageToWebpPipe.convertOne(files?.profile_image),
      ImageToWebpPipe.convertOne(files?.image_passport),
      ImageToWebpPipe.convertOne(files?.image_url),
    ]);

    const dto: Partial<CreateStudentDto> = {
      ...body,
      is_active: body.is_active === 'true' || body.is_active === true ? true : (body.is_active === 'false' || body.is_active === false ? false : undefined),
      live_with: parseMaybeJson(body.live_with),
      emergency_contacts: parseMaybeJson(body.emergency_contacts),
      bos_info: parseMaybeJson(body.bos_info),
      Siblings_info: parseMaybeJson(body.Siblings_info),
      his_school_kindergarten: parseMaybeJson(body.his_school_kindergarten),
      his_school_primary: parseMaybeJson(body.his_school_primary),
      his_school_nursery: parseMaybeJson(body.his_school_nursery),
      health_history: parseMaybeJson(body.health_history),
      physical_disability: parseMaybeJson(body.physical_disability),
      health_review_required: parseMaybeBoolean(body.health_review_required),
      healthReviewRequired: parseMaybeBoolean(body.healthReviewRequired),
      health_review_reasons: parseMaybeJson(body.health_review_reasons),
      healthReviewReasons: parseMaybeJson(body.healthReviewReasons),
      protective_info: parseMaybeJson(body.protective_info),
      parentIds: parseMaybeJson(body.parentIds),
    };

    if (profileFile) dto.profile_image_path = profileFile.path;
    if (passportFile) dto.image_passport = passportFile.path;
    if (imageUrlFile) dto.image_url = imageUrlFile.path;

    return this.service.updateStudent(id, dto);
  }

  // ================= DELETE =================
  @Delete(':id')
  deleteStudent(@Param('id') id: string) {
    return this.service.deleteStudent(id);
  }
}
