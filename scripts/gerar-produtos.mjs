/**
 * Cria fichas em src/content/produtos/ para os modelos da loja oficial que
 * ainda não existem. Nunca toca nas fichas já criadas: altura, plataforma e
 * descrição são dados curados à mão e não estão na listagem do ML.
 *
 *   node scripts/importar-ml.mjs > produtos.json
 *   node scripts/gerar-produtos.mjs produtos.json
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const DIR = new URL('../src/content/produtos/', import.meta.url);
const IMGS = new URL('../public/produtos/', import.meta.url);

const entrada = process.argv[2];
if (!entrada) {
  console.error('uso: node scripts/gerar-produtos.mjs <produtos.json>');
  process.exit(1);
}

const produtos = JSON.parse(await readFile(entrada, 'utf8'));
const existentes = new Set(
  (await readdir(DIR)).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''))
);

// Mantém a ordem curada dos que já existem; os novos entram a seguir.
let proximaOrdem = 10;
let criados = 0;
const semImagem = [];

for (const p of produtos) {
  if (existentes.has(p.slug)) continue;

  // Preferir uma foto .jpg colocada à mão; senão a .webp vinda do ML.
  const jpg = `${p.slug}.jpg`;
  const webp = `${p.slug}.webp`;
  const ficheiro = existsSync(new URL(jpg, IMGS)) ? jpg : existsSync(new URL(webp, IMGS)) ? webp : null;
  if (!ficheiro) {
    semImagem.push(p.slug);
    continue;
  }

  const etiqueta = p.pistas.meiaPata ? 'Meia Pata' : null;

  const ficha = [
    '---',
    `nome: ${JSON.stringify(p.nome)}`,
    'descricao: ""',
    '# Confirmar na caixa do produto antes de preencher:',
    'altura: null',
    'plataforma: null',
    `imagem: "/produtos/${ficheiro}"`,
    `alt: ${JSON.stringify(p.titulo)}`,
    `mercadolivre: ${JSON.stringify(p.url)}`,
    ...(etiqueta ? [`etiqueta: ${JSON.stringify(etiqueta)}`] : []),
    `ordem: ${proximaOrdem++}`,
    '---',
    '',
  ].join('\n');

  await writeFile(new URL(`${p.slug}.md`, DIR), ficha, 'utf8');
  criados++;
}

console.log(`fichas criadas: ${criados}`);
console.log(`já existiam: ${produtos.length - criados - semImagem.length}`);
if (semImagem.length) console.log(`sem imagem (ignorados): ${semImagem.join(', ')}`);
