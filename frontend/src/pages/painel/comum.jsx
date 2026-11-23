import { useEffect, useState } from "react";
import { urlImagem } from "../../lib/api.js";

const SIMBOLOS = {
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  box: <path d="M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8" />,
  tag: (
    <>
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </>
  ),
  book: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />,
  receipt: <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM9 8h6M9 12h6M9 16h3" />,
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z" />,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  plus: <path d="M12 5v14M5 12h14" />,
  pen: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />,
  off: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </>
  ),
  trash: <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />,
  x: <path d="M18 6L6 18M6 6l12 12" />,
  out: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  camera: (
    <>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  send: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />,
  check: <path d="M20 6 9 17l-5-5" />,
  refresh: <path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6" />,
  back: <path d="M15 18l-6-6 6-6" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 6 10 7 10-7" />
    </>
  ),
  phone: (
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
  ),
  pin: (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  card: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>
  ),
  inbox: <path d="M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z" />,
  truck: (
    <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
  ),
  prep: <path d="M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5" />,
  today: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  money: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </>
  ),
  trend: <path d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" />,
  paw: (
    <g fill="currentColor" stroke="none">
      <ellipse cx="5.5" cy="11" rx="2" ry="2.6" />
      <ellipse cx="9.5" cy="6.5" rx="2" ry="2.6" />
      <ellipse cx="14.5" cy="6.5" rx="2" ry="2.6" />
      <ellipse cx="18.5" cy="11" rx="2" ry="2.6" />
      <path d="M12 11c-3 0-6 3.2-6 5.7 0 2.7 2.5 3.3 6 3.3s6-.6 6-3.3C18 14.2 15 11 12 11z" />
    </g>
  )
};

export function PainelIcones() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      {Object.entries(SIMBOLOS).map(([id, desenho]) => (
        <symbol id={id} viewBox="0 0 24 24" key={id}>
          {desenho}
        </symbol>
      ))}
    </svg>
  );
}

export const Icone = ({ id, className = "" }) => (
  <svg className={`i ${className}`} aria-hidden="true">
    <use href={`#${id}`} />
  </svg>
);

export const norm = v =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const dinheiro = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const reais = v => dinheiro.format(Number(v) || 0);
export const reaisCurto = v => {
  const n = Number(v) || 0;
  if (n >= 1000) return `R$ ${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return reais(n);
};
export const inteiro = v => (Number(v) || 0).toLocaleString("pt-BR");

const data = v => (v ? new Date(String(v).replace(" ", "T")) : null);
export const paraData = data;
export const dataCurta = v => data(v)?.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) ?? "";
export const dataHora = v =>
  data(v)?.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }) ?? "";
export function tempoAtras(v) {
  const d = data(v);
  if (!d) return "";
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const dias = Math.round(h / 24);
  if (dias < 7) return dias === 1 ? "ontem" : `há ${dias} dias`;
  return dataCurta(v);
}

// status (sempre com texto, nunca só a cor)
export const STATUS_PEDIDO = {
  recebido: { rotulo: "Recebido", tom: "azul" },
  em_preparacao: { rotulo: "Em preparação", tom: "ambar" },
  enviado: { rotulo: "A caminho", tom: "roxo" },
  entregue: { rotulo: "Entregue", tom: "verde" },
  cancelado: { rotulo: "Cancelado", tom: "cinza" }
};
export const STATUS_PAGAMENTO = {
  pendente: { rotulo: "Aguardando pagamento", curto: "Pendente", tom: "ambar" },
  aprovado: { rotulo: "Pagamento aprovado", curto: "Pago", tom: "verde" },
  recusado: { rotulo: "Pagamento recusado", curto: "Recusado", tom: "vermelho" },
  cancelado: { rotulo: "Pagamento cancelado", curto: "Cancelado", tom: "cinza" },
  estornado: { rotulo: "Pagamento estornado", curto: "Estornado", tom: "cinza" }
};
export const STATUS_MENSAGEM = {
  aberta: { rotulo: "Aguardando resposta", tom: "ambar" },
  respondida: { rotulo: "Respondida", tom: "verde" },
  fechada: { rotulo: "Encerrada", tom: "cinza" }
};

export const Selo = ({ tom = "cinza", children }) => <span className={`selo selo--${tom}`}>{children}</span>;

export const ehImagem = icone => /^(\/uploads|https?:)/i.test(icone || "");
// categorias antigas têm ícone vazio ou nome de arquivo ("brinquedo.png"): aí mostra a patinha
export const emoji = icone => (icone && !ehImagem(icone) && !/[\w./]/.test(icone) ? icone : "🐾");

export function IconeCategoria({ icone, className = "", estilo }) {
  const [erro, setErro] = useState(false);
  useEffect(() => setErro(false), [icone]);
  if (ehImagem(icone) && !erro) {
    return (
      <span className={`cat-ico ${className}`} style={estilo} aria-hidden="true">
        <img src={urlImagem(icone)} alt="" loading="lazy" onError={() => setErro(true)} />
      </span>
    );
  }
  return (
    <span className={`cat-ico ${className}`} style={estilo} aria-hidden="true">
      {emoji(icone)}
    </span>
  );
}

export function Foto({ src }) {
  const [erro, setErro] = useState(false);
  useEffect(() => setErro(false), [src]);
  return (
    <>
      <Icone id="paw" />
      {src && !erro ? <img src={src} alt="" loading="lazy" onError={() => setErro(true)} /> : null}
    </>
  );
}

export const BotaoSalvar = ({ salvando, texto = "Salvar" }) => (
  <button className="btn" disabled={salvando}>
    {salvando ? "Salvando..." : texto}
  </button>
);

export function Cabecalho({ titulo, subtitulo, children }) {
  return (
    <div className="sec-topo">
      <div>
        <h1>{titulo}</h1>
        {subtitulo && <p>{subtitulo}</p>}
      </div>
      {children && <div className="sec-acoes">{children}</div>}
    </div>
  );
}

export function Estado({ erro, carregando, vazio, aoTentar, children }) {
  if (erro)
    return (
      <div className="estado">
        <p>{erro}</p>
        {aoTentar && (
          <button type="button" className="ghost borda" onClick={aoTentar}>
            <Icone id="refresh" />
            Tentar de novo
          </button>
        )}
      </div>
    );
  if (carregando)
    return (
      <div className="estado" aria-busy="true">
        <p>Carregando...</p>
      </div>
    );
  if (vazio) return <div className="estado">{vazio}</div>;
  return children;
}
