// Para navegar fora dos componentes (api.js, timers). Dentro deles, use <Link>.

// "/" ou "/pasta" quando o site fica numa subpasta (vite.config.js -> base)
export const BASE = import.meta.env.BASE_URL.replace(/\/+$/, "") || "/";

let roteador = null;
export function definirRoteador(r) {
  roteador = r;
}

export function navegar(para, opcoes) {
  if (roteador) roteador.navigate(para, opcoes);
  else window.location.assign((BASE === "/" ? "" : BASE) + para);
}

export function rotaAtual() {
  const caminho = window.location.pathname;
  const semBase = BASE !== "/" && caminho.startsWith(BASE) ? caminho.slice(BASE.length) : caminho;
  return semBase || "/";
}
