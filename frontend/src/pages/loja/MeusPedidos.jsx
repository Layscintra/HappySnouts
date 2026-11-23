import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import Footer from "../../components/layout/Footer.jsx";
import Header from "../../components/layout/Header.jsx";
import IconesTopo from "../../components/layout/IconesTopo.jsx";
import { ENDPOINTS, formatarPreco, urlImagem, pedir, semServidor } from "../../lib/api.js";
import { confirmar } from "../../lib/ui.js";

const ETAPAS = {
  recebido: { rotulo: "Recebido", descricao: "A loja recebeu seu pedido", tom: "azul", icone: "recibo" },
  em_preparacao: {
    rotulo: "Em preparação",
    descricao: "Separando e embalando os produtos",
    tom: "laranja",
    icone: "caixa"
  },
  enviado: { rotulo: "A caminho", descricao: "Saiu para entrega", tom: "roxo", icone: "caminhao" },
  entregue: { rotulo: "Entregue", descricao: "Pedido entregue", tom: "verde", icone: "ok" },
  cancelado: { rotulo: "Cancelado", descricao: "Pedido cancelado", tom: "vermelho", icone: "x" }
};
const FLUXO = ["recebido", "em_preparacao", "enviado", "entregue"];
const podeCancelar = status => status === "recebido" || status === "em_preparacao";

const FILTROS = [
  ["todos", "Todos", () => true],
  ["andamento", "Em andamento", s => podeCancelar(s)],
  ["caminho", "A caminho", s => s === "enviado"],
  ["entregues", "Entregues", s => s === "entregue"],
  ["cancelados", "Cancelados", s => s === "cancelado"]
];

const PAGAMENTO = {
  pendente: { rotulo: "Aguardando pagamento", tom: "laranja" },
  aprovado: { rotulo: "Pagamento aprovado", tom: "verde" },
  recusado: { rotulo: "Pagamento recusado", tom: "vermelho" },
  cancelado: { rotulo: "Pagamento cancelado", tom: "vermelho" },
  estornado: { rotulo: "Pagamento estornado", tom: "vermelho" }
};

const dataHora = d =>
  d
    ? new Date(d).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "";
const qtdItens = p => (p.itens || []).reduce((s, i) => s + Number(i.quantidade || 0), 0);
const idDaUrl = () => new URLSearchParams(location.search).get("pedido");

function descricaoPagamento(p) {
  const pg = p.pagamento;
  if (!pg) return p.forma_pagamento || "Não informado";
  return [
    pg.forma_nome,
    pg.cartao?.ultimos_digitos ? `${pg.cartao.bandeira || "Cartão"} •••• ${pg.cartao.ultimos_digitos}` : null,
    pg.parcelas > 1 ? `${pg.parcelas}x sem juros` : null
  ]
    .filter(Boolean)
    .join(" • ");
}

const CAMINHOS = {
  recibo: <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z M9 8h6 M9 12h6 M9 16h3" />,
  caixa: <path d="m12 3 9 5-9 5-9-5 9-5Z M3 8v9l9 5 9-5V8 M12 13v9" />,
  caminhao: <path d="M2 6h11v10H2z M13 10h4l4 4v2h-8 M6.5 19a1.8 1.8 0 1 0 0-.01 M17.5 19a1.8 1.8 0 1 0 0-.01" />,
  ok: <path d="M20 6 9 17l-5-5" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  voltar: <path d="m15 6-6 6 6 6" />,
  seta: <path d="m9 6 6 6-6 6" />,
  local: (
    <path d="M12 21s7-6.4 7-11.4a7 7 0 1 0-14 0C5 14.6 12 21 12 21Z M12 7.2a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 1 0 0-4.8" />
  ),
  raio: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  cartao: <path d="M3 6h18v12H3z M3 10h18 M7 15h4" />,
  copiar: <path d="M9 9h11v11H9z M5 15H4V4h11v1" />,
  info: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 11v5 M12 8h.01" />,
  relogio: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5l3 2" />
};
const Icone = ({ id, className = "mp-i" }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    {CAMINHOS[id]}
  </svg>
);

const Selo = ({ status }) => {
  const e = ETAPAS[status] || ETAPAS.recebido;
  return (
    <span className={`mp-selo mp-selo--${e.tom}`}>
      <Icone id={e.icone} className="mp-selo__i" />
      {e.rotulo}
    </span>
  );
};

function Miniatura({ item }) {
  const [erro, setErro] = useState(false);
  const src = item.imagem_url ? urlImagem(item.imagem_url) : "";
  return (
    <span className="mp-mini">
      {src && !erro ? <img src={src} alt="" loading="lazy" onError={() => setErro(true)} /> : <Icone id="caixa" />}
    </span>
  );
}

const Progresso = ({ status }) => {
  const atual = FLUXO.indexOf(status);
  return (
    <div className="mp-progresso" aria-hidden="true">
      {FLUXO.map((s, i) => (
        <span key={s} className={i <= atual ? `on mp-tom--${ETAPAS[status].tom}` : ""} />
      ))}
    </div>
  );
};

function Lista({ pedidos, aoAbrir }) {
  const [filtro, setFiltro] = useState("todos");
  const teste = FILTROS.find(f => f[0] === filtro)[2];
  const visiveis = pedidos.filter(p => teste(p.status));

  return (
    <>
      <div className="mp-filtros" role="tablist" aria-label="Filtrar pedidos por etapa">
        {FILTROS.map(([id, texto, t]) => {
          const n = pedidos.filter(p => t(p.status)).length;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={filtro === id}
              className={filtro === id ? "on" : ""}
              onClick={() => setFiltro(id)}
            >
              {texto}
              <em>{n}</em>
            </button>
          );
        })}
      </div>

      {!visiveis.length ? (
        <div className="mp-card mp-vazio">
          <span className="mp-vazio__icone">
            <Icone id="recibo" />
          </span>
          <h2>
            {filtro === "todos"
              ? "Você ainda não fez nenhum pedido"
              : `Nenhum pedido "${FILTROS.find(f => f[0] === filtro)[1]}"`}
          </h2>
          {filtro === "todos" && (
            <>
              <p>Quando você comprar, acompanha cada etapa da entrega por aqui.</p>
              <Link className="mp-btn" to="/produtos">
                Ver produtos
              </Link>
            </>
          )}
        </div>
      ) : (
        <ul className="mp-lista">
          {visiveis.map(p => (
            <li key={p.id_pedido}>
              <button type="button" className="mp-card mp-pedido" onClick={() => aoAbrir(p)}>
                <span className="mp-pedido__topo">
                  <strong>Pedido {p.numero_pedido}</strong>
                  <Selo status={p.status} />
                </span>
                <span className="mp-pedido__sub">
                  {dataHora(p.data_pedido)} • {qtdItens(p)} {qtdItens(p) === 1 ? "item" : "itens"}
                </span>
                <span className="mp-pedido__linha">
                  <span className="mp-pedido__minis">
                    {(p.itens || []).slice(0, 4).map((item, i) => (
                      <Miniatura key={i} item={item} />
                    ))}
                    {(p.itens || []).length > 4 && <span className="mp-mais">+{p.itens.length - 4}</span>}
                  </span>
                  <span className="mp-pedido__total">{formatarPreco(p.total)}</span>
                  <Icone id="seta" className="mp-i mp-pedido__seta" />
                </span>
                {p.status !== "cancelado" && <Progresso status={p.status} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Detalhe({ pedido: p, aoVoltar, aoAtualizar, avisar }) {
  const [cancelando, setCancelando] = useState(false);
  const cancelado = p.status === "cancelado";
  const historico = p.historico || [];
  const dataDe = status => {
    const h = historico.filter(e => e.status === status);
    return h.length ? h[h.length - 1].data_hora : null;
  };
  const notaDe = status => {
    const h = historico.filter(e => e.status === status && e.observacao);
    return h.length ? h[h.length - 1].observacao : null;
  };
  // cancelado: mostra só as etapas que aconteceram (como no app)
  const etapas = cancelado ? [...new Set(historico.map(e => e.status))] : FLUXO;
  if (cancelado && !etapas.includes("cancelado")) etapas.push("cancelado");
  const atual = cancelado ? etapas.length - 1 : FLUXO.indexOf(p.status);

  const pg = p.pagamento;
  const pix = pg?.forma === "pix" && pg.status === "pendente";
  const pixAberto = pix && pg.pix_copia_cola && (!pg.pix_expira_em || new Date(pg.pix_expira_em) > new Date());

  const cancelar = async () => {
    const ok = await confirmar({
      titulo: `Cancelar o pedido ${p.numero_pedido}?`,
      mensagem: "Depois de cancelado, o pedido não pode ser retomado.",
      botao: "Cancelar pedido",
      cancelar: "Voltar",
      tipo: "perigo"
    });
    if (!ok) return;
    setCancelando(true);
    try {
      const novo = await pedir(
        `${ENDPOINTS.pedidos}/${p.id_pedido}/cancelar`,
        { method: "PATCH" },
        "Não foi possível cancelar o pedido."
      );
      aoAtualizar(novo);
      avisar("Pedido cancelado");
    } catch (err) {
      avisar(semServidor(err), true);
    } finally {
      setCancelando(false);
    }
  };

  const copiar = async (texto, msg) => {
    try {
      await navigator.clipboard.writeText(texto);
      avisar(msg);
    } catch {
      avisar("Não consegui copiar. Selecione o texto e copie manualmente.", true);
    }
  };

  return (
    <div className="mp-detalhe">
      <button type="button" className="mp-voltar" onClick={aoVoltar}>
        <Icone id="voltar" /> Meus pedidos
      </button>

      <section className="mp-card mp-cabeca">
        <span className={`mp-cabeca__icone mp-tom--${ETAPAS[p.status].tom}`}>
          <Icone id={ETAPAS[p.status].icone} />
        </span>
        <div>
          <h2>Pedido {p.numero_pedido}</h2>
          <p>Feito em {dataHora(p.data_pedido)}</p>
        </div>
        <Selo status={p.status} />
      </section>

      <div className="mp-grade">
        <section className="mp-card" aria-labelledby="tLinha">
          <h3 id="tLinha">Acompanhe seu pedido</h3>
          <ol className="mp-linha">
            {etapas.map((s, i) => {
              const feito = i <= atual;
              const e = ETAPAS[s];
              const data = dataDe(s);
              const nota = notaDe(s);
              const tom = feito ? (cancelado && i === atual ? "vermelho" : e.tom) : "";
              return (
                <li
                  key={s}
                  className={
                    (feito ? "feito " : "") +
                    (i === atual ? "atual " : "") +
                    (i < atual ? "passou " : "") +
                    (tom ? `mp-tom--${tom}` : "")
                  }
                >
                  <span className="mp-linha__bola">
                    <Icone id={feito && i < atual ? "ok" : e.icone} />
                  </span>
                  <div>
                    <strong>{e.rotulo}</strong>
                    <small>
                      {e.descricao}
                      {data ? ` • ${dataHora(data)}` : ""}
                    </small>
                    {nota && <em>{nota}</em>}
                  </div>
                </li>
              );
            })}
          </ol>
          {podeCancelar(p.status) && (
            <div className="mp-cancelar">
              <p>Você pode cancelar enquanto o pedido não sai para entrega.</p>
              <button type="button" className="mp-btn mp-btn--perigo" onClick={cancelar} disabled={cancelando}>
                {cancelando ? "Cancelando..." : "Cancelar pedido"}
              </button>
            </div>
          )}
        </section>

        <div className="mp-coluna">
          <section className="mp-card" aria-labelledby="tItens">
            <h3 id="tItens">Itens</h3>
            <ul className="mp-itens">
              {(p.itens || []).map((item, i) => (
                <li key={i}>
                  <Miniatura item={item} />
                  <div>
                    <span>{item.nome}</span>
                    <small>
                      {item.quantidade} × {formatarPreco(item.preco_unico)}
                    </small>
                  </div>
                  <b>{formatarPreco(item.preco_unico * item.quantidade)}</b>
                </li>
              ))}
            </ul>
          </section>

          <section className="mp-card" aria-labelledby="tEntrega">
            <h3 id="tEntrega">Entrega</h3>
            <p className="mp-info">
              <Icone id={p.tipo_entrega === "rapida" ? "raio" : "caminhao"} />
              {p.tipo_entrega === "rapida" ? "Entrega rápida" : "Entrega normal"}
            </p>
            <p className="mp-info">
              <Icone id="local" />
              <span>
                {p.endereco}, {p.numero}
                <br />
                {p.bairro} - {p.cidade}/{p.estado} • CEP {p.cep}
              </span>
            </p>
            {p.codigo_rastreio && (
              <button
                type="button"
                className="mp-rastreio"
                onClick={() => copiar(p.codigo_rastreio, "Código de rastreio copiado")}
              >
                <Icone id="copiar" /> Rastreio: <b>{p.codigo_rastreio}</b> <small>(clique para copiar)</small>
              </button>
            )}
          </section>

          <section className="mp-card" aria-labelledby="tPagamento">
            <h3 id="tPagamento">Pagamento</h3>
            <p className="mp-info">
              <Icone id="cartao" />
              {descricaoPagamento(p)}
            </p>
            {pg && (
              <p className="mp-pg">
                <span className={`mp-selo mp-selo--${(PAGAMENTO[pg.status] || PAGAMENTO.pendente).tom}`}>
                  {(PAGAMENTO[pg.status] || PAGAMENTO.pendente).rotulo}
                </span>
                {pg.data_pagamento && <small>Pago em {dataHora(pg.data_pagamento)}</small>}
              </p>
            )}
            {pixAberto && (
              <div className="mp-pix">
                <strong>Pix copia e cola</strong>
                <small>
                  Copie o código e cole na área Pix do app do seu banco.
                  {pg.pix_expira_em ? ` Válido até ${dataHora(pg.pix_expira_em)}.` : ""}
                </small>
                <code>{pg.pix_copia_cola}</code>
                <button
                  type="button"
                  className="mp-btn"
                  onClick={() => copiar(pg.pix_copia_cola, "Código Pix copiado")}
                >
                  <Icone id="copiar" /> Copiar código Pix
                </button>
              </div>
            )}
            {pix && !pixAberto && (
              <p className="mp-info mp-info--aviso">
                <Icone id="relogio" />
                <span>
                  O prazo do Pix acabou. Fale com a gente pelo <Link to="/ajuda#fale-conosco">Fale conosco</Link> para
                  receber um novo código.
                </span>
              </p>
            )}
            {pg?.status === "pendente" && pg.forma === "boleto" && (
              <p className="mp-info mp-info--aviso">
                <Icone id="info" />
                Assim que o boleto for compensado, a loja confirma o pagamento e você recebe um aviso.
              </p>
            )}
            <dl className="mp-valores">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatarPreco(p.subtotal)}</dd>
              </div>
              <div>
                <dt>Frete</dt>
                <dd>{Number(p.frete) ? formatarPreco(p.frete) : "Grátis"}</dd>
              </div>
              {Number(p.desconto) > 0 && (
                <div>
                  <dt>Desconto{p.cupom ? ` (${p.cupom})` : ""}</dt>
                  <dd>- {formatarPreco(p.desconto)}</dd>
                </div>
              )}
              <div className="total">
                <dt>Total</dt>
                <dd>{formatarPreco(p.total)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function MeusPedidos() {
  const [pedidos, setPedidos] = useState(null);
  const [erro, setErro] = useState("");
  const [aberto, setAberto] = useState(idDaUrl);
  const [aviso, setAviso] = useState({ texto: "", erro: false, on: false });

  const avisar = useCallback((texto, ehErro = false) => {
    setAviso({ texto, erro: ehErro, on: true });
    clearTimeout(avisar.t);
    avisar.t = setTimeout(() => setAviso(a => ({ ...a, on: false })), 2800);
  }, []);

  const carregar = useCallback(async () => {
    try {
      setPedidos(await pedir(ENDPOINTS.pedidos, {}, "Não foi possível carregar seus pedidos."));
      setErro("");
    } catch (err) {
      setPedidos(p => p ?? []);
      setErro(semServidor(err));
    }
  }, []);

  // carrega ao abrir e atualiza ao voltar para a aba (a loja muda as etapas pelo painel)
  useEffect(() => {
    carregar();
    const aoVoltar = () => document.visibilityState === "visible" && carregar();
    document.addEventListener("visibilitychange", aoVoltar);
    return () => document.removeEventListener("visibilitychange", aoVoltar);
  }, [carregar]);

  // ?pedido=ID no endereço: o Voltar do navegador volta para a lista
  useEffect(() => {
    const aoNavegar = () => setAberto(idDaUrl());
    window.addEventListener("popstate", aoNavegar);
    return () => window.removeEventListener("popstate", aoNavegar);
  }, []);
  const abrir = p => {
    history.pushState(null, "", `?pedido=${p.id_pedido}`);
    setAberto(String(p.id_pedido));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const voltar = () => {
    history.pushState(null, "", location.pathname);
    setAberto(null);
  };
  const atualizar = novo => setPedidos(lista => lista.map(p => (p.id_pedido === novo.id_pedido ? novo : p)));

  const pedidoAberto = aberto && pedidos ? pedidos.find(p => String(p.id_pedido) === String(aberto)) : null;

  let conteudo;
  if (pedidos === null) conteudo = <p className="mp-estado">Carregando seus pedidos... 🐾</p>;
  else if (erro && !pedidos.length)
    conteudo = (
      <div className="mp-card mp-vazio">
        <h2>Não foi possível carregar seus pedidos</h2>
        <p>{erro}</p>
        <button type="button" className="mp-btn" onClick={carregar}>
          Tentar de novo
        </button>
      </div>
    );
  else if (aberto && !pedidoAberto)
    conteudo = (
      <div className="mp-card mp-vazio">
        <h2>Pedido não encontrado</h2>
        <button type="button" className="mp-btn" onClick={voltar}>
          Ver meus pedidos
        </button>
      </div>
    );
  else if (pedidoAberto)
    conteudo = <Detalhe pedido={pedidoAberto} aoVoltar={voltar} aoAtualizar={atualizar} avisar={avisar} />;
  else conteudo = <Lista pedidos={pedidos} aoAbrir={abrir} />;

  return (
    <>
      <IconesTopo />
      <Header />
      <main className="mp hs-container">
        <header className="mp-topo">
          <h1>
            Meus <span>pedidos</span>
          </h1>
          <p>Acompanhe cada etapa da entrega e cancele enquanto o pedido ainda não saiu.</p>
        </header>
        {conteudo}
      </main>
      <div
        className={"mp-toast" + (aviso.on ? " on" : "") + (aviso.erro ? " erro" : "")}
        role="status"
        aria-live="polite"
      >
        {aviso.texto}
      </div>
      <Footer />
    </>
  );
}
