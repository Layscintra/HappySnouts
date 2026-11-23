// Faturamento ignora pedidos cancelados, igual ao resumo do backend.

import { useMemo, useState } from "react";
import { Cabecalho, Estado, STATUS_PEDIDO, inteiro, paraData, reais, reaisCurto } from "./comum.jsx";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const PERIODOS = [
  [7, "7 dias"],
  [30, "30 dias"],
  [90, "90 dias"],
  [0, "Tudo"]
];
const DIA = 86400000;

const inicioDoDia = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const totalPedido = p => Number(p.total) || 0;
const itensPedido = p => (p.itens || []).reduce((s, i) => s + (Number(i.quantidade) || 0), 0);

function variacao(atual, anterior) {
  if (!anterior) return null;
  return ((atual - anterior) / anterior) * 100;
}

function serieFaturamento(pedidos, dias, inicio, fim) {
  const modo = dias === 0 ? "mes" : dias > 31 ? "semana" : "dia";
  const baldes = [];
  if (modo === "mes") {
    const primeiro = pedidos.length ? new Date(Math.min(...pedidos.map(p => paraData(p.data_pedido)))) : fim;
    let d = new Date(primeiro.getFullYear(), primeiro.getMonth(), 1);
    // no máximo 24 meses no gráfico
    const limite = new Date(fim.getFullYear(), fim.getMonth() - 23, 1);
    if (d < limite) d = limite;
    while (d <= fim) {
      const prox = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      baldes.push({ de: d, ate: prox, rotulo: `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}` });
      d = prox;
    }
  } else {
    const passo = modo === "semana" ? 7 : 1;
    for (let d = inicio; d < fim; d = new Date(d.getTime() + passo * DIA)) {
      const ate = new Date(Math.min(d.getTime() + passo * DIA, fim.getTime()));
      baldes.push({ de: d, ate, rotulo: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) });
    }
  }
  return baldes.map(b => {
    const dentro = pedidos.filter(p => {
      const d = paraData(p.data_pedido);
      return d >= b.de && d < b.ate && p.status !== "cancelado";
    });
    const detalhe =
      modo === "semana"
        ? `Semana de ${b.rotulo}`
        : modo === "mes"
          ? b.de.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
          : b.de.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
    return { rotulo: b.rotulo, detalhe, valor: dentro.reduce((s, p) => s + totalPedido(p), 0), pedidos: dentro.length };
  });
}

export default function Relatorios({ pedidos, produtos, categorias, erro, recarregar }) {
  const [dias, setDias] = useState(30);
  const [tabela, setTabela] = useState(false);

  const r = useMemo(() => {
    const lista = pedidos || [];
    const fim = new Date(inicioDoDia(new Date()).getTime() + DIA);
    const inicio = dias ? new Date(fim.getTime() - dias * DIA) : new Date(0);
    const inicioAnterior = dias ? new Date(inicio.getTime() - dias * DIA) : null;
    const entre = (p, de, ate) => {
      const d = paraData(p.data_pedido);
      return d >= de && d < ate;
    };

    const periodo = lista.filter(p => entre(p, inicio, fim));
    const validos = periodo.filter(p => p.status !== "cancelado");
    const anterior = inicioAnterior ? lista.filter(p => entre(p, inicioAnterior, inicio)) : [];
    const anteriorValidos = anterior.filter(p => p.status !== "cancelado");

    const faturamento = validos.reduce((s, p) => s + totalPedido(p), 0);
    const fatAnterior = anteriorValidos.reduce((s, p) => s + totalPedido(p), 0);
    const ticket = validos.length ? faturamento / validos.length : 0;
    const ticketAnterior = anteriorValidos.length ? fatAnterior / anteriorValidos.length : 0;
    const cancelados = periodo.length - validos.length;

    const fluxo = Object.entries(STATUS_PEDIDO).map(([id, s]) => ({
      id,
      rotulo: s.rotulo,
      valor: periodo.filter(p => p.status === id).length
    }));

    const formas = {};
    for (const p of validos) {
      const nome = p.pagamento?.forma_nome || p.forma_pagamento || "Não informado";
      formas[nome] ??= { rotulo: nome, valor: 0, pedidos: 0 };
      formas[nome].valor += totalPedido(p);
      formas[nome].pedidos += 1;
    }

    const porProduto = {};
    for (const p of validos)
      for (const i of p.itens || []) {
        const id = i.id_produto ?? i.nome;
        porProduto[id] ??= { id, nome: i.nome, qtd: 0, valor: 0 };
        porProduto[id].qtd += Number(i.quantidade) || 0;
        porProduto[id].valor += (Number(i.quantidade) || 0) * (Number(i.preco_unico) || 0);
      }
    const produtoInfo = Object.fromEntries((produtos || []).map(pr => [pr.id, pr]));
    const nomeCat = Object.fromEntries((categorias || []).map(c => [c.id_categoria, c.nome]));
    const porCategoria = {};
    for (const item of Object.values(porProduto)) {
      const pr = produtoInfo[item.id];
      const nome = pr?.categoria || nomeCat[pr?.idCategoria] || "Sem categoria";
      porCategoria[nome] ??= { rotulo: nome, valor: 0 };
      porCategoria[nome].valor += item.valor;
    }

    return {
      faturamento,
      varFat: variacao(faturamento, fatAnterior),
      pedidos: periodo.length,
      varPed: variacao(periodo.length, anterior.length),
      ticket,
      varTicket: variacao(ticket, ticketAnterior),
      itens: validos.reduce((s, p) => s + itensPedido(p), 0),
      cancelamento: periodo.length ? (cancelados / periodo.length) * 100 : 0,
      cancelados,
      serie: serieFaturamento(lista, dias, inicio, fim),
      fluxo,
      formas: Object.values(formas).sort((a, b) => b.valor - a.valor),
      topProdutos: Object.values(porProduto)
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 8),
      categorias: Object.values(porCategoria).sort((a, b) => b.valor - a.valor)
    };
  }, [pedidos, produtos, categorias, dias]);

  const comparar = dias !== 0;

  return (
    <>
      <Cabecalho
        titulo="Relatórios"
        subtitulo="Desempenho de vendas da loja. Pedidos cancelados não entram no faturamento."
      >
        <div className="seg" role="radiogroup" aria-label="Período">
          {PERIODOS.map(([d, rotulo]) => (
            <button key={d} type="button" role="radio" aria-checked={dias === d} onClick={() => setDias(d)}>
              {rotulo}
            </button>
          ))}
        </div>
      </Cabecalho>

      <Estado erro={erro} carregando={!pedidos} aoTentar={recarregar}>
        <div className="metricas metricas-5">
          <Kpi rotulo="Faturamento" valor={reais(r.faturamento)} delta={comparar ? r.varFat : null} />
          <Kpi rotulo="Pedidos" valor={inteiro(r.pedidos)} delta={comparar ? r.varPed : null} />
          <Kpi rotulo="Ticket médio" valor={reais(r.ticket)} delta={comparar ? r.varTicket : null} />
          <Kpi rotulo="Itens vendidos" valor={inteiro(r.itens)} />
          <Kpi
            rotulo="Cancelamentos"
            valor={`${r.cancelamento.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}
            extra={r.cancelados === 1 ? "1 pedido" : `${r.cancelados} pedidos`}
          />
        </div>
        {comparar && <p className="legenda-kpi">Setas comparam com os {dias} dias anteriores.</p>}

        <section className="painel-card grafico-card">
          <div className="grafico-topo">
            <div>
              <h2>Faturamento no período</h2>
              <p>{dias === 0 ? "Por mês (últimos 24 meses)" : dias > 31 ? "Por semana" : "Por dia"}</p>
            </div>
            <button
              type="button"
              className="ghost borda btn-sm"
              aria-pressed={tabela}
              onClick={() => setTabela(!tabela)}
            >
              {tabela ? "Ver gráfico" : "Ver como tabela"}
            </button>
          </div>
          {tabela ? (
            <table className="tab-dados">
              <thead>
                <tr>
                  <th>Período</th>
                  <th>Pedidos</th>
                  <th>Faturamento</th>
                </tr>
              </thead>
              <tbody>
                {r.serie.map(s => (
                  <tr key={s.detalhe}>
                    <td>{s.detalhe}</td>
                    <td>{s.pedidos}</td>
                    <td>{reais(s.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <GraficoBarras dados={r.serie} />
          )}
        </section>

        <div className="rel-grade">
          <section className="painel-card">
            <h2>Fluxo de pedidos</h2>
            <p className="sub">Situação atual dos pedidos feitos no período.</p>
            <BarrasH
              dados={r.fluxo}
              formatar={v => (v === 1 ? "1 pedido" : `${v} pedidos`)}
              vazio="Nenhum pedido no período."
            />
          </section>
          <section className="painel-card">
            <h2>Formas de pagamento</h2>
            <p className="sub">Faturamento por forma de pagamento.</p>
            <BarrasH
              dados={r.formas}
              formatar={(v, d) => `${reais(v)} · ${d.pedidos} ped.`}
              vazio="Nenhuma venda no período."
            />
          </section>
          <section className="painel-card">
            <h2>Vendas por categoria</h2>
            <p className="sub">Valor vendido em cada categoria de produto.</p>
            <BarrasH dados={r.categorias} formatar={v => reais(v)} vazio="Nenhuma venda no período." />
          </section>
          <section className="painel-card">
            <h2>Produtos mais vendidos</h2>
            <p className="sub">Os 8 que mais faturaram no período.</p>
            {r.topProdutos.length ? (
              <table className="tab-dados top">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Qtd.</th>
                    <th>Vendido</th>
                  </tr>
                </thead>
                <tbody>
                  {r.topProdutos.map(p => (
                    <tr key={p.id}>
                      <td>{p.nome}</td>
                      <td>{inteiro(p.qtd)}</td>
                      <td>{reais(p.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="sub">Nenhuma venda no período.</p>
            )}
          </section>
        </div>
      </Estado>
    </>
  );
}

function Kpi({ rotulo, valor, delta, extra }) {
  const sobe = delta != null && delta >= 0;
  return (
    <div className="metrica simples kpi">
      <div>
        <span>{rotulo}</span>
        <b>{valor}</b>
        {delta != null ? (
          <small className={sobe ? "delta sobe" : "delta desce"}>
            {sobe ? "▲" : "▼"} {Math.abs(delta).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
          </small>
        ) : (
          extra && <small className="delta">{extra}</small>
        )}
      </div>
    </div>
  );
}

function GraficoBarras({ dados }) {
  const [foco, setFoco] = useState(null);
  const L = 720,
    A = 240,
    esq = 56,
    base = 24,
    topo = 12;
  const max = Math.max(...dados.map(d => d.valor), 0);
  const passoBruto = max / 4 || 1;
  const mag = 10 ** Math.floor(Math.log10(passoBruto));
  const passo = [1, 2, 2.5, 5, 10].map(m => m * mag).find(p => p >= passoBruto);
  const teto = passo * 4;
  const alturaUtil = A - base - topo;
  const largura = (L - esq) / Math.max(dados.length, 1);
  const barra = Math.max(2, Math.min(28, largura - 2));
  const y = v => topo + alturaUtil - (v / teto) * alturaUtil;
  const cadaQuantos = Math.ceil(dados.length / 10);

  if (!dados.length) return <p className="sub">Sem dados no período.</p>;

  return (
    <div className="grafico" onMouseLeave={() => setFoco(null)}>
      <svg viewBox={`0 0 ${L} ${A}`} role="img" aria-label="Faturamento no período, em barras">
        {[0, 1, 2, 3, 4].map(n => (
          <g key={n}>
            <line x1={esq} x2={L} y1={y(passo * n)} y2={y(passo * n)} className={n ? "grade" : "eixo"} />
            <text x={esq - 8} y={y(passo * n) + 4} textAnchor="end" className="rotulo-eixo">
              {reaisCurto(passo * n)}
            </text>
          </g>
        ))}
        {dados.map((d, i) => {
          const x = esq + i * largura + (largura - barra) / 2;
          const h = d.valor ? Math.max(2, (d.valor / teto) * alturaUtil) : 0;
          const r = Math.min(4, barra / 2, h);
          const yb = topo + alturaUtil;
          return (
            <g key={i}>
              {h > 0 && (
                <path
                  className={"barra" + (foco === i ? " ativa" : "")}
                  d={`M${x},${yb} V${yb - h + r} Q${x},${yb - h} ${x + r},${yb - h} H${x + barra - r} Q${x + barra},${yb - h} ${x + barra},${yb - h + r} V${yb} Z`}
                />
              )}
              {i % cadaQuantos === 0 && (
                <text x={x + barra / 2} y={A - 6} textAnchor="middle" className="rotulo-eixo">
                  {d.rotulo}
                </text>
              )}
              <rect
                x={esq + i * largura}
                y={topo}
                width={largura}
                height={alturaUtil}
                fill="transparent"
                onMouseEnter={() => setFoco(i)}
              />
            </g>
          );
        })}
      </svg>
      {foco != null && (
        <div
          className="dica"
          style={{
            left: `${((esq + (foco + 0.5) * largura) / L) * 100}%`,
            top: `${(y(dados[foco].valor) / A) * 100}%`
          }}
        >
          <b>{reais(dados[foco].valor)}</b>
          <span>{dados[foco].detalhe}</span>
          <span>{dados[foco].pedidos === 1 ? "1 pedido" : `${dados[foco].pedidos} pedidos`}</span>
        </div>
      )}
    </div>
  );
}

function BarrasH({ dados, formatar, vazio }) {
  const max = Math.max(...dados.map(d => d.valor), 0);
  if (!max) return <p className="sub">{vazio}</p>;
  return (
    <ul className="barras-h">
      {dados.map(d => (
        <li key={d.rotulo}>
          <span className="bh-rotulo">{d.rotulo}</span>
          <span className="bh-trilho" aria-hidden="true">
            <span className="bh-barra" style={{ width: `${(d.valor / max) * 100}%` }} />
          </span>
          <span className="bh-valor">{formatar(d.valor, d)}</span>
        </li>
      ))}
    </ul>
  );
}
