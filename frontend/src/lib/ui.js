import { useSyncExternalStore } from "react";

let estado = { aviso: null, toast: null, confirmacao: null, carrinho: 0 };
const ouvintes = new Set();

function mudar(parcial) {
  estado = { ...estado, ...parcial };
  ouvintes.forEach(fn => fn());
}

export function useUi() {
  return useSyncExternalStore(
    fn => {
      ouvintes.add(fn);
      return () => ouvintes.delete(fn);
    },
    () => estado
  );
}

// opcoes.bloqueante: sem botão de fechar (usado quando a página inteira exige login)
// opcoes.destino: página para voltar depois do login
export function avisoLogin(mensagem, opcoes = {}) {
  mudar({ aviso: { mensagem, ...opcoes } });
}
export function fecharAvisoLogin() {
  mudar({ aviso: null });
}

let toastTimer;
let toastId = 0;
export function avisar(mensagem, tipo) {
  toastId += 1;
  mudar({ toast: { mensagem, tipo, id: toastId, visivel: true } });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => mudar({ toast: { ...estado.toast, visivel: false } }), 2600);
}

/* janela de confirmação (no lugar do confirm() do navegador)
   const ok = await confirmar({
     titulo: "Excluir post?",
     mensagem: "Essa ação não pode ser desfeita.",
     botao: "Excluir",          // texto do botão de confirmar (padrão "Confirmar")
     cancelar: "Cancelar",      // texto do botão de voltar
     tipo: "perigo"             // "perigo" (vermelho), "sair", "aviso" ou "padrao"
   });
   Devolve true se a pessoa confirmou; false se cancelou, apertou Esc ou clicou fora. */
let confirmacaoId = 0;
export function confirmar(opcoes) {
  const o = typeof opcoes === "string" ? { mensagem: opcoes } : opcoes || {};
  // se já tinha uma aberta, ela conta como cancelada
  estado.confirmacao?.responder(false);
  return new Promise(resolve => {
    confirmacaoId += 1;
    const id = confirmacaoId;
    const responder = resposta => {
      if (estado.confirmacao?.id === id) mudar({ confirmacao: null });
      resolve(resposta);
    };
    mudar({ confirmacao: { ...o, id, responder } });
  });
}

export function definirContadorCarrinho(total) {
  mudar({ carrinho: total });
}
