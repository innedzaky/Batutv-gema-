import { z } from 'zod';
import { MAX_UPLOAD_SIZE_BYTES, ALLOWED_MIME_TYPES } from '@/src/utils/imageOptimizer';

export const adminMediaSchema = z.object({
  id: z.string().optional(),
  filename: z.string().min(1, 'Nama file wajib diisi').max(255),
  originalName: z.string().min(1, 'Nama asli file wajib diisi'),
  mimeType: z.string().refine((val) => ALLOWED_MIME_TYPES.includes(val) || val === 'image/svg+xml' || val === 'application/pdf', {
    message: 'Tipe MIME tidak didukung. Gunakan JPG, PNG, atau WebP.',
  }),
  extension: z.string().min(1),
  mediaType: z.enum(['image', 'video', 'audio', 'document']).default('image'),
  width: z.number().int().nonnegative().default(0),
  height: z.number().int().nonnegative().default(0),
  fileSize: z.number().int().positive().max(MAX_UPLOAD_SIZE_BYTES, {
    message: `Ukuran file melebihi batas maksimum (${(MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)).toFixed(0)} MB)`,
  }),
  altText: z.string().max(255).optional().default(''),
  caption: z.string().max(500).optional().default(''),
  description: z.string().max(2000).optional().default(''),
  url: z.string().min(1, 'URL berkas wajib diisi'),
  sizes: z
    .object({
      thumbnail: z.string().optional(),
      medium: z.string().optional(),
      large: z.string().optional(),
      original: z.string().optional(),
    })
    .optional()
    .default({}),
  usageCount: z.number().int().optional().default(0),
  usedIn: z.array(z.any()).optional().default([]),
});

export type AdminMediaInput = z.infer<typeof adminMediaSchema>;

export const updateMediaMetadataSchema = z.object({
  altText: z.string().max(255).optional(),
  caption: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
});

export type UpdateMediaMetadataInput = z.infer<typeof updateMediaMetadataSchema>;
