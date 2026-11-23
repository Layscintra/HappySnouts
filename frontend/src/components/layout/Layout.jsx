import { useEffect, useRef } from "react";
import { Navigate, Outlet, useLocation, useNavigationType } from "react-router";
import { PAGINAS, avisoLogin, clienteLogado, funcionarioLogado, guardarDestino } from "../../lib/api.js";
import { BASE, navegar } from "../../lib/navegar.js";
import Avisos from "./Avisos.jsx";
import { MSG_LOGIN } from "./Tela.jsx";

const semBase = caminho => (BASE !== "/" && caminho.startsWith(BASE) ? caminho.slice(BASE.length) || "/" : caminho);

function useGuardaDosLinks() {
  useEffect(() => {
    // fase de captura: roda antes do <Link>, que não navega se o clique já foi cancelado
    const aoClicar = e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target.closest?.("a[href]");
      if (!link || (link.target && link.target !== "_self")) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin) return;
      const rota = semBase(url.pathname);

      if (rota === PAGINAS.perfil) {
        e.preventDefault();
        if (clienteLogado()) navegar(PAGINAS.perfil + url.hash);
        else if (funcionarioLogado()) navegar(PAGINAS.painelFuncionario);
        else {
          guardarDestino(PAGINAS.perfil + url.hash);
          navegar(PAGINAS.login);
        }
        return;
      }

      if ((rota === "/carrinho" || rota === "/controle") && !clienteLogado()) {
        e.preventDefault();
        avisoLogin(MSG_LOGIN[rota], { destino: rota + url.search });
      }
    };
    document.addEventListener("click", aoClicar, true);
    return () => document.removeEventListener("click", aoClicar, true);
  }, []);
}

// Tela nova começa no topo; link com #ancora rola até ela (espera a tela carregar os dados).
// Voltar/avançar do navegador não mexe na rolagem.
function useRolagem() {
  const { pathname, hash, key } = useLocation();
  const tipo = useNavigationType();
  const primeira = useRef(true);

  useEffect(() => {
    const inicio = primeira.current;
    primeira.current = false;
    if (tipo === "POP" && !inicio) return;

    if (!hash) {
      if (!inicio) window.scrollTo(0, 0);
      return;
    }
    const id = decodeURIComponent(hash.slice(1));
    let tentativas = 0;
    const timer = setInterval(() => {
      const alvo = document.getElementById(id);
      if (alvo || ++tentativas > 40) {
        clearInterval(timer);
        alvo?.scrollIntoView({ block: "start" });
      }
    }, 50);
    return () => clearInterval(timer);
  }, [pathname, hash, key, tipo]);
}

export default function Layout() {
  useGuardaDosLinks();
  useRolagem();
  return (
    <>
      <Outlet />
      <Avisos />
    </>
  );
}

// Endereços antigos do site (produtos.html?q=..., perfil.html#pets) continuam funcionando
export function RotaAntigaOuInicio() {
  const { pathname, search, hash } = useLocation();
  const antiga = pathname.match(/\/([a-z0-9-]+)\.html$/i);
  const rota = antiga ? (antiga[1] === "index" ? "/" : `/${antiga[1]}`) : "/";
  return <Navigate to={rota + search + hash} replace />;
}
