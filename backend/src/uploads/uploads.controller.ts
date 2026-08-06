import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/jpg',
]);

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

function isAllowedImage(file: {
  originalname: string;
  mimetype: string;
}): boolean {
  // Celulares às vezes enviam foto sem extensão no nome — o MIME é a
  // fonte da verdade. Extensão, se existir, precisa ser coerente.
  if (!ALLOWED_MIME.has(file.mimetype)) return false;
  const ext = extname(file.originalname).toLowerCase();
  if (!ext) return true;
  return ALLOWED_EXT.has(ext);
}

function extensionFor(file: { originalname: string; mimetype: string }): string {
  const ext = extname(file.originalname).toLowerCase();
  if (ALLOWED_EXT.has(ext)) return ext;
  return MIME_TO_EXT[file.mimetype] ?? '.jpg';
}

@Controller('uploads')
export class UploadsController {
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          ensureUploadDir();
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          cb(null, `${randomUUID()}${extensionFor(file)}`);
        },
      }),
      limits: { fileSize: MAX_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!isAllowedImage(file)) {
          cb(
            new BadRequestException(
              'Envie uma imagem JPG, PNG, WEBP ou GIF (máx. 5 MB).',
            ) as unknown as Error,
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException('Selecione uma imagem para enviar.');
    }
    return { url: `/uploads/${file.filename}` };
  }
}
