// Gera códigos novos, adiciona ao cartoes.txt e cria os PDFs dos adesivos.
//
//   node gerar.js 12             -> cria 12 códigos novos + PDFs para a gráfica
//   node gerar.js 12 --amostra   -> só uma prévia (não mexe no cartoes.txt, marca "AMOSTRA")
//   node gerar.js --reimprimir K7P2QX,ABC234  -> PDFs de códigos que já existem
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const QRCode = require('qrcode');

const RAIZ = path.join(__dirname, '..');
const LISTA = path.join(RAIZ, 'cartoes.txt');
const SAIDA = path.join(RAIZ, 'impressao');
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

// Sem 0/O, 1/I/L para ninguém confundir ao ler o código impresso.
const ALFABETO = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const POR_FOLHA = 12; // 3 colunas x 4 linhas em A4

const CABECALHO = `# LISTA DE CARTÕES (pública: NÃO escreva nomes de clientes aqui)
# Cada linha:  CÓDIGO | Link da página de avaliação do Google
#
# Para ATIVAR um cartão, cole o link depois da barra na linha do código. Exemplo:
#   K7P2QX | https://g.page/r/XXXXXXXX/review
#
# Para DESATIVAR, apague o link (deixe só o código e a barra).
# Linhas que começam com # são só anotações e são ignoradas.

`;
const PLANILHA = path.join(RAIZ, 'clientes-privado.csv');
// \uFEFF faz o Excel abrir os acentos corretamente
const CABECALHO_PLANILHA = '\uFEFFCódigo;Cliente;Telefone;Data da venda;Observações\r\n';

function codigosExistentes() {
  if (!fs.existsSync(LISTA)) return new Set();
  return new Set(fs.readFileSync(LISTA, 'utf8').split(/\r?\n/)
    .map((l) => l.split('|')[0].trim().toUpperCase())
    .filter((c) => /^[A-Z0-9]{6}$/.test(c)));
}

function novoCodigo(usados) {
  let c;
  do {
    c = Array.from(crypto.randomBytes(6), (b) => ALFABETO[b % ALFABETO.length]).join('');
  } while (usados.has(c));
  usados.add(c);
  return c;
}

function navegador() {
  const opcoes = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ];
  const achado = opcoes.find((p) => fs.existsSync(p));
  if (!achado) throw new Error('Não encontrei o Edge nem o Chrome para gerar o PDF.');
  return achado;
}

function paraPdf(htmlPath, pdfPath) {
  execFileSync(navegador(), [
    '--headless', '--disable-gpu', '--no-pdf-header-footer',
    `--print-to-pdf=${pdfPath}`, 'file:///' + htmlPath.replace(/\\/g, '/'),
  ], { stdio: 'ignore' });
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}

async function adesivo(codigo, amostra) {
  const svg = await QRCode.toString(config.endereco + codigo, { type: 'svg', errorCorrectionLevel: 'Q', margin: 0 });
  return `<div class="adesivo">
    ${amostra ? '<div class="amostra">AMOSTRA</div>' : ''}
    <div class="titulo">${esc(config.titulo)}</div>
    <div class="estrelas">★★★★★</div>
    <div class="qr">${svg}</div>
    <div class="instrucao">${esc(config.instrucao)}</div>
    <div class="codigo">${codigo}</div>
  </div>`;
}

function css(mm) {
  const s = (v) => (v * mm / 60).toFixed(2) + 'mm'; // escala tudo a partir de um adesivo de 60 mm
  return `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Segoe UI", Arial, sans-serif; color: #1d2330; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .adesivo { position: relative; width: ${mm}mm; height: ${mm}mm; background: #fff; overflow: hidden;
             display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
  .titulo { font-weight: 700; font-size: ${s(3.9)}; line-height: 1.1; }
  .estrelas { color: #f5b400; font-size: ${s(4.2)}; letter-spacing: ${s(0.6)}; line-height: 1; margin: ${s(1)} 0 ${s(2)}; }
  .qr svg { width: ${s(33)}; height: ${s(33)}; display: block; }
  .instrucao { font-size: ${s(2.5)}; color: #687083; margin-top: ${s(2)}; }
  .codigo { font: 700 ${s(3.3)} Consolas, "Courier New", monospace; letter-spacing: ${s(0.5)}; margin-top: ${s(0.8)}; }
  .amostra { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
             transform: rotate(-30deg); font: 900 ${s(9)} Arial, sans-serif; color: rgba(214,69,69,.45); pointer-events: none; }`;
}

async function gerarPdfs(codigos, amostra) {
  fs.mkdirSync(SAIDA, { recursive: true });
  const mm = config.tamanhoAdesivoMm;
  const gap = 6;
  const largura = 3 * mm + 2 * gap;
  const altura = 4 * mm + 3 * gap;
  const nome = new Date().toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '-') + (amostra ? '-AMOSTRA' : '');
  const adesivos = await Promise.all(codigos.map((c) => adesivo(c, amostra)));

  // 1) Folhas A4 com 12 adesivos e linha de corte
  const folhas = [];
  for (let i = 0; i < adesivos.length; i += POR_FOLHA) folhas.push(adesivos.slice(i, i + POR_FOLHA));
  const htmlA4 = `<!doctype html><html><head><meta charset="utf-8"><style>${css(mm)}
    @page { size: A4; margin: 0; }
    .folha { width: 210mm; height: 297mm; padding: ${(297 - altura) / 2}mm ${(210 - largura) / 2}mm; page-break-after: always;
             display: grid; grid-template-columns: repeat(3, ${mm}mm); grid-auto-rows: ${mm}mm; gap: ${gap}mm; }
    .folha:last-child { page-break-after: auto; }
    .folha .adesivo { outline: 0.15mm solid #c8ccd4; border-radius: 4mm; }
  </style></head><body>${folhas.map((f) => `<div class="folha">${f.join('')}</div>`).join('')}</body></html>`;

  // 2) Um adesivo por página, no tamanho exato (para a gráfica montar a própria folha)
  const htmlInd = `<!doctype html><html><head><meta charset="utf-8"><style>${css(mm)}
    @page { size: ${mm}mm ${mm}mm; margin: 0; }
    .adesivo { page-break-after: always; }
    .adesivo:last-child { page-break-after: auto; }
  </style></head><body>${adesivos.join('')}</body></html>`;

  const tmp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'adesivos-'));
  const arquivos = [
    [htmlA4, path.join(SAIDA, `${nome}-folha-A4.pdf`)],
    [htmlInd, path.join(SAIDA, `${nome}-adesivos-individuais.pdf`)],
  ];
  arquivos.forEach(([html, pdf], i) => {
    const h = path.join(tmp, `p${i}.html`);
    fs.writeFileSync(h, html);
    paraPdf(h, pdf);
  });
  fs.writeFileSync(path.join(SAIDA, `${nome}-codigos.txt`), codigos.join('\n') + '\n');
  fs.rmSync(tmp, { recursive: true, force: true });
  return arquivos.map(([, pdf]) => pdf);
}

async function main() {
  const args = process.argv.slice(2);
  const amostra = args.includes('--amostra');
  const iRe = args.indexOf('--reimprimir');
  let codigos;

  if (!amostra && !config.enderecoConfirmado) {
    console.error('PARADO: o endereço "' + config.endereco + '" ainda não foi confirmado como definitivo.');
    console.error('Confirme e mude "enderecoConfirmado" para true em ferramentas/config.json. Para só ver uma prévia, use --amostra.');
    process.exit(1);
  }

  if (iRe >= 0) {
    const existentes = codigosExistentes();
    codigos = (args[iRe + 1] || '').split(',').map((c) => c.trim().toUpperCase()).filter(Boolean);
    const faltando = codigos.filter((c) => !existentes.has(c));
    if (!codigos.length || faltando.length) {
      console.error('Códigos não encontrados no cartoes.txt: ' + (faltando.join(', ') || '(nenhum informado)'));
      process.exit(1);
    }
  } else {
    const qtd = parseInt(args.find((a) => /^\d+$/.test(a)), 10);
    if (!qtd || qtd > 2000) {
      console.error('Informe quantos códigos criar. Ex.: node gerar.js 12');
      process.exit(1);
    }
    const usados = codigosExistentes();
    codigos = Array.from({ length: qtd }, () => novoCodigo(usados));
    if (!amostra) {
      const novo = !fs.existsSync(LISTA);
      fs.appendFileSync(LISTA, (novo ? CABECALHO : '') + codigos.map((c) => `${c} | `).join('\n') + '\n');
      const novaPlanilha = !fs.existsSync(PLANILHA);
      fs.appendFileSync(PLANILHA, (novaPlanilha ? CABECALHO_PLANILHA : '') + codigos.map((c) => `${c};;;;`).join('\r\n') + '\r\n');
    }
  }

  const pdfs = await gerarPdfs(codigos, amostra);
  console.log(`${codigos.length} código(s): ${codigos.join(', ')}`);
  pdfs.forEach((p) => console.log('PDF: ' + p));
  if (amostra) console.log('(amostra: nada foi adicionado ao cartoes.txt)');
}

main().catch((e) => { console.error(e.message); process.exit(1); });
