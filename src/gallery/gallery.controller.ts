import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  CreateGalleryCommentDto,
  CreateGalleryPostDto,
  ToggleGalleryLikeDto,
  UpdateGalleryPostDto,
} from './dto/gallery.dto';
import { GalleryService } from './gallery.service';

@Controller('galleries')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class GalleryController {
  constructor(private readonly service: GalleryService) {}

  @Get() findAll(
    @Query()
    query: {
      search?: string;
      category?: string;
      visibility?: string;
      status?: string;
      parent_id?: string;
      parent_scope?: string;
      student_id?: string;
      actor_id?: string;
      actor_type?: string;
    },
  ) {
    return this.service.findAll(query);
  }
  @Get('categories') listCategories() {
    return this.service.listCategories();
  }
  @Post() create(@Body() dto: CreateGalleryPostDto) {
    return this.service.create(dto);
  }
  @Get(':id') findOne(
    @Param('id') id: string,
    @Query()
    viewer: {
      actor_id?: string;
      actor_type?: string;
      parent_id?: string;
      parent_scope?: string;
      student_id?: string;
    },
  ) {
    return this.service.findOne(id, viewer);
  }
  @Put(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateGalleryPostDto,
  ) {
    return this.service.update(id, dto);
  }
  @Delete(':id') remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
  @Post(':id/likes/toggle') toggleLike(
    @Param('id') id: string,
    @Body() dto: ToggleGalleryLikeDto,
  ) {
    return this.service.toggleLike(id, dto);
  }
  @Get(':id/comments') listComments(
    @Param('id') id: string,
    @Query()
    viewer: {
      parent_id?: string;
      parent_scope?: string;
      student_id?: string;
    },
  ) {
    return this.service.listComments(id, viewer);
  }
  @Post(':id/comments') addComment(
    @Param('id') id: string,
    @Body() dto: CreateGalleryCommentDto,
  ) {
    return this.service.addComment(id, dto);
  }
}
