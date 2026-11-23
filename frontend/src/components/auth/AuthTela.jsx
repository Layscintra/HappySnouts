import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { AuthSprite, AuthHero } from "./AuthLogin.jsx";

// patinhas e corações do fundo: [top, left/right, tamanho, rotação, tipo, opacidade]
const DECO = [
  { top: "7%", left: "6%", s: 54, r: -18 },
  { top: "22%", left: "16%", s: 26, r: 12, o: 0.12 },
  { top: "48%", left: "4%", s: 38, r: 16 },
  { top: "74%", left: "10%", s: 60, r: -10 },
  { top: "90%", left: "30%", s: 28, r: 20, o: 0.12 },
  { top: "10%", right: "8%", s: 34, r: 22, tipo: "heart" },
  { top: "30%", right: "4%", s: 58, r: 14 },
  { top: "56%", right: "13%", s: 26, r: -14, o: 0.12 },
  { top: "70%", right: "5%", s: 44, r: -20, tipo: "heart" },
  { top: "88%", right: "18%", s: 36, r: 8 }
];

function Sprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <symbol id="at-paw" viewBox="0 0 64 64">
        <ellipse cx="12" cy="30" rx="6.5" ry="9" transform="rotate(-25 12 30)" />
        <ellipse cx="25" cy="15" rx="6.5" ry="9.5" transform="rotate(-8 25 15)" />
        <ellipse cx="41" cy="15" rx="6.5" ry="9.5" transform="rotate(8 41 15)" />
        <ellipse cx="53" cy="30" rx="6.5" ry="9" transform="rotate(25 53 30)" />
        <path d="M32 30c-9 0-17 9-17 17 0 6 5 9 10 9 3 0 5-1 7-1s4 1 7 1c5 0 10-3 10-9 0-8-8-17-17-17z" />
      </symbol>
      <symbol id="at-heart" viewBox="0 0 64 64">
        <path
          d="M32 56C10 40 4 26 12 16c7-8 17-4 20 4 3-8 13-12 20-4 8 10 2 24-20 40z"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </symbol>
    </svg>
  );
}

export function TelaAuth({ titulo, children, rodape, fundo }) {
  const cartao = (
    <section className="at-card" aria-labelledby="at-titulo">
      {fundo === "login" && (
        <Link className="at-logo at-logo-card" to="/">
          <img src="img/logo-topo.png" alt="Happy Snouts: página inicial" />
        </Link>
      )}
      <h1 className="at-titulo" id="at-titulo">
        {titulo}
      </h1>
      {children}
    </section>
  );

  if (fundo === "login") {
    return (
      <>
        <AuthSprite />
        <main className="at-tela at-login">
          <AuthHero />
          <section className="panel">
            <div className="at-palco">
              {cartao}
              {rodape && <p className="at-rodape">{rodape}</p>}
            </div>
          </section>
        </main>
      </>
    );
  }

  return (
    <div className="at-tela">
      <Sprite />
      <div className="at-fundo" aria-hidden="true">
        {DECO.map((d, i) => (
          <svg
            key={i}
            className={`at-deco ${d.tipo || "paw"}`}
            style={{
              top: d.top,
              left: d.left,
              right: d.right,
              width: d.s,
              height: d.s,
              transform: `rotate(${d.r}deg)`,
              opacity: d.o
            }}
          >
            <use href={`#at-${d.tipo || "paw"}`} />
          </svg>
        ))}
      </div>

      <main className="at-palco">
        <Link className="at-logo" to="/">
          <img src="img/logo-topo.png" alt="Happy Snouts: página inicial" />
        </Link>
        <img className="at-pets" src="img/doglogin.png" alt="" aria-hidden="true" />
        {cartao}
        {rodape && <p className="at-rodape">{rodape}</p>}
      </main>
    </div>
  );
}

export const Destaque = ({ children }) => <span className="at-destaque">{children}</span>;

export const Descricao = ({ children }) => <p className="at-descricao">{children}</p>;

export function PilulaEmail({ email }) {
  return (
    <p className="at-pilula">
      <IconeEnvelope />
      <span>{email}</span>
    </p>
  );
}

export function Etapas({ nomes, atual }) {
  return (
    <ol className="at-etapas" aria-label={`Passo ${atual + 1} de ${nomes.length}: ${nomes[atual]}`}>
      {nomes.map((nome, i) => (
        <li key={nome} className={i < atual ? "feito" : i === atual ? "atual" : ""} aria-hidden="true">
          <span className="at-etapa-ponto">{i < atual ? "✓" : i + 1}</span>
          <span className="at-etapa-nome">{nome}</span>
        </li>
      ))}
    </ol>
  );
}

export function CampoAuth({ id, rotulo, icone, erro, children }) {
  return (
    <div className={"at-campo" + (erro ? " invalido" : "")}>
      <label htmlFor={id}>{rotulo}</label>
      <div className="at-input">
        <span className="at-input-icone" aria-hidden="true">
          {icone}
        </span>
        {children}
      </div>
      <p className="at-erro" id={`${id}Erro`} role="alert">
        {erro}
      </p>
    </div>
  );
}

export function BotaoAuth({ children, carregando, ...props }) {
  return (
    <button className="at-btn" type="submit" disabled={carregando} aria-busy={carregando || undefined} {...props}>
      {carregando && <span className="at-spinner" aria-hidden="true" />}
      <span>{children}</span>
      {!carregando && (
        <svg className="at-btn-seta" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      )}
    </button>
  );
}

export function MensagemAuth({ texto, tipo }) {
  return (
    <p className={"at-msg" + (tipo ? " " + tipo : "")} role="status" aria-live="polite">
      {texto}
    </p>
  );
}

export function AcoesCodigo({ aoVoltar, textoVoltar = "Voltar e corrigir o e-mail", aoReenviar, espera, ocupado }) {
  return (
    <div className="at-acoes">
      <button type="button" className="at-link" onClick={aoReenviar} disabled={espera > 0 || ocupado}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 12a8 8 0 11-2.3-5.6M20 4v5h-5" />
        </svg>
        {espera > 0 ? (
          <span>
            Reenviar código em <b className="at-contagem">{espera}s</b>
          </span>
        ) : (
          <span>Reenviar código</span>
        )}
      </button>
      <button type="button" className="at-link suave" onClick={aoVoltar}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
        <span>{textoVoltar}</span>
      </button>
    </div>
  );
}

export function useContagem() {
  const [segundos, setSegundos] = useState(0);
  useEffect(() => {
    if (segundos <= 0) return;
    const t = setTimeout(() => setSegundos(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [segundos]);
  return [segundos, setSegundos];
}

/* código de 6 dígitos em caixinhas (OTP)
   O código é sempre preenchido da esquerda para a direita: clicar em qualquer caixa
   leva para a próxima vazia, Backspace apaga a última, e colar (ou o preenchimento
   automático do celular) espalha os números pelas caixas. */
const TAMANHO = 6;
const soNumeros = t => (t || "").replace(/\D/g, "");

export function CodigoOTP({ valor, aoMudar, invalido, autoFocus, rotulo = "Código de 6 números" }) {
  const caixas = useRef([]);
  const digitos = Array.from({ length: TAMANHO }, (_, i) => valor[i] || "");
  const alvo = Math.min(valor.length, TAMANHO - 1);

  const focar = i => {
    const el = caixas.current[Math.max(0, Math.min(TAMANHO - 1, i))];
    el?.focus();
    el?.select();
  };

  useEffect(() => {
    if (autoFocus) focar(alvo);
  }, [autoFocus]); // eslint-disable-line react-hooks/exhaustive-deps

  // escreve a partir da caixa i (por cima do que já tinha nas caixas seguintes)
  const colocar = (i, numeros) => {
    const novo = (valor.slice(0, i) + numeros + valor.slice(i + numeros.length)).slice(0, TAMANHO);
    aoMudar(novo);
    requestAnimationFrame(() => focar(Math.min(i + numeros.length, novo.length)));
  };

  const aoDigitar = (i, e) => {
    let d = soNumeros(e.target.value);
    if (!d) return;
    // caixa já tinha número e a pessoa digitou outro por cima: fica só o novo
    if (d.length === 2 && digitos[i]) d = d[0] === digitos[i] ? d[1] : d[0];
    colocar(i, d);
  };

  const aoTeclar = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digitos[i]) aoMudar(valor.slice(0, i) + valor.slice(i + 1));
      else if (i > 0) {
        aoMudar(valor.slice(0, i - 1) + valor.slice(i));
        focar(i - 1);
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      focar(i - 1);
    } else if (e.key === "ArrowRight" && i < alvo) {
      e.preventDefault();
      focar(i + 1);
    }
  };

  return (
    <div className={"at-otp" + (invalido ? " invalido" : "")} role="group" aria-label={rotulo}>
      {digitos.map((d, i) => (
        <input
          key={i}
          ref={el => (caixas.current[i] = el)}
          className={d ? "preenchido" : ""}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Dígito ${i + 1} de ${TAMANHO}`}
          aria-invalid={invalido ? "true" : "false"}
          tabIndex={i === alvo ? 0 : -1}
          value={d}
          onChange={e => aoDigitar(i, e)}
          onKeyDown={e => aoTeclar(i, e)}
          onFocus={e => (i > alvo ? focar(alvo) : e.target.select())}
          onPaste={e => {
            e.preventDefault();
            const d2 = soNumeros(e.clipboardData.getData("text"));
            if (d2) colocar(i > alvo ? alvo : i, d2);
          }}
        />
      ))}
    </div>
  );
}

export const IconeEnvelope = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M4 7l8 6 8-6" />
  </svg>
);
export const IconeCadeadoAuth = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 018 0v2.5" />
    <circle cx="12" cy="15.5" r="1.2" fill="currentColor" />
  </svg>
);
export const IconeSucesso = () => (
  <span className="at-sucesso" aria-hidden="true">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  </span>
);
