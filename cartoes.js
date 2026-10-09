// Configuração e leitura da lista de cartões (usado pelo index.html e painel.html).
const CONFIG = {
  marca: '',                                // nome da sua marca (vazio = não aparece)
  contato: '',                              // ex.: 'https://wa.me/5511999999999' (vazio = não aparece)
  repositorio: 'Toniizx/Toniizx.github.io', // usado no painel para abrir a edição no GitHub
};

const FORMATO_CODIGO = /^[A-Z0-9]{6}$/;

// Lê o cartoes.txt. Cada linha: CÓDIGO | Link  (o link é sempre o último pedaço da linha)
async function carregarCartoes() {
  const resp = await fetch('cartoes.txt?t=' + Date.now(), { cache: 'no-store' });
  if (!resp.ok) throw new Error('Não foi possível carregar a lista de cartões.');
  const texto = await resp.text();
  const cartoes = [];
  texto.split(/\r?\n/).forEach((linha, i) => {
    linha = linha.trim();
    if (!linha || linha.startsWith('#')) return;
    const partes = linha.split('|').map((p) => p.trim());
    const codigo = partes[0];
    const link = partes.length > 1 ? partes[partes.length - 1] : '';
    const c = { codigo: codigo.toUpperCase(), cliente: '', link, linha: i + 1 };
    if (!link) c.status = 'livre';
    else if (linkValido(link)) c.status = 'ativo';
    else c.status = 'erro';
    if (FORMATO_CODIGO.test(c.codigo)) cartoes.push(c);
  });
  return cartoes;
}

function linkValido(link) {
  try {
    const u = new URL(link);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}
