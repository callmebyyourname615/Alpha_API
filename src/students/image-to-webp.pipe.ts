import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImageToWebpPipe implements PipeTransform {
  async transform(file: Express.Multer.File) {
    if (!file) return file;

    const originalPath = file.path;
    const dir          = path.dirname(originalPath);
    const baseName     = path.basename(originalPath, path.extname(originalPath));
    const webpPath     = path.join(dir, `${baseName}.webp`);

    try {
      await sharp(originalPath)
        .webp({ quality: 85 })
        .toFile(webpPath);

      fs.unlinkSync(originalPath);

      file.path     = webpPath.replace(/\\/g, '/');
      file.filename = `${baseName}.webp`;
      file.mimetype = 'image/webp';

      return file;
    } catch (err) {
      if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
      if (fs.existsSync(webpPath))     fs.unlinkSync(webpPath);
      const errorMessage = err instanceof Error ? err.message : String(err);
      throw new BadRequestException('Image conversion failed: ' + errorMessage);
    }
  }

  static async convertOne(
    files: Express.Multer.File[] | undefined,
  ): Promise<Express.Multer.File | undefined> {
    if (!files?.length) return undefined;
    const pipe = new ImageToWebpPipe();
    return pipe.transform(files[0]);
  }
}