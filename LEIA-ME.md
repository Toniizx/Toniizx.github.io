# Cartões de Avaliação com QR Code

Cada adesivo tem um QR Code e um código impresso (ex.: `K7P2QX`).
O QR leva para `https://toniizx.github.io/?K7P2QX`, e esse endereço olha a lista
`cartoes.txt` para saber para onde mandar a pessoa:

- **Sem link** → mostra "Cartão ainda não ativado"
- **Com link** → vai direto para a página de avaliação do Google do cliente

> ⚠️ **NUNCA** troque o nome de usuário `Toniizx` no GitHub, nem renomeie ou apague o
> repositório `Toniizx.github.io`. Se fizer isso, todos os adesivos impressos param de funcionar.

---

## ✅ Como ATIVAR um cartão quando vender

**1. Pegue o link de avaliação do cliente**
No celular ou computador do cliente (logado na conta do negócio), abra o
**Perfil da Empresa no Google** → **Pedir avaliações** (ou "Receber mais avaliações") → **copiar link**.
É um link parecido com `https://g.page/r/XXXXXXXX/review`.

**2. Abra a lista de cartões para editar**
Entre em https://toniizx.github.io/painel.html e clique em **Ativar / editar cartões**.
(Ou direto: https://github.com/Toniizx/Toniizx.github.io/edit/main/cartoes.txt)
Precisa estar logado no GitHub.

**3. Cole o link na linha do código do adesivo**
Ache a linha com o código (Ctrl+F) e cole o link **depois da barra**:

```
K7P2QX | https://g.page/r/XXXXXXXX/review
```

**4. Salve**
Clique no botão verde **Commit changes…** e depois **Commit changes** de novo.

**5. Espere 1 a 2 minutos e teste**
Escaneie o adesivo ou clique em **Testar** no painel. Tem que abrir a página de avaliação.

**6. Anote o cliente na sua planilha**
Abra `clientes-privado.csv` (no Excel) e preencha o nome do cliente na linha do código.
Esse arquivo fica **só no seu computador** — nunca é enviado para a internet.

### Trocar o link de um cartão
Igual à ativação: edite a linha, troque o link e salve.

### Desativar um cartão
Apague o link e deixe só `K7P2QX | `. Salve.

---

## 📋 Ver todos os cartões

Abra https://toniizx.github.io/painel.html
Mostra quantos estão livres e ativados. Para ver o nome dos clientes, clique em
**Abrir planilha de clientes** e escolha o `clientes-privado.csv` (a leitura acontece só no seu navegador).

Se aparecer **Link inválido** em vermelho, o link daquela linha está errado (precisa começar com `https://`).

---

## 🖨️ Imprimir mais adesivos

Peça para o Claude: *"gere mais 12 adesivos"*. Ou, num terminal nesta pasta:

```
cd ferramentas
npm install
node gerar.js 12
```

Isso cria 12 códigos novos (já adicionados ao `cartoes.txt` e à planilha) e os PDFs na pasta
`impressao/`. **Depois envie o `cartoes.txt` atualizado para o GitHub** (senão os códigos novos
aparecem como "código não encontrado").

Para reimprimir adesivos que já existem: `node gerar.js --reimprimir K7P2QX,ABC234`

**Arquivos para a gráfica** (pasta `impressao/`):
- `...-folha-A4.pdf` — folha A4 com 12 adesivos de 6 × 6 cm e a linha de corte em cinza
- `...-adesivos-individuais.pdf` — um adesivo por página, no tamanho exato (6 × 6 cm)

---

## O que é cada arquivo

| Arquivo | Para quê |
|---|---|
| `cartoes.txt` | A lista pública: código → link. **É o único que você edita.** |
| `clientes-privado.csv` | Sua planilha de clientes (fica só no seu PC) |
| `index.html` | A página que o QR abre |
| `painel.html` | O painel com a lista |
| `cartoes.js` | Leitura da lista + nome da marca e contato (campos `marca` e `contato`) |
| `ferramentas/` | Gerador de códigos e PDFs |
