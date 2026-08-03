import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';
import { ParentService } from './parent.service';
import { CreateParentDto } from './dto/CreateParentDto';
import { UpdateParentDto } from './dto/UpdateParentDto';

const fileInterceptorOptions = {
  storage: diskStorage({
    destination: './uploads/parents',
    filename: (_req, file, cb) => {
      cb(null, `${uuid()}${extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedImages = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const allowedDocs = ['.pdf'];
    const ext = extname(file.originalname).toLowerCase();

    // family_book only allows PDF, others only images
    if (file.fieldname === 'family_book') {
      if (!allowedDocs.includes(ext)) {
        return cb(
          new BadRequestException(`family_book must be a PDF file`),
          false,
        );
      }
    } else {
      if (!allowedImages.includes(ext)) {
        return cb(
          new BadRequestException(
            `File type '${ext}' not allowed. Allowed: ${allowedImages.join(', ')}`,
          ),
          false,
        );
      }
    }
    cb(null, true);
  },
};

const fileFields = [
  { name: 'profile_pic', maxCount: 1 },
  { name: 'id_card', maxCount: 1 },
  { name: 'home_picture', maxCount: 1 },
  { name: 'family_book', maxCount: 1 },
  { name: 'passport_image', maxCount: 1 },
];
@Controller('parents')
export class ParentController {
  constructor(private readonly service: ParentService) {}

  @Post()
  @UseInterceptors(FileFieldsInterceptor(fileFields, fileInterceptorOptions))
  create(
    @Body() dto: CreateParentDto,
    @UploadedFiles()
    files: {
      profile_pic?: Express.Multer.File[];
      id_card?: Express.Multer.File[];
      home_picture?: Express.Multer.File[];
      family_book?: Express.Multer.File[];
      passport_image?: Express.Multer.File[];
    },
  ) {
    if (files?.profile_pic?.[0]) dto.profile_pic = files.profile_pic[0].path;
    if (files?.id_card?.[0]) dto.id_card = files.id_card[0].path;
    if (files?.home_picture?.[0])
      dto.home_picture_url = files.home_picture[0].path; // ✅
    if (files?.family_book?.[0])
      dto.family_book_url = files.family_book[0].path; // ✅
    if (files?.passport_image?.[0])
      dto.passport_image_url = files.passport_image[0].path; // ✅
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(FileFieldsInterceptor(fileFields, fileInterceptorOptions))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateParentDto,
    @UploadedFiles()
    files: {
      profile_pic?: Express.Multer.File[];
      id_card?: Express.Multer.File[];
      home_picture?: Express.Multer.File[];
      family_book?: Express.Multer.File[];
      passport_image?: Express.Multer.File[];
    },
  ) {
    if (files?.profile_pic?.[0]) dto.profile_pic = files.profile_pic[0].path;
    if (files?.id_card?.[0]) dto.id_card = files.id_card[0].path;
    if (files?.home_picture?.[0])
      dto.home_picture_url = files.home_picture[0].path; // ✅
    if (files?.family_book?.[0])
      dto.family_book_url = files.family_book[0].path; // ✅
    if (files?.passport_image?.[0])
      dto.passport_image_url = files.passport_image[0].path; // ✅
    return this.service.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.softDelete(id);
  }
}
