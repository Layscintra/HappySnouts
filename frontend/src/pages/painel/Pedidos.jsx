import { useEffect, useState } from "react";
import Dialogo from "../../components/Dialogo.jsx";
import { ENDPOINTS, avisar, urlImagem, pedir, semServidor, json } from "../../lib/api.js";
import { confirmar } from "../../lib/ui.js";
import {
  Cabecalho,
  Estado,
  Foto,
  Icone,
  STATUS_PAGAMENTO,
  STATUS_PEDIDO,
  Selo,
  dataHora,
  inteiro,
  norm,
  reais,
  tempoAtras
} from "./comum.jsx";

const A_FAZER = ["recebido", "em_preparacao", "enviado"];

const ACAO_STATUS = {
  em_preparacao: "Começar a preparar",
  enviado: "Marcar como enviado",
  entregue: "Marcar como entregue",
  cancelado: "Cancelar pedido"
};
const ACAO_PAGAMENTO = {
  aprovado: "Confirmar pagamento",
  recusado: "Recusar pagamento",
  pendente: "Voltar para pendente",
  cancelado: "Cancelar pagamento",
  estornado: "Estornar pagamento"
};

export const numeroPedido = p => p.numero_pedido || `#${String(p.id_pedido).padStart(5, "0")}`;
export const qtdItens = p => (p.itens || []).reduce((s, i) => s + (Number(i.quantidade) || 0), 0);

function Metrica({ icone, rotulo, valor, tom }) {
  return (
    <div className="metrica">
      <span className={`metrica-ico tom-${tom}`}>
        <Icone id={icone} />
      </span>
      <div>
        <b>{valor}</b>
        <span>{rotulo}</span>
      </div>
    </div>
  );
}

export default function Pedidos({ pedidos, resumo, erro, recarregar }) {
  const [filtro, setFiltro] = useState("afazer");
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(null);

  const lista = pedidos || [];
  const porStatus = resumo?.por_status || {};
  const contar = s => porStatus[s] ?? lista.filter(p => p.status === s).length;

  const q = norm(busca.trim());
  const visiveis = lista.filter(p => {
    if (filtro === "afazer" && !A_FAZER.includes(p.status)) return false;
    if (filtro !== "afazer" && filtro !== "todos" && p.status !== filtro) return false;
    if (!q) return true;
    return (
      norm(numeroPedido(p)).includes(q) ||
      String(p.id_pedido) === q.replace("#", "") ||
      norm(p.cliente_nome).includes(q) ||
      norm(p.cliente_email).includes(q)
    );
  });

  const filtros = [
    ["afazer", "Novos", A_FAZER.reduce((s, st) => s + contar(st), 0)],
    ...Object.entries(STATUS_PEDIDO).map(([id, s]) => [id, s.rotulo, contar(id)]),
    ["todos", "Todos", lista.length]
  ];

  const pedidoAberto = lista.find(p => p.id_pedido === aberto) || null;

  return (
    <>
      <Cabecalho
        titulo="Pedidos"
        subtitulo="Acompanhe e avance os pedidos da loja. A lista atualiza sozinha a cada 30 segundos."
      >
        <button type="button" className="ghost borda" onClick={recarregar}>
          <Icone id="refresh" />
          Atualizar
        </button>
      </Cabecalho>

      <div className="metricas">
        <Metrica icone="inbox" rotulo="Novos" valor={inteiro(contar("recebido"))} tom="azul" />
        <Metrica icone="prep" rotulo="Preparando" valor={inteiro(contar("em_preparacao"))} tom="ambar" />
        <Metrica icone="truck" rotulo="A caminho" valor={inteiro(contar("enviado"))} tom="roxo" />
        <Metrica icone="today" rotulo="Pedidos hoje" valor={inteiro(resumo?.pedidos_hoje)} tom="marinho" />
        <Metrica icone="money" rotulo="Vendido hoje" valor={reais(resumo?.faturamento_hoje)} tom="verde" />
        <Metrica icone="trend" rotulo="Total vendido" valor={reais(resumo?.faturamento)} tom="verde" />
      </div>

      <div className="painel-card">
        <div className="barra">
          <div className="chips" role="group" aria-label="Filtrar pedidos">
            {filtros.map(([id, rotulo, n]) => (
              <button
                key={id}
                type="button"
                className="chip"
                aria-pressed={filtro === id}
                onClick={() => setFiltro(id)}
              >
                {rotulo} <span className="chip-n">{n}</span>
              </button>
            ))}
          </div>
          <label className="busca">
            <Icone id="search" />
            <input
              type="search"
              placeholder="Buscar por número ou cliente"
              aria-label="Buscar pedido"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </label>
        </div>

        <Estado
          erro={erro}
          carregando={!pedidos}
          aoTentar={recarregar}
          vazio={
            !visiveis.length &&
            (lista.length
              ? "Nenhum pedido com esses filtros."
              : "Nenhum pedido ainda. Os pedidos feitos no site e no app aparecem aqui.")
          }
        >
          <div className="tabela tabela-pedidos" role="table" aria-label="Pedidos">
            <div className="cab" role="row">
              <span role="columnheader">Pedido</span>
              <span role="columnheader">Cliente</span>
              <span role="columnheader">Itens</span>
              <span role="columnheader">Total</span>
              <span role="columnheader">Pagamento</span>
              <span role="columnheader">Situação</span>
            </div>
            {visiveis.map(p => {
              const pg = p.pagamento && STATUS_PAGAMENTO[p.pagamento.status];
              const st = STATUS_PEDIDO[p.status] || STATUS_PEDIDO.recebido;
              return (
                <button
                  type="button"
                  role="row"
                  className="linha"
                  key={p.id_pedido}
                  onClick={() => setAberto(p.id_pedido)}
                >
                  <span role="cell" className="c-num">
                    <b>{numeroPedido(p)}</b>
                    <small>{tempoAtras(p.data_pedido)}</small>
                  </span>
                  <span role="cell" className="c-cli">
                    <b>{p.cliente_nome || "Cliente"}</b>
                    <small>{p.cliente_email}</small>
                  </span>
                  <span role="cell" className="c-itens">
                    {qtdItens(p) === 1 ? "1 item" : `${qtdItens(p)} itens`}
                  </span>
                  <span role="cell" className="c-total">
                    {reais(p.total)}
                  </span>
                  <span role="cell" className="c-pg">
                    {pg ? <Selo tom={pg.tom}>{pg.curto}</Selo> : <small>{p.forma_pagamento || "-"}</small>}
                  </span>
                  <span role="cell" className="c-st">
                    <Selo tom={st.tom}>{st.rotulo}</Selo>
                  </span>
                </button>
              );
            })}
          </div>
        </Estado>
      </div>

      <ModalPedido pedido={pedidoAberto} aoFechar={() => setAberto(null)} aoMudou={recarregar} />
    </>
  );
}

function ModalPedido({ pedido, aoFechar, aoMudou }) {
  const [acao, setAcao] = useState(null);
  const [obs, setObs] = useState("");
  const [rastreio, setRastreio] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const p = pedido;

  useEffect(() => {
    setAcao(null);
    setObs("");
    setRastreio(p?.codigo_rastreio || "");
    setErro("");
  }, [p?.id_pedido]); // eslint-disable-line react-hooks/exhaustive-deps

  const executar = async (caminho, corpo, aviso) => {
    setSalvando(true);
    setErro("");
    try {
      await pedir(caminho, json("PATCH", corpo), "Não foi possível atualizar o pedido.");
      avisar(aviso);
      setAcao(null);
      setObs("");
      await aoMudou();
    } catch (err) {
      setErro(semServidor(err));
    } finally {
      setSalvando(false);
    }
  };

  const mudarStatus = async e => {
    e.preventDefault();
    if (
      acao === "cancelado" &&
      !(await confirmar({
        titulo: `Cancelar o pedido ${numeroPedido(p)}?`,
        mensagem: "O cliente será avisado do cancelamento.",
        botao: "Cancelar pedido",
        cancelar: "Voltar",
        tipo: "perigo"
      }))
    )
      return;
    executar(
      `${ENDPOINTS.pedidos}/${p.id_pedido}/status`,
      {
        status: acao,
        observacao: obs.trim() || undefined,
        codigo_rastreio: acao === "enviado" ? rastreio.trim() || undefined : undefined
      },
      `Pedido ${numeroPedido(p)}: ${STATUS_PEDIDO[acao].rotulo.toLowerCase()}. O cliente foi avisado.`
    );
  };

  const mudarPagamento = async status => {
    if (
      ["recusado", "cancelado", "estornado"].includes(status) &&
      !(await confirmar({
        titulo: `${ACAO_PAGAMENTO[status]} do pedido ${numeroPedido(p)}?`,
        mensagem: "O status do pagamento muda na hora e o cliente vê a mudança no pedido.",
        botao: ACAO_PAGAMENTO[status],
        cancelar: "Voltar",
        tipo: "perigo"
      }))
    )
      return;
    executar(`${ENDPOINTS.pedidos}/${p.id_pedido}/pagamento`, { status }, STATUS_PAGAMENTO[status].rotulo + ".");
  };

  const st = p && (STATUS_PEDIDO[p.status] || STATUS_PEDIDO.recebido);
  const pg = p?.pagamento;
  const endereco =
    p &&
    [
      [p.endereco, p.numero].filter(Boolean).join(", "),
      p.bairro,
      [p.cidade, p.estado].filter(Boolean).join(" - "),
      p.cep && `CEP ${p.cep}`
    ].filter(Boolean);

  return (
    <Dialogo id="pedidoModal" className="largo" aria-labelledby="pedidoTitulo" aberto={!!p} aoFechar={aoFechar}>
      {p && (
        <div className="mform">
          <header>
            <div>
              <h2 id="pedidoTitulo">Pedido {numeroPedido(p)}</h2>
              <small className="sub">Feito em {dataHora(p.data_pedido)}</small>
            </div>
            <Selo tom={st.tom}>{st.rotulo}</Selo>
            <button type="button" className="x" data-close aria-label="Fechar">
              <Icone id="x" />
            </button>
          </header>

          <div className="pedido-grade">
            <div className="pedido-col">
              <section className="bloco">
                <h3>Itens</h3>
                <ul className="itens">
                  {(p.itens || []).map((i, n) => (
                    <li key={n}>
                      <span className="foto mini">
                        <Foto src={urlImagem(i.imagem_url)} />
                      </span>
                      <span className="item-nome">
                        {i.nome}
                        <small>
                          {i.quantidade} × {reais(i.preco_unico)}
                        </small>
                      </span>
                      <b>{reais(i.quantidade * i.preco_unico)}</b>
                    </li>
                  ))}
                </ul>
                <dl className="totais">
                  <dt>Subtotal</dt>
                  <dd>{reais(p.subtotal)}</dd>
                  <dt>Frete {p.tipo_entrega === "expressa" ? "(expressa)" : ""}</dt>
                  <dd>{Number(p.frete) ? reais(p.frete) : "Grátis"}</dd>
                  {Number(p.desconto) > 0 && (
                    <>
                      <dt>Desconto {p.cupom ? `(${p.cupom})` : ""}</dt>
                      <dd>− {reais(p.desconto)}</dd>
                    </>
                  )}
                  <dt className="total">Total</dt>
                  <dd className="total">{reais(p.total)}</dd>
                </dl>
              </section>

              <section className="bloco">
                <h3>Histórico</h3>
                <ol className="linha-tempo">
                  {(p.historico || []).map((h, n) => (
                    <li key={n}>
                      <b>{STATUS_PEDIDO[h.status]?.rotulo || h.status}</b>
                      <small>
                        {dataHora(h.data_hora)}
                        {h.funcionario ? ` · ${h.funcionario}` : ""}
                      </small>
                      {h.observacao && <p>{h.observacao}</p>}
                    </li>
                  ))}
                  {!p.historico?.length && <li>Sem registros.</li>}
                </ol>
              </section>
            </div>

            <div className="pedido-col">
              <section className="bloco">
                <h3>Cliente</h3>
                <p className="linha-info">
                  <Icone id="user" />
                  {p.cliente_nome || "-"}
                </p>
                {p.cliente_email && (
                  <p className="linha-info">
                    <Icone id="mail" />
                    <a href={`mailto:${p.cliente_email}`}>{p.cliente_email}</a>
                  </p>
                )}
                {p.cliente_telefone && (
                  <p className="linha-info">
                    <Icone id="phone" />
                    {p.cliente_telefone}
                  </p>
                )}
              </section>

              <section className="bloco">
                <h3>Entrega</h3>
                <p className="linha-info">
                  <Icone id="pin" />
                  <span>
                    {p.apelido && <b>{p.apelido}: </b>}
                    {endereco.join(" · ") || "Endereço não informado"}
                  </span>
                </p>
                {p.codigo_rastreio && (
                  <p className="linha-info">
                    <Icone id="truck" />
                    Rastreio: {p.codigo_rastreio}
                  </p>
                )}
              </section>

              <section className="bloco">
                <h3>Pagamento</h3>
                <p className="linha-info">
                  <Icone id="card" />
                  <span>
                    {pg?.forma_nome || p.forma_pagamento || "Não informado"}
                    {pg?.parcelas > 1 ? ` em ${pg.parcelas}x` : ""}
                    {pg?.cartao?.ultimos_digitos ? ` · final ${pg.cartao.ultimos_digitos}` : ""}
                  </span>
                </p>
                {pg && (
                  <>
                    <p className="linha-info">
                      <Selo tom={STATUS_PAGAMENTO[pg.status]?.tom}>
                        {STATUS_PAGAMENTO[pg.status]?.rotulo || pg.status}
                      </Selo>
                      {pg.data_pagamento && <small>em {dataHora(pg.data_pagamento)}</small>}
                    </p>
                    {pg.proximos_status?.length > 0 && (
                      <div className="acoes-linha">
                        {pg.proximos_status.map(s => (
                          <button
                            key={s}
                            type="button"
                            className={
                              s === "aprovado"
                                ? "btn btn-sm"
                                : "ghost borda btn-sm" +
                                  (["recusado", "cancelado", "estornado"].includes(s) ? " perigo" : "")
                            }
                            disabled={salvando}
                            onClick={() => mudarPagamento(s)}
                          >
                            {ACAO_PAGAMENTO[s] || s}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </section>

              {p.proximos_status?.length > 0 && (
                <form className="bloco destaque" onSubmit={mudarStatus}>
                  <h3>Avançar pedido</h3>
                  <div className="acoes-linha">
                    {p.proximos_status.map(s => (
                      <button
                        key={s}
                        type="button"
                        className={"opcao" + (s === "cancelado" ? " perigo" : "")}
                        aria-pressed={acao === s}
                        onClick={() => setAcao(acao === s ? null : s)}
                      >
                        {ACAO_STATUS[s] || STATUS_PEDIDO[s]?.rotulo}
                      </button>
                    ))}
                  </div>
                  {acao && (
                    <>
                      {acao === "enviado" && (
                        <label className="f">
                          Código de rastreio (opcional)
                          <input
                            value={rastreio}
                            maxLength="60"
                            onChange={e => setRastreio(e.target.value)}
                            placeholder="Ex.: BR123456789BR"
                          />
                        </label>
                      )}
                      <label className="f">
                        Observação para o cliente (opcional)
                        <textarea
                          rows="2"
                          value={obs}
                          maxLength="255"
                          onChange={e => setObs(e.target.value)}
                          placeholder="Vai junto na notificação e no e-mail"
                        />
                      </label>
                      <button className={acao === "cancelado" ? "btn btn-perigo" : "btn"} disabled={salvando}>
                        {salvando ? "Salvando..." : `Confirmar: ${STATUS_PEDIDO[acao].rotulo}`}
                      </button>
                    </>
                  )}
                </form>
              )}
            </div>
          </div>

          <p className="err" role="alert">
            {erro}
          </p>
        </div>
      )}
    </Dialogo>
  );
}
