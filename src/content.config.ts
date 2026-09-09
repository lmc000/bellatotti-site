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

const produtos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/produtos' }),
  schema: z.object({
    nome: z.string(),
    descricao: z.string(),
    // Medidas em cm. A inclinação real (altura − plataforma) é calculada.
    altura: z.number(),
    plataforma: z.number().default(0),
    imagem: z.string(),
    alt: z.string(),
    shopee: z.string().url(),
    etiqueta: z.string().optional(),
    numeracao: z.string().optional(),
    ordem: z.number().default(99),
  }),
});

export const collections = { guias, produtos };
