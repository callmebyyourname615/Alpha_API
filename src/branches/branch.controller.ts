import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  BadRequestException,
  UploadedFile,
} from '@nestjs/common';

import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchResponseDto } from './dto/branch-response.dto';

import { ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('branches')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  private static fileInterceptor = FileInterceptor('profile_pic', {
    storage: diskStorage({
      destination: './uploads/branches',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);

        const ext = extname(file.originalname).toLowerCase();

        cb(null, `branch-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif'];

      const ext = extname(file.originalname).toLowerCase();

      if (!allowedTypes.includes(ext)) {
        return cb(
          new BadRequestException(
            'Only image files are allowed (.jpg, .jpeg, .png, .gif)',
          ),
          false,
        );
      }

      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  // CREATE BRANCH
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create branch with optional profile picture' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(BranchController.fileInterceptor)
  async create(
    @Body() body: any, // ใช้ any เพื่อจับ multipart fields
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<BranchResponseDto> {
    // แปลง fields เป็น DTO
    const dto: CreateBranchDto = {
      branch_id: body.branch_id,
      branch_no: body.branch_no,
      name: body.name,
      contact: body.contact,
      phone: body.phone,
      branch_map: body.branch_map,
      branch_fb: body.branch_fb,
      branch_website: body.branch_website,
      address: body.address ? JSON.parse(body.address) : undefined,
      subjects: body.subjects ? JSON.parse(body.subjects) : undefined,
    };

    return this.branchService.create(dto, file);
  }

  // GET ALL BRANCHES
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all branches' })
  async findAll(): Promise<BranchResponseDto[]> {
    return this.branchService.findAll();
  }

  // GET ONE BRANCH
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get branch by id' })
  async findOne(@Param('id') id: string): Promise<BranchResponseDto> {
    return this.branchService.findOne(id);
  }

  // UPDATE BRANCH
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update branch with optional profile picture' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(BranchController.fileInterceptor)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<BranchResponseDto> {
    return this.branchService.update(id, dto, file);
  }

  // DELETE BRANCH
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete branch' })
  remove(@Param('id') id: string) {
    return this.branchService.remove(id);
  }
}
