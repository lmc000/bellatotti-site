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
    descricao: z.string().default(''),
    // Medidas em cm; a inclinação real (altura − plataforma) é calculada.
    // Ficam nulas até serem confirmadas: a tira de medidas só aparece com altura.
    altura: z.number().nullable().default(null),
    plataforma: z.number().nullable().default(null),
    imagem: z.string(),
    alt: z.string(),
    shopee: z.string().url().optional(),
    mercadolivre: z.string().url().optional(),
    etiqueta: z.string().optional(),
    numeracao: z.string().optional(),
    ordem: z.number().default(99),
  }),
});

export const collections = { guias, produtos };
