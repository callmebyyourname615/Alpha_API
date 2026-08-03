import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from '../file/files.entity';
import { Admin } from '../admins/admin.entity';
import { Parent } from '../parents/parent.entity';
import { Student } from '../students/student.entity';
import { GalleryComment } from './gallery-comment.entity';
import { GalleryController } from './gallery.controller';
import { GalleryLike } from './gallery-like.entity';
import { GalleryPhoto } from './gallery-photo.entity';
import { GalleryPost } from './gallery-post.entity';
import { GalleryService } from './gallery.service';
import { GalleryStudentTag } from './gallery-student-tag.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GalleryPost,
      GalleryPhoto,
      GalleryStudentTag,
      GalleryLike,
      GalleryComment,
      File,
      Student,
      Parent,
      Admin,
    ]),
  ],
  controllers: [GalleryController],
  providers: [GalleryService],
})
export class GalleryModule {}
