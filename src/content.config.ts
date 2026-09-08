import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const guias = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guias' }),
  schema: z.object({
    titulo: z.string(),
    descricao: z.string(),
    categoria: z.string(),
    data: z.coerce.date(),
    imagem: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { guias };
