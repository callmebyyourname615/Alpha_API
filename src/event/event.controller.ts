import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { EventService } from './event.service';
import { Event } from './events.entity';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CreateEventDto } from './dto/create-event.dto';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  // ✅ Create Event + Upload Files
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'files', maxCount: 10 }],
      {
        storage: diskStorage({
          destination: './uploads/events',
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
          },
        }),
      },
    ),
  )
  async create(
    @Body() dto: CreateEventDto,
    @UploadedFiles() files: { files?: Express.Multer.File[] },
  ): Promise<Event> {
    return this.eventService.create(dto, files?.files);
  }

  // ✅ Get All Events
  @Get()
  findAll(): Promise<Event[]> {
    return this.eventService.findAll();
  }

  // ✅ Get One Event
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Event> {
    return this.eventService.findOne(id);
  }

  // ✅ Update Event + Optional Upload Files
  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'files', maxCount: 10 }],
      {
        storage: diskStorage({
          destination: './uploads/events',
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
          },
        }),
      },
    ),
  )
  update(
    @Param('id') id: string,
    @Body() data: Partial<Event>,
    @UploadedFiles() files: { files?: Express.Multer.File[] },
  ): Promise<Event> {
    return this.eventService.update(id, data, files?.files);
  }

  // ✅ Delete Event
  @Delete(':id')
  delete(@Param('id') id: string): Promise<{ message: string }> {
    return this.eventService.delete(id);
  }
}
