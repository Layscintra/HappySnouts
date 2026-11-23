// O CSS de cada tela carrega na ordem tokens -> tela -> base.

import { createBrowserRouter } from "react-router";
import Layout, { RotaAntigaOuInicio } from "./components/layout/Layout.jsx";
import Tela from "./components/layout/Tela.jsx";
import { BASE } from "./lib/navegar.js";

const tokens = () => import("./styles/tokens.css?inline");
const base = () => import("./styles/base.css?inline");

// tela(caminho, () => import(componente), [CSS da tela], { titulo, descricao, requerLogin, navegacao })
function tela(path, carregarPagina, estilos, opcoes) {
  return {
    path,
    lazy: async () => {
      const [pagina, ...css] = await Promise.all([carregarPagina(), ...estilos.map(carregar => carregar())]);
      const Pagina = pagina.default;
      const texto = css.map(m => m.default).join("\n");
      return { Component: () => <Tela Pagina={Pagina} css={texto} {...opcoes} /> };
    }
  };
}

const rotas = [
  tela("/", () => import("./pages/Inicio.jsx"), [tokens, () => import("./styles/inicio.css?inline"), base], {
    titulo: "Happy Snouts | Seu pet, sua prioridade",
    descricao: "Happy Snouts: tudo o que o seu pet precisa em um só lugar. Produtos, ofertas e o programa Amigo Snouts."
  }),
  tela(
    "/produtos",
    () => import("./pages/loja/Produtos.jsx"),
    [tokens, () => import("./styles/produtos.css?inline"), base],
    {
      titulo: "Produtos | Happy Snouts",
      descricao: "Encontre rações, brinquedos, acessórios e produtos de cuidado para seu pet na Happy Snouts."
    }
  ),
  tela(
    "/favoritos",
    () => import("./pages/loja/Favoritos.jsx"),
    [tokens, () => import("./styles/produtos.css?inline"), base],
    {
      titulo: "Meus favoritos | Happy Snouts",
      descricao: "Os produtos que você salvou na Happy Snouts.",
      requerLogin: true
    }
  ),
  tela("/blog", () => import("./pages/Blog.jsx"), [tokens, () => import("./styles/blog.css?inline"), base], {
    titulo: "Blog Happy Snouts"
  }),
  tela("/ajuda", () => import("./pages/Ajuda.jsx"), [tokens, () => import("./styles/ajuda.css?inline"), base], {
    titulo: "Atendimento | Happy Snouts"
  }),
  tela(
    "/carrinho",
    () => import("./pages/loja/Carrinho.jsx"),
    [tokens, () => import("./styles/carrinho.css?inline"), base],
    {
      titulo: "Carrinho de compras | Happy Snouts",
      requerLogin: true
    }
  ),
  tela(
    "/finalizar",
    () => import("./pages/loja/Finalizar.jsx"),
    [tokens, () => import("./styles/carrinho.css?inline"), () => import("./styles/finalizar.css?inline"), base],
    { titulo: "Finalizar compra | Happy Snouts", requerLogin: true }
  ),
  tela(
    "/pedidos",
    () => import("./pages/loja/MeusPedidos.jsx"),
    [tokens, () => import("./styles/pedidos.css?inline"), base],
    {
      titulo: "Meus pedidos | Happy Snouts",
      requerLogin: true
    }
  ),
  tela(
    "/controle",
    () => import("./pages/pet/Controle.jsx"),
    [tokens, () => import("./styles/controle.css?inline"), () => import("./styles/dispositivos.css?inline"), base],
    { titulo: "Happy Snouts | Dispositivos", requerLogin: true }
  ),
  tela(
    "/calendario",
    () => import("./pages/pet/Calendario.jsx"),
    [tokens, () => import("./styles/calendario.css?inline"), base],
    {
      titulo: "Agenda do pet | Happy Snouts",
      descricao: "Calendário de vacinas, consultas, banho e tosa e remédios dos seus pets.",
      requerLogin: true
    }
  ),
  tela(
    "/peso",
    () => import("./pages/pet/HistoricoPeso.jsx"),
    [tokens, () => import("./styles/calendario.css?inline"), () => import("./styles/peso.css?inline"), base],
    { titulo: "Histórico de peso | Happy Snouts", descricao: "Histórico de peso dos seus pets.", requerLogin: true }
  ),
  tela(
    "/perfil",
    () => import("./pages/perfil/Perfil.jsx"),
    [tokens, () => import("./styles/perfil.css?inline"), base],
    {
      titulo: "Meu perfil | Happy Snouts",
      requerLogin: true
    }
  ),
  tela("/login", () => import("./pages/conta/Login.jsx"), [tokens, () => import("./styles/login.css?inline"), base], {
    titulo: "Login | Happy Snouts",
    navegacao: false
  }),
  tela(
    "/cadastro",
    () => import("./pages/conta/Cadastro.jsx"),
    [tokens, () => import("./styles/cadastro.css?inline"), base, () => import("./styles/auth-tela.css?inline")],
    { titulo: "Crie sua conta | Happy Snouts", navegacao: false }
  ),
  tela(
    "/esqueci-senha",
    () => import("./pages/conta/EsqueciSenha.jsx"),
    [tokens, base, () => import("./styles/auth-tela.css?inline")],
    { titulo: "Esqueci minha senha | Happy Snouts", navegacao: false }
  ),
  tela(
    "/painel-funcionario",
    () => import("./pages/painel/PainelFuncionario.jsx"),
    [tokens, () => import("./styles/painel.css?inline"), base],
    { titulo: "Painel do funcionário | Happy Snouts", navegacao: false, semIndexar: true }
  ),
  // endereço desconhecido ou antigo (*.html) -> rota certa ou início
  { path: "*", Component: RotaAntigaOuInicio }
];

export const roteador = createBrowserRouter([{ Component: Layout, HydrateFallback: () => null, children: rotas }], {
  basename: BASE
});
