// Cada .css redefine body e :root, por isso só o CSS da tela aberta fica ligado.

import { useEffect, useInsertionEffect } from "react";
import { atualizarContadorCarrinho, avisoLogin, clienteLogado, rotaAtual } from "../../lib/api.js";
import { fecharAvisoLogin } from "../../lib/ui.js";

export const MSG_LOGIN = {
  "/carrinho": "Para ver e montar seu carrinho, entre na sua conta ou crie uma.",
  "/controle": "O relatório do seu pet é exclusivo para clientes logados.",
  padrao: "Para acessar esta página, entre na sua conta ou crie uma."
};

function definirMeta(nome, valor) {
  let tag = document.head.querySelector(`meta[name="${nome}"]`);
  if (!valor) {
    tag?.remove();
    return;
  }
  if (!tag) {
    tag = document.createElement("meta");
    tag.name = nome;
    document.head.appendChild(tag);
  }
  tag.content = valor;
}

export default function Tela({
  Pagina,
  css,
  titulo,
  descricao,
  requerLogin = false,
  navegacao = true,
  semIndexar = false
}) {
  // CSS entra antes da pintura da tela e sai quando ela é trocada
  useInsertionEffect(() => {
    const estilo = document.createElement("style");
    estilo.dataset.tela = titulo;
    estilo.textContent = css;
    document.head.appendChild(estilo);
    return () => estilo.remove();
  }, [css, titulo]);

  useEffect(() => {
    document.title = titulo;
    definirMeta("description", descricao);
    definirMeta("robots", semIndexar ? "noindex" : null);
  }, [titulo, descricao, semIndexar]);

  useEffect(() => {
    if (requerLogin && !clienteLogado()) {
      const rota = rotaAtual();
      avisoLogin(MSG_LOGIN[rota] || MSG_LOGIN.padrao, { bloqueante: true, destino: rota + location.search });
    }
    if (navegacao) atualizarContadorCarrinho();
    // ao sair da tela, o aviso "entre na sua conta" dela não vai junto para a próxima
    return () => fecharAvisoLogin();
  }, [requerLogin, navegacao]);

  return <Pagina />;
}
