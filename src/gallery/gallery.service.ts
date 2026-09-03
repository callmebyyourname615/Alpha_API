import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { File } from '../file/files.entity';
import { Admin } from '../admins/admin.entity';
import { Parent } from '../parents/parent.entity';
import { Student } from '../students/student.entity';
import { GalleryComment } from './gallery-comment.entity';
import { GalleryLike } from './gallery-like.entity';
import { GalleryPhoto } from './gallery-photo.entity';
import { GalleryPost } from './gallery-post.entity';
import { GalleryStudentTag } from './gallery-student-tag.entity';
import {
  CreateGalleryCommentDto,
  CreateGalleryPostDto,
  ToggleGalleryLikeDto,
  UpdateGalleryPostDto,
} from './dto/gallery.dto';

@Injectable()
export class GalleryService {
  constructor(
    @InjectRepository(GalleryPost)
    private readonly posts: Repository<GalleryPost>,
    @InjectRepository(GalleryPhoto)
    private readonly photos: Repository<GalleryPhoto>,
    @InjectRepository(GalleryStudentTag)
    private readonly tags: Repository<GalleryStudentTag>,
    @InjectRepository(GalleryLike)
    private readonly likes: Repository<GalleryLike>,
    @InjectRepository(GalleryComment)
    private readonly comments: Repository<GalleryComment>,
    @InjectRepository(File) private readonly files: Repository<File>,
    @InjectRepository(Student) private readonly students: Repository<Student>,
    @InjectRepository(Parent) private readonly parents: Repository<Parent>,
    @InjectRepository(Admin) private readonly admins: Repository<Admin>,
  ) {}

  async findAll(query: {
    search?: string;
    category?: string;
    visibility?: string;
    status?: string;
    parent_id?: string;
    parent_scope?: string;
    student_id?: string;
    actor_id?: string;
    actor_type?: string;
  }) {
    const qb = this.posts
      .createQueryBuilder('post')
      .orderBy('post.is_pinned', 'DESC')
      .addOrderBy('COALESCE(post.published_at, post.created_at)', 'DESC');
    if (query.search)
      qb.andWhere(
        '(post.title ILIKE :search OR post.description ILIKE :search OR post.location ILIKE :search)',
        { search: `%${query.search}%` },
      );
    if (query.category)
      qb.andWhere('post.category = :category', { category: query.category });
    if (query.visibility)
      qb.andWhere('post.visibility = :visibility', {
        visibility: query.visibility,
      });
    const scopedStudent = query.student_id?.trim();
    if (
      query.parent_id &&
      this.isUuid(query.parent_id) &&
      (!query.parent_scope || this.isUuid(scopedStudent))
    ) {
      qb.leftJoin(
        GalleryStudentTag,
        'gallery_tag',
        'gallery_tag.gallery_id = post.id',
      ).leftJoin(
        'student_parents',
        'student_parent',
        'student_parent.student_id = gallery_tag.student_id',
      );
      qb.andWhere(
        new Brackets((visibility) =>
          visibility
            .where('post.visibility = :publicVisibility', {
              publicVisibility: 'public',
            })
            .orWhere('student_parent.parent_id = :parentId', {
              parentId: query.parent_id,
            }),
        ),
      );
      if (query.parent_scope === 'parent') {
        qb.andWhere(
          new Brackets((scope) =>
            scope
              .where('post.visibility = :scopedPublicVisibility', {
                scopedPublicVisibility: 'public',
              })
              .orWhere(
                'gallery_tag.student_id = :studentId AND student_parent.parent_id = :scopedParentId',
                {
                  studentId: scopedStudent,
                  scopedParentId: query.parent_id,
                },
              ),
          ),
        );
      }
    } else if (query.parent_id || query.parent_scope === 'parent') {
      // An invalid parent id must never make public gallery posts disappear or
      // expose private posts. This also keeps older app sessions recoverable.
      qb.andWhere('post.visibility = :publicVisibility', {
        publicVisibility: 'public',
      });
    }
    qb.andWhere('post.status = :status', {
      status: query.status || 'published',
    });
    return Promise.all(
      (await qb.getMany()).map((post) => this.serialize(post, query)),
    );
  }

  async findOne(
    id: string,
    viewer?: {
      actor_id?: string;
      actor_type?: string;
      parent_id?: string;
      parent_scope?: string;
      student_id?: string;
    },
  ) {
    const post = await this.requirePost(id);
    await this.assertParentCanView(
      post,
      viewer?.parent_id,
      viewer?.parent_scope === 'parent',
      viewer?.student_id,
    );
    return this.serialize(post, viewer);
  }

  async listCategories() {
    const rows = await this.posts
      .createQueryBuilder('post')
      .select('DISTINCT TRIM(post.category)', 'category')
      .where('post.category IS NOT NULL')
      .andWhere("TRIM(post.category) <> ''")
      .orderBy('category', 'ASC')
      .getRawMany<{ category: string }>();
    return rows.map((row) => row.category).filter(Boolean);
  }

  async create(dto: CreateGalleryPostDto) {
    if (dto.status === 'published')
      await this.assertPublishable({
        title: dto.title,
        description: dto.description,
        category: dto.category,
        visibility: dto.visibility ?? 'public',
        photoFileIds: dto.photo_file_ids ?? [],
        taggedStudentIds: dto.tagged_student_ids ?? [],
      });
    const post = this.posts.create({
      title: dto.title,
      description: dto.description,
      category: dto.category,
      location: dto.location,
      visibility: dto.visibility ?? 'public',
      status: dto.status ?? 'draft',
      author_id: dto.author_id,
      author_type: dto.author_type,
      published_at: dto.status === 'published' ? new Date() : undefined,
    });
    const saved = await this.posts.save(post);
    await this.replacePhotos(saved.id, dto.photo_file_ids ?? []);
    await this.replaceTags(saved.id, dto.tagged_student_ids ?? []);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateGalleryPostDto) {
    const post = await this.requirePost(id);
    const nextStatus = dto.status ?? post.status;
    const hasPhotoFileIds = dto.photo_file_ids !== undefined;
    const hasTaggedStudentIds = dto.tagged_student_ids !== undefined;
    if (nextStatus === 'published') {
      const [existingPhotos, existingTags] = await Promise.all([
        hasPhotoFileIds
          ? Promise.resolve([])
          : this.photos.find({
              where: { gallery_id: id },
              select: ['file_id'],
            }),
        hasTaggedStudentIds
          ? Promise.resolve([])
          : this.tags.find({
              where: { gallery_id: id },
              select: ['student_id'],
            }),
      ]);
      await this.assertPublishable({
        title: dto.title ?? post.title,
        description: dto.description ?? post.description,
        category: dto.category ?? post.category,
        visibility: dto.visibility ?? post.visibility,
        photoFileIds:
          dto.photo_file_ids ??
          existingPhotos
            .map((photo) => photo.file_id)
            .filter((id): id is string => Boolean(id)),
        taggedStudentIds:
          dto.tagged_student_ids ?? existingTags.map((tag) => tag.student_id),
      });
    }
    Object.assign(
      post,
      Object.fromEntries(
        Object.entries(dto).filter(
          ([key, value]) =>
            value !== undefined &&
            !['photo_file_ids', 'tagged_student_ids'].includes(key),
        ),
      ),
    );
    if (dto.status === 'published' && !post.published_at)
      post.published_at = new Date();
    await this.posts.save(post);
    if (hasPhotoFileIds) await this.replacePhotos(id, dto.photo_file_ids ?? []);
    if (hasTaggedStudentIds)
      await this.replaceTags(id, dto.tagged_student_ids ?? []);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.requirePost(id);
    const galleryPhotos = await this.photos.find({ where: { gallery_id: id } });
    const fileIds = galleryPhotos.map((photo) => photo.file_id).filter(Boolean);
    if (fileIds.length)
      await this.files.update(
        { id: In(fileIds) },
        { is_active: false, is_deleted: true },
      );
    await Promise.all([
      this.photos.delete({ gallery_id: id }),
      this.tags.delete({ gallery_id: id }),
      this.likes.delete({ gallery_id: id }),
      this.comments.delete({ gallery_id: id }),
    ]);
    await this.posts.delete(id);
    return { message: 'Gallery post deleted' };
  }

  async toggleLike(id: string, dto: ToggleGalleryLikeDto) {
    const post = await this.requirePost(id);
    if (dto.actor_type.toLowerCase() === 'parent')
      await this.assertParentCanView(post, dto.actor_id, true, dto.student_id);
    const existing = await this.likes.findOne({
      where: {
        gallery_id: id,
        actor_id: dto.actor_id,
        actor_type: dto.actor_type,
      },
    });
    if (existing) await this.likes.remove(existing);
    else
      await this.likes.save(
        this.likes.create({
          gallery_id: id,
          actor_id: dto.actor_id,
          actor_type: dto.actor_type,
        }),
      );
    return {
      liked: !existing,
      likes_count: await this.likes.count({ where: { gallery_id: id } }),
    };
  }

  async listComments(
    id: string,
    viewer?: {
      parent_id?: string;
      parent_scope?: string;
      student_id?: string;
    },
  ) {
    const post = await this.requirePost(id);
    await this.assertParentCanView(
      post,
      viewer?.parent_id,
      viewer?.parent_scope === 'parent',
      viewer?.student_id,
    );
    const comments = await this.comments.find({
      where: { gallery_id: id },
      order: { created_at: 'ASC' },
    });
    return this.withCommentAuthorDetails(comments);
  }
  async addComment(id: string, dto: CreateGalleryCommentDto) {
    const post = await this.requirePost(id);
    if (dto.author_type.toLowerCase() === 'parent')
      await this.assertParentCanView(post, dto.author_id, true, dto.student_id);
    if (dto.reply_to_id) {
      const parent = await this.comments.findOne({
        where: { id: dto.reply_to_id, gallery_id: id },
      });
      if (!parent)
        throw new NotFoundException('Reply target not found in this gallery');
    }
    // student_id is only used to authorize the parent viewer; it is not a
    // persisted column on gallery_comments.
    const { student_id: _studentId, ...commentData } = dto;
    const comment = await this.comments.save(
      this.comments.create({ gallery_id: id, ...commentData }),
    );
    return (await this.withCommentAuthorDetails([comment]))[0];
  }

  private async replacePhotos(galleryId: string, fileIds: string[]) {
    await this.photos.delete({ gallery_id: galleryId });
    if (!fileIds.length) return;
    const files = await this.files.find({
      where: { id: In(fileIds), is_deleted: false },
    });
    const byId = new Map(files.map((file) => [file.id, file]));
    await this.photos.save(
      fileIds
        .filter((id) => byId.has(id))
        .map((id, index) =>
          this.photos.create({
            gallery_id: galleryId,
            file_id: id,
            file_path: byId.get(id)!.file_path,
            sort_order: index,
          }),
        ),
    );
  }

  /**
   * Drafts are intentionally permissive so a teacher can work through the
   * wizard over time. A published gallery, however, is never allowed to be
   * incomplete—even when a caller bypasses the web wizard and calls the API.
   */
  private async assertPublishable(input: {
    title?: string;
    description?: string;
    category?: string;
    visibility: 'public' | 'private';
    photoFileIds: string[];
    taggedStudentIds: string[];
  }) {
    const missing: string[] = [];
    const title = input.title?.trim() || '';
    if (!title || title.toLocaleLowerCase() === 'untitled gallery')
      missing.push('title');
    if (!input.description?.trim()) missing.push('description');
    if (!input.category?.trim()) missing.push('category');
    const photoIds = Array.from(new Set(input.photoFileIds.filter(Boolean)));
    if (!photoIds.length) missing.push('at least one photo');
    if (input.visibility === 'private' && !input.taggedStudentIds.length)
      missing.push('at least one tagged student');
    if (missing.length)
      throw new BadRequestException({
        message: `Complete the gallery before publishing: ${missing.join(', ')}`,
        missing,
      });

    const [activeFileCount, validStudentCount] = await Promise.all([
      this.files.count({ where: { id: In(photoIds), is_deleted: false } }),
      input.visibility === 'private'
        ? this.students.count({
            where: {
              id: In(
                Array.from(new Set(input.taggedStudentIds.filter(Boolean))),
              ),
            },
          })
        : Promise.resolve(0),
    ]);
    if (activeFileCount !== photoIds.length)
      throw new BadRequestException(
        'One or more selected gallery photos are unavailable',
      );
    if (
      input.visibility === 'private' &&
      validStudentCount !== new Set(input.taggedStudentIds.filter(Boolean)).size
    )
      throw new BadRequestException(
        'One or more tagged students are unavailable',
      );
  }

  private async replaceTags(galleryId: string, studentIds: string[]) {
    await this.tags.delete({ gallery_id: galleryId });
    if (!studentIds.length) return;
    const valid = await this.students.find({
      where: { id: In(studentIds) },
      select: ['id'],
    });
    await this.tags.save(
      valid.map((student) =>
        this.tags.create({ gallery_id: galleryId, student_id: student.id }),
      ),
    );
  }

  private async serialize(
    post: GalleryPost,
    viewer?: { actor_id?: string; actor_type?: string },
  ) {
    const viewerLike =
      viewer?.actor_id && viewer?.actor_type && this.isUuid(viewer.actor_id)
        ? this.likes.findOne({
            where: {
              gallery_id: post.id,
              actor_id: viewer.actor_id,
              actor_type: viewer.actor_type,
            },
          })
        : Promise.resolve(null);
    const [
      photos,
      tags,
      likesCount,
      commentsCount,
      currentViewerLike,
      authorName,
    ] = await Promise.all([
      this.photos.find({
        where: { gallery_id: post.id },
        order: { sort_order: 'ASC' },
      }),
      this.tags.find({ where: { gallery_id: post.id } }),
      this.likes.count({ where: { gallery_id: post.id } }),
      this.comments.count({ where: { gallery_id: post.id } }),
      viewerLike,
      this.resolvePostAuthorName(post),
    ]);
    return {
      ...post,
      photos,
      tagged_student_ids: tags.map((tag) => tag.student_id),
      author_name: authorName,
      likes_count: likesCount,
      comments_count: commentsCount,
      viewer_liked: Boolean(currentViewerLike),
    };
  }

  private async resolvePostAuthorName(post: GalleryPost) {
    if (!this.isUuid(post.author_id)) return null;
    if (post.author_type?.toLowerCase() === 'admin') {
      const author = await this.admins.findOne({
        where: { id: post.author_id },
        select: ['id', 'first_name', 'last_name', 'email'],
      });
      return (
        [author?.first_name, author?.last_name]
          .filter((value): value is string => Boolean(value?.trim()))
          .join(' ') ||
        author?.email ||
        null
      );
    }
    if (post.author_type?.toLowerCase() === 'parent') {
      const author = await this.parents.findOne({
        where: { id: post.author_id },
        select: [
          'id',
          'firstName_eng',
          'lastName_eng',
          'firstName_lao',
          'lastName_lao',
          'email',
        ],
      });
      return (
        [author?.firstName_eng, author?.lastName_eng]
          .filter((value): value is string => Boolean(value?.trim()))
          .join(' ') ||
        [author?.firstName_lao, author?.lastName_lao]
          .filter((value): value is string => Boolean(value?.trim()))
          .join(' ') ||
        author?.email ||
        null
      );
    }
    return null;
  }

  private async requirePost(id: string) {
    const post = await this.posts.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Gallery post not found');
    return post;
  }

  private async withCommentAuthorDetails(comments: GalleryComment[]) {
    const parentIds = comments
      .filter((comment) => comment.author_type.toLowerCase() === 'parent')
      .map((comment) => comment.author_id);
    const adminIds = comments
      .filter((comment) => comment.author_type.toLowerCase() === 'admin')
      .map((comment) => comment.author_id);
    const [parents, admins] = await Promise.all([
      parentIds.length
        ? this.parents.find({
            where: { id: In(parentIds) },
            select: [
              'id',
              'email',
              'firstName_eng',
              'lastName_eng',
              'firstName_lao',
              'lastName_lao',
            ],
          })
        : Promise.resolve([]),
      adminIds.length
        ? this.admins.find({
            where: { id: In(adminIds) },
            select: ['id', 'email', 'first_name', 'last_name'],
          })
        : Promise.resolve([]),
    ]);
    const emailByActorId = new Map(
      [...parents, ...admins]
        .filter((account) => account.email)
        .map((account) => [account.id, account.email]),
    );
    const nameByActorId = new Map<string, string>();
    for (const parent of parents) {
      const englishName = [parent.firstName_eng, parent.lastName_eng]
        .filter((value): value is string => Boolean(value?.trim()))
        .join(' ');
      const laoName = [parent.firstName_lao, parent.lastName_lao]
        .filter((value): value is string => Boolean(value?.trim()))
        .join(' ');
      if (englishName || laoName)
        nameByActorId.set(parent.id, englishName || laoName);
    }
    for (const admin of admins) {
      const name = [admin.first_name, admin.last_name]
        .filter((value): value is string => Boolean(value?.trim()))
        .join(' ');
      if (name) nameByActorId.set(admin.id, name);
    }
    return comments.map((comment) => ({
      ...comment,
      author_email: emailByActorId.get(comment.author_id) ?? null,
      author_name: nameByActorId.get(comment.author_id) ?? null,
    }));
  }

  private async assertParentCanView(
    post: GalleryPost,
    parentId?: string,
    parentScoped = false,
    studentId?: string,
  ) {
    if (post.visibility === 'public') return;
    if (!parentScoped && !parentId) return;
    if (!this.isUuid(parentId) || (parentScoped && !this.isUuid(studentId)))
      throw new NotFoundException('Gallery post not found');
    const allowed = await this.tags
      .createQueryBuilder('tag')
      .innerJoin(
        'student_parents',
        'student_parent',
        'student_parent.student_id = tag.student_id',
      )
      .where('tag.gallery_id = :galleryId', { galleryId: post.id })
      .andWhere('student_parent.parent_id = :parentId', { parentId })
      .andWhere(parentScoped ? 'tag.student_id = :studentId' : '1=1', {
        studentId,
      })
      .getExists();
    if (!allowed) throw new NotFoundException('Gallery post not found');
  }

  private isUuid(value?: string) {
    return Boolean(
      value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
      ),
    );
  }
}
