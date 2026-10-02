/**
 * Lê a loja oficial no Mercado Livre e devolve os produtos em JSON.
 *
 *   node scripts/importar-ml.mjs            → imprime o JSON
 *   node scripts/importar-ml.mjs --imagens  → descarrega também as fotos para public/produtos/
 *
 * A listagem do ML não publica altura de salto nem plataforma: esses dois
 * campos ficam a null e têm de ser preenchidos à mão em src/content/produtos/.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const LOJA = 'https://www.mercadolivre.com.br/loja/bellatotti';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';

const desescapar = (s) =>
  s
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d));

const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// "Sandália Preta Salto Alto Meia Pata Bellatotti Mega Nero" → "Mega Nero"
const nomeModelo = (titulo) => {
  const m = titulo.match(/Bellatotti\s+(.+)$/i);
  const bruto = m ? m[1] : titulo;
  return bruto.replace(/\s+(Feminina|Feminino)\s*$/i, '').trim();
};

const pista = (titulo) => {
  const t = titulo.toLowerCase();
  return {
    meiaPata: /meia\s*pata/.test(t),
    saltoAlto: /salto\s*alto/.test(t),
    saltoMedio: /salto\s*m[ée]dio/.test(t),
    saltoBaixo: /salto\s*baixo/.test(t),
    tipo: /scarpin/.test(t) ? 'scarpin' : /bota/.test(t) ? 'bota' : 'sandália',
  };
};

async function obterHtml() {
  const r = await fetch(LOJA, { headers: { 'User-Agent': UA, 'Accept-Language': 'pt-BR' } });
  if (!r.ok) throw new Error(`Loja respondeu ${r.status}`);
  return await r.text(); // fetch decodifica em UTF-8
}

function extrair(html) {
  const porId = new Map();
  // Cada card: <img class="poly-component__picture" src=... alt=...> ... <a href=... class="poly-component__title">Título</a>
  const reCard =
    /<img[^>]+class="poly-component__picture"[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[\s\S]{0,4000}?<a\s+href="(https:\/\/produto\.mercadolivre\.com\.br\/MLB-\d+-[^"#?]+)[^"]*"[^>]*class="poly-component__title"[^>]*>([^<]+)<\/a>/g;

  let m;
  while ((m = reCard.exec(html)) !== null) {
    const [, imagem, , url, tituloBruto] = m;
    const titulo = desescapar(tituloBruto).trim();
    const id = (url.match(/MLB-(\d+)/) || [])[1];
    if (!id || porId.has(id)) continue;
    porId.set(id, {
      id,
      titulo,
      nome: nomeModelo(titulo),
      slug: slug(nomeModelo(titulo)),
      // o href já traz o sufixo _JM antes da query; não duplicar
      url: /_JM$/.test(url) ? url : url.replace(/-$/, '') + '_JM',
      imagem,
      pistas: pista(titulo),
      altura: null,
      plataforma: null,
    });
  }
  return [...porId.values()];
}

/**
 * A listagem serve miniaturas de 448px. O mesmo recurso em
 * D_NQ_NP_2X_<id>-F.webp dá 896x1152 com cerca de 32KB — a mesma
 * resolução do JPEG original a um quinto do peso.
 */
function urlGrande(urlMiniatura) {
  const id = (urlMiniatura.match(/(\d+-MLB\d+_\d+)/) || [])[1];
  return id ? `https://http2.mlstatic.com/D_NQ_NP_2X_${id}-F.webp` : null;
}

async function baixarImagens(produtos) {
  const dir = new URL('../public/produtos/', import.meta.url);
  await mkdir(dir, { recursive: true });
  let novas = 0;
  for (const p of produtos) {
    const destino = new URL(`${p.slug}.webp`, dir);
    const url = urlGrande(p.imagem);
    if (!url) {
      console.error(`  sem URL utilizável para ${p.slug}`);
      continue;
    }
    if (existsSync(destino)) continue;
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!r.ok) {
      console.error(`  falhou ${p.slug}: HTTP ${r.status}`);
      continue;
    }
    await writeFile(destino, Buffer.from(await r.arrayBuffer()));
    novas++;
  }
  return novas;
}

const html = await obterHtml();
const produtos = extrair(html);

if (process.argv.includes('--imagens')) {
  const n = await baixarImagens(produtos);
  console.error(`imagens novas descarregadas: ${n}`);
}

console.log(JSON.stringify(produtos, null, 2));
console.error(`\n${produtos.length} produtos lidos da loja oficial.`);
