import { API_URL, ENDPOINTS, PAGINAS } from "./config.js";
import { navegar, rotaAtual } from "./navegar.js";
import { avisoLogin, definirContadorCarrinho } from "./ui.js";

export { API_URL, ENDPOINTS, PAGINAS };
export { avisar, avisoLogin, confirmar } from "./ui.js";

export async function api(caminho, opcoes = {}) {
  const token = localStorage.getItem("token");
  const ehArquivo = opcoes.body instanceof FormData;

  const resp = await fetch(`${API_URL}${caminho}`, {
    ...opcoes,
    headers: {
      // com FormData o navegador define o Content-Type sozinho (multipart)
      ...(!ehArquivo && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...opcoes.headers
    }
  });

  // token expirou (8h) ou é inválido -> limpa e manda logar de novo
  if (resp.status === 401 && token) {
    const eraFuncionario = dadosDoToken()?.tipo === "funcionario";
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioNome");
    // login é um só para cliente e funcionário; só o cliente volta para a página de onde veio
    if (!eraFuncionario) guardarDestino();
    navegar(PAGINAS.login);
  }
  return resp;
}

// estado de login
// Lê o payload do JWT (id, nome, email, tipo) sem precisar de rota nova
export function dadosDoToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map(c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// "cliente", "funcionario" ou null (deslogado ou token vencido)
export function tipoLogin() {
  const dados = dadosDoToken();
  if (!dados) return null;
  if (dados.exp && dados.exp * 1000 < Date.now()) {
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioNome");
    return null;
  }
  return dados.tipo || null;
}
export const clienteLogado = () => tipoLogin() === "cliente";
export const funcionarioLogado = () => tipoLogin() === "funcionario";

export function sair() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuarioNome");
  navegar(PAGINAS.inicio);
}

// voltar para a página de onde veio depois do login
// só rotas do próprio site: "/carrinho", "/calendario?pet=3", "/perfil#pets"
const DESTINO_VALIDO = /^\/(?!\/)[a-z0-9_/-]*(\?[^#\s]*)?(#[\w-]*)?$/i;
const TELAS_DE_ENTRADA = /^\/(login|cadastro|esqueci-senha)\b/i; // não faz sentido voltar para elas

export { rotaAtual };

export function guardarDestino(destino) {
  const alvo = destino || rotaAtual() + location.search;
  if (DESTINO_VALIDO.test(alvo) && !TELAS_DE_ENTRADA.test(alvo)) {
    try {
      localStorage.setItem("voltarPara", alvo);
    } catch {}
  }
}

export function destinoAposLogin() {
  let alvo = PAGINAS.inicio;
  try {
    const salvo = localStorage.getItem("voltarPara");
    localStorage.removeItem("voltarPara");
    if (salvo && DESTINO_VALIDO.test(salvo)) alvo = salvo;
  } catch {}
  return alvo;
}

// imagens (produto, blog, perfil, pet)
// O backend guarda "/uploads/abc.png". Aqui o caminho recebe a URL base da API.
// URLs completas e caminhos do site (img/logo.png) passam direto.
export function urlImagem(caminho) {
  if (!caminho) return "";
  if (/^(https?:|data:|blob:)/i.test(caminho)) return caminho;
  if (caminho.startsWith("/uploads")) return `${API_URL}${caminho}`;
  return caminho;
}

export async function enviarImagem(arquivo) {
  const form = new FormData();
  form.append("imagem", arquivo);
  const resp = await api(ENDPOINTS.upload, { method: "POST", body: form });
  const dados = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(dados.msg || "Não foi possível enviar a imagem.");
  return dados.caminho;
}

// Use antes de qualquer ação que precisa de cliente logado (favoritar, carrinho...).
// if (!exigirCliente("Entre para favoritar produtos.")) return;
export function exigirCliente(mensagem) {
  if (clienteLogado()) return true;
  avisoLogin(mensagem);
  return false;
}

export function normalizarProduto(p) {
  const preco = Number(p.preco);
  const promo = p.preco_promocional != null ? Number(p.preco_promocional) : null;
  return {
    id: Number(p.id_produto),
    nome: p.nome,
    descricao: p.descricao || "",
    preco: promo ?? preco, // o que o cliente paga (mesma regra do carrinho no backend)
    de: promo != null && promo < preco ? preco : null,
    imagem: urlImagem(p.imagem_url),
    idCategoria: p.id_categoria,
    categoria: p.categoria || "Outros",
    ativo: p.ativo === undefined ? true : Boolean(p.ativo)
  };
}

// GET /produtos é público: só produtos ativos
export async function buscarProdutos() {
  const resp = await fetch(`${API_URL}${ENDPOINTS.produtos}`);
  if (!resp.ok) throw new Error("Não foi possível carregar os produtos.");
  return (await resp.json()).map(normalizarProduto);
}

export const formatarPreco = valor =>
  Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export async function lerErro(resp, padrao) {
  const dados = await resp.json().catch(() => ({}));
  return dados.msg || dados.mensagem || padrao;
}

export async function adicionarAoCarrinho(idProduto, quantidade = 1) {
  if (!exigirCliente("Para adicionar produtos ao carrinho, entre na sua conta ou crie uma.")) return false;
  const resp = await api(`${ENDPOINTS.carrinho}/itens`, {
    method: "POST",
    body: JSON.stringify({ id_produto: idProduto, quantidade })
  });
  if (!resp.ok) throw new Error(await lerErro(resp, "Não foi possível adicionar ao carrinho."));
  atualizarContadorCarrinho();
  return true;
}

export async function atualizarContadorCarrinho(itens) {
  let total = 0;
  if (clienteLogado()) {
    try {
      if (!itens) {
        const resp = await api(ENDPOINTS.carrinho);
        itens = resp.ok ? (await resp.json()).itens : [];
      }
      total = (itens || []).reduce((soma, item) => soma + Number(item.quantidade || 0), 0);
    } catch {}
  }
  definirContadorCarrinho(total);
}

export async function buscarFavoritos() {
  if (!clienteLogado()) return [];
  const resp = await api(ENDPOINTS.favoritos);
  if (!resp.ok) throw new Error(await lerErro(resp, "Não foi possível carregar seus favoritos."));
  return (await resp.json()).map(normalizarProduto);
}

export async function alternarFavorito(idProduto, favoritar) {
  if (!exigirCliente("Para salvar produtos nos favoritos, entre na sua conta ou crie uma.")) return false;
  const resp = favoritar
    ? await api(ENDPOINTS.favoritos, { method: "POST", body: JSON.stringify({ id_produto: idProduto }) })
    : await api(`${ENDPOINTS.favoritos}/${idProduto}`, { method: "DELETE" });
  // 400 "já está nos favoritos" / 404 "não encontrado" = já estava no estado pedido
  if (!resp.ok && resp.status !== 400 && resp.status !== 404) {
    throw new Error(await lerErro(resp, "Não foi possível atualizar os favoritos."));
  }
  return true;
}

// reduzir foto antes de enviar
// O backend aceita até 2 MB. Aqui a foto vira JPEG de no máximo `lado` px,
// o que deixa até foto de celular bem abaixo do limite.
// quadrada: true recorta no centro (bom para avatar).
export function reduzirImagem(arquivo, { lado = 900, quadrada = false } = {}) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png|webp)$/.test(arquivo.type)) {
      reject(new Error("Escolha uma imagem JPG, PNG ou WEBP."));
      return;
    }
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      let sx = 0,
        sy = 0,
        sw = img.width,
        sh = img.height;
      if (quadrada) {
        const m = Math.min(sw, sh);
        sx = (sw - m) / 2;
        sy = (sh - m) / 2;
        sw = sh = m;
      }
      const escala = Math.min(1, lado / Math.max(sw, sh));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(sw * escala);
      canvas.height = Math.round(sh * escala);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff"; // PNG transparente não fica preto no JPEG
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        blob =>
          blob
            ? resolve(new File([blob], "foto.jpg", { type: "image/jpeg" }))
            : reject(new Error("Não foi possível preparar a imagem.")),
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler essa imagem."));
    };
    img.src = url;
  });
}

/* telefone brasileiro (mesma regra do backend e do app)
   Devolve a mensagem de erro, ou "" se estiver ok. Aceita com ou sem máscara. */
const DDDS_BRASIL = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48,
  49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99
]);
// os 8 últimos em sequência (1234-5678, 8765-4321) ou dois dígitos se repetindo (1212-1212)
function numeroFalso(numero) {
  const fim = numero.slice(-8);
  const passos = [...fim].slice(1).map((c, i) => (Number(c) - Number(fim[i]) + 10) % 10);
  if (passos.every(p => p === 1) || passos.every(p => p === 9)) return true;
  return /^(\d\d)\1{3}$/.test(fim);
}

/* e-mail de verdade (mesma regra do backend e do app)
   Aqui só formato, erro de digitação e e-mail temporário; o backend ainda
   confere se o domínio recebe e-mail. Devolve a mensagem ou "". */
const EMAIL_TYPOS = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.om": "gmail.com",
  "gmail.com.br": "gmail.com",
  "gnail.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmail.comm": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "hotmil.com": "hotmail.com",
  "hotamil.com": "hotmail.com",
  "homail.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outlook.co": "outlook.com",
  "outlook.con": "outlook.com",
  "yaho.com": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "yahoo.com.b": "yahoo.com.br",
  "icloud.co": "icloud.com",
  "iclod.com": "icloud.com",
  "uol.com": "uol.com.br",
  "bol.com": "bol.com.br"
};
const EMAIL_BLOQUEADOS = new Set([
  "mailinator.com",
  "yopmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "sharklasers.com",
  "temp-mail.org",
  "tempmail.com",
  "tempmail.net",
  "tempail.com",
  "tmpmail.org",
  "trashmail.com",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
  "throwawaymail.com",
  "emailondeck.com",
  "mohmal.com",
  "fakeinbox.com",
  "mailnesia.com",
  "1secmail.com",
  "minuteinbox.com",
  "mintemail.com",
  "spamgourmet.com",
  "burnermail.io",
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "teste.com",
  "teste.com.br",
  "email.com.br"
]);
const EMAIL_FORMATO =
  /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9_%+-])?@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
export function erroEmail(valor) {
  const email = String(valor ?? "")
    .trim()
    .toLowerCase();
  if (!email) return "Digite o e-mail.";
  if (!EMAIL_FORMATO.test(email) || email.includes("..")) return "E-mail inválido. Confira se digitou certo.";
  const dominio = email.split("@")[1];
  if (EMAIL_TYPOS[dominio]) return `Confira o e-mail. Você quis dizer @${EMAIL_TYPOS[dominio]}?`;
  if (EMAIL_BLOQUEADOS.has(dominio)) return "Use um e-mail pessoal de verdade (e-mails temporários não são aceitos).";
  return "";
}

/* nome, nome de usuário e CPF (mesmas regras do app: mobile/lib/utils/validators.dart)
   Cada um devolve a mensagem de erro, ou "" se estiver ok. */
export function erroNomeCompleto(valor) {
  const nome = String(valor ?? "").trim();
  if (!nome) return "Digite seu nome completo.";
  if (nome.split(/\s+/).length < 2) return "Informe nome e sobrenome.";
  return "";
}

export const USUARIO_MAX = 30;
export function erroNomeUsuario(valor) {
  const usuario = String(valor ?? "").trim();
  if (!usuario) return "Digite um nome de usuário.";
  if (!/^[a-zA-Z0-9._]{3,30}$/.test(usuario)) return "Nome de usuário: use de 3 a 30 letras, números, ponto ou _.";
  return "";
}

export function cpfValido(valor) {
  const d = String(valor ?? "").replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digito = tamanho => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(d[i]) * (tamanho + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}
export function erroCpf(valor) {
  if (!String(valor ?? "").trim()) return "Digite seu CPF.";
  return cpfValido(valor) ? "" : "CPF inválido. Confira os números.";
}

export function erroTelefone(valor) {
  let d = String(valor ?? "").replace(/\D/g, "");
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  if (d.length !== 10 && d.length !== 11) return "Telefone inválido. Use DDD + número.";
  if (!DDDS_BRASIL.has(Number(d.slice(0, 2)))) return "DDD inválido.";
  const numero = d.slice(2);
  if (/^(\d)\1+$/.test(numero)) return "Telefone inválido.";
  if (numeroFalso(numero)) return "Telefone inválido. Digite seu número de verdade.";
  if (d.length === 11 && numero[0] !== "9") return "Celular deve começar com 9 depois do DDD.";
  if (d.length === 10 && !"2345".includes(numero[0])) return "Telefone fixo inválido.";
  return "";
}

// chamadas com JSON
// erro de rede (TypeError do fetch) vira uma mensagem que a pessoa entende
export const semServidor = err =>
  err instanceof TypeError ? "Não consegui falar com o servidor. O backend está rodando?" : err.message;

export async function pedir(caminho, opcoes, padrao) {
  const resp = await api(caminho, opcoes);
  if (!resp.ok) throw new Error(await lerErro(resp, padrao));
  return resp.json().catch(() => ({}));
}

export const json = (metodo, corpo) => ({ method: metodo, body: corpo ? JSON.stringify(corpo) : undefined });
