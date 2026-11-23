import { useEffect, useLayoutEffect, useRef, useState } from "react";

export const dois = n => String(n).padStart(2, "0");
export const relogio = d => `${dois(d.getHours())}:${dois(d.getMinutes())}`;
export const decimal = (v, casas = 1) => v.toFixed(casas).replace(".", ",");
export const km = v => `${decimal(v)} km`;
export const gramas = g => (g >= 1000 ? `${decimal(g / 1000)} kg` : `${Math.round(g)} g`);
export const hm = min => {
  min = Math.round(min);
  const h = Math.floor(min / 60),
    m = min % 60;
  if (!h) return `${m}min`;
  return m ? `${h}h ${dois(m)}m` : `${h}h`;
};
export const mesmoDia = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const quando = d => `${mesmoDia(d, new Date()) ? "Hoje" : "Ontem"}, ${relogio(d)}`;
export const hoje = (h, m) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};
export const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
export const diaDaSemana = () => (new Date().getDay() + 6) % 7; // seg = 0

export const Icone = ({ id }) => (
  <svg className="dv-i" aria-hidden="true">
    <use href={`#dv-${id}`} />
  </svg>
);
export const Carregando = () => <span className="dv-spin" />;

export function Seletor({ opcoes, ativo, aoMudar, pequeno = false, rotulo = "", className = "", ...props }) {
  const botoes = useRef([]);
  const teclas = e => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const prox = (ativo + (e.key === "ArrowRight" ? 1 : -1) + opcoes.length) % opcoes.length;
    botoes.current[prox]?.focus();
    aoMudar(prox);
  };
  return (
    <div
      className={`dv-seg${pequeno ? " dv-seg--sm" : ""}${className ? " " + className : ""}`}
      role="tablist"
      aria-label={rotulo}
      style={{ "--n": opcoes.length, "--i": ativo }}
      onKeyDown={teclas}
      {...props}
    >
      {opcoes.map((o, i) => (
        <button
          key={i}
          ref={b => {
            botoes.current[i] = b;
          }}
          type="button"
          role="tab"
          aria-selected={i === ativo}
          onClick={() => aoMudar(i)}
        >
          {o.icone && <Icone id={o.icone} />}
          {o.texto ?? o}
        </button>
      ))}
    </div>
  );
}

export function CardAparelho({ foto, nome, sub, selos, linhas, children }) {
  return (
    <article className="dv-card dv-device">
      <div className="dv-device__topo">
        {foto}
        <div style={{ minWidth: 0 }}>
          <h2 className="dv-device__nome">{nome}</h2>
          <p className="dv-device__sub">{sub}</p>
          <div className="dv-selos">{selos}</div>
        </div>
      </div>
      <div className="dv-device__info">
        {linhas.map(l => (
          <div className="dv-linha" key={l.rotulo}>
            <Icone id={l.icone} />
            <span className="dv-linha__rotulo">{l.rotulo}</span>
            {l.conteudo ?? (
              <span className="dv-linha__valor" id={l.id}>
                {l.valor}
              </span>
            )}
          </div>
        ))}
      </div>
      {children}
    </article>
  );
}

function Bateria({ p }) {
  const w = Math.max(1.5, (12 * p) / 100);
  return (
    <svg className="dv-i" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="7" width="17" height="10" rx="2.5" />
      <path d="M22 11v2" />
      <rect x="4.5" y="9.5" width={w} height="5" rx="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Selos({ online, bateria }) {
  const nivel = bateria > 85 ? "full" : bateria > 20 ? "ok" : "baixa";
  return (
    <>
      <span className={`dv-selo ${online ? "dv-selo--on" : "dv-selo--off"}`}>{online ? "Online" : "Offline"}</span>{" "}
      <span className="dv-selo dv-selo--azul" title={`Bateria ${nivel}`}>
        <Bateria p={bateria} /> {bateria}%
      </span>
    </>
  );
}

export function ListaEventos({ itens, vazio }) {
  if (!itens.length) return <p className="dv-vazio">{vazio}</p>;
  return (
    <ul className="dv-lista">
      {itens.map(e => (
        <li key={e.chave} className={e.novo ? "is-novo" : undefined}>
          <span className={`dv-chip dv-chip--${e.cor}`}>
            <Icone id={e.icone} />
          </span>
          <div className="dv-item__texto">
            <p className="dv-item__titulo">{e.titulo}</p>
            <p className="dv-item__sub">{e.sub}</p>
          </div>
          <span className="dv-item__hora">{e.hora}</span>
        </li>
      ))}
    </ul>
  );
}

const formatarValor = v => (Number.isInteger(v) ? String(v) : decimal(v));

export function Grafico({ dados }) {
  const caixa = useRef(null);
  const tip = useRef(null);
  const barras = useRef([]);
  const eixo = dados.rotulos.join("|");
  const [cresceu, setCresceu] = useState(false);
  const [fixa, setFixa] = useState(null);
  const [foco, setFoco] = useState(null);
  const [pos, setPos] = useState(null);
  const [, setMedida] = useState(0);
  const ativa = foco ?? fixa;

  useEffect(() => {
    setCresceu(false);
    setFixa(null);
    setFoco(null);
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => setCresceu(true));
    });
    return () => cancelAnimationFrame(id);
  }, [eixo]);

  useLayoutEffect(() => {
    if (ativa == null || !barras.current[ativa]) {
      setPos(null);
      return;
    }
    const c = caixa.current.getBoundingClientRect();
    const v = barras.current[ativa].getBoundingClientRect();
    const x = v.left + v.width / 2 - c.left;
    const meia = tip.current.offsetWidth / 2;
    setPos({ left: `${Math.min(Math.max(x, meia), c.width - meia)}px`, top: `${Math.max(v.top - c.top, 40)}px` });
  }, [ativa, dados, cresceu]);

  // a barra anima a altura: mede de novo quando termina; e quando a janela muda de tamanho
  useEffect(() => {
    if (fixa == null) return;
    const t = setTimeout(() => setMedida(n => n + 1), 720);
    const aoRedimensionar = () => setMedida(n => n + 1);
    window.addEventListener("resize", aoRedimensionar);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", aoRedimensionar);
    };
  }, [fixa, dados]);

  const max = Math.max(1, ...dados.valores) * 1.08;
  const total = dados.valores.reduce((s, v) => s + v, 0);

  return (
    <div className={"dv-grafico" + (ativa != null ? " tem-ativa" : "")} ref={caixa}>
      <div
        className="dv-grafico__area"
        role="list"
        onPointerLeave={e => {
          if (e.pointerType === "mouse") setFoco(null);
        }}
        onBlur={() => setFoco(null)}
      >
        {dados.rotulos.map((rotulo, i) => {
          const v = dados.valores[i] ?? 0;
          return (
            <button
              key={`${eixo}-${i}`}
              type="button"
              role="listitem"
              className={"dv-bar" + (i === dados.destaque ? " is-destaque" : "") + (i === ativa ? " is-ativa" : "")}
              aria-label={`${rotulo}: ${formatarValor(v)}${dados.unidade}`}
              onPointerOver={e => {
                if (e.pointerType === "mouse") setFoco(i);
              }}
              onFocus={() => setFoco(i)}
              onClick={() => {
                setFoco(null);
                setFixa(f => (f === i ? null : i));
              }}
            >
              <span className="dv-bar__trilho" />
              <span
                ref={b => {
                  barras.current[i] = b;
                }}
                className={"dv-bar__valor" + (v > 0 ? " tem" : "")}
                style={{ height: cresceu ? `${(v / max) * 100}%` : "0%" }}
              />
            </button>
          );
        })}
      </div>
      <div className="dv-grafico__rotulos" aria-hidden="true">
        {dados.rotulos.map((t, i) => (
          <span key={`${eixo}-${i}`} className={i === dados.destaque ? "is-forte" : undefined}>
            {t}
          </span>
        ))}
      </div>
      <div
        className={"dv-tooltip" + (ativa != null && pos ? " is-visivel" : "")}
        aria-hidden="true"
        ref={tip}
        style={pos || undefined}
      >
        {ativa != null && (
          <>
            {dados.rotulos[ativa]} • {formatarValor(dados.valores[ativa] ?? 0)}
            {dados.unidade}
            <small>{total ? Math.round(((dados.valores[ativa] ?? 0) / total) * 100) : 0}% do total</small>
          </>
        )}
      </div>
    </div>
  );
}

function Metrica({ m }) {
  const anterior = useRef(m.valor);
  const [pulos, setPulos] = useState(0);
  useEffect(() => {
    if (anterior.current !== m.valor) setPulos(n => n + 1);
    anterior.current = m.valor;
  }, [m.valor]);
  return (
    <article className="dv-card dv-metrica">
      <span className={`dv-chip dv-chip--${m.cor}`}>
        <Icone id={m.icone} />
      </span>
      <p className="dv-metrica__rotulo">{m.rotulo}</p>
      <p key={pulos} className={"dv-metrica__valor" + (pulos ? " is-novo" : "")}>
        {m.valor}
      </p>
      <p className="dv-metrica__nota">{m.nota}</p>
    </article>
  );
}

/**
 * Relatório padrão dos aparelhos. `dados(faixa)` devolve:
 * { titulo, sub, metricas: [3 x {icone, cor, rotulo, valor, nota}],
 *   grafico: {titulo, sub, rotulos, valores, unidade, destaque},
 *   eventos: {titulo, sub, itens, vazio} }
 */
export function Relatorio({ dados }) {
  const [faixa, setFaixa] = useState(0);
  const d = dados(faixa);
  return (
    <>
      <div className="dv-titulo">
        <div>
          <h2>{d.titulo}</h2>
          <p>{d.sub}</p>
        </div>
        <Seletor
          opcoes={["Diário", "Semanal"]}
          ativo={faixa}
          aoMudar={setFaixa}
          pequeno
          rotulo="Período do relatório"
        />
      </div>
      <div className="dv-metricas">
        {d.metricas.map((m, i) => (
          <Metrica key={i} m={m} />
        ))}
      </div>
      <article className="dv-card">
        <div className="dv-titulo">
          <div>
            <h3>{d.grafico.titulo}</h3>
            <p>{d.grafico.sub}</p>
          </div>
        </div>
        <Grafico dados={d.grafico} />
        <p className="dv-dica">
          <Icone id="hand" /> Passe o mouse ou toque numa barra para ver o valor.
        </p>
      </article>
      <article className="dv-card">
        <div className="dv-titulo">
          <div>
            <h3>{d.eventos.titulo}</h3>
            <p>{d.eventos.sub}</p>
          </div>
        </div>
        <div>
          <ListaEventos itens={d.eventos.itens} vazio={d.eventos.vazio} />
        </div>
      </article>
    </>
  );
}
