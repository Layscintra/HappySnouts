import { useState } from "react";

export function AuthSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <symbol id="paw" viewBox="0 0 64 64">
        <ellipse cx="12" cy="30" rx="6.5" ry="9" transform="rotate(-25 12 30)" />
        <ellipse cx="25" cy="15" rx="6.5" ry="9.5" transform="rotate(-8 25 15)" />
        <ellipse cx="41" cy="15" rx="6.5" ry="9.5" transform="rotate(8 41 15)" />
        <ellipse cx="53" cy="30" rx="6.5" ry="9" transform="rotate(25 53 30)" />
        <path d="M32 30c-9 0-17 9-17 17 0 6 5 9 10 9 3 0 5-1 7-1s4 1 7 1c5 0 10-3 10-9 0-8-8-17-17-17z" />
      </symbol>
      <symbol id="heart" viewBox="0 0 64 64">
        <path
          d="M32 56C10 40 4 26 12 16c7-8 17-4 20 4 3-8 13-12 20-4 8 10 2 24-20 40z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </symbol>
    </svg>
  );
}

const Deco = ({ tipo = "paw", extra = "", style }) => (
  <svg className={`deco ${tipo}${extra ? " " + extra : ""}`} style={style}>
    <use href={`#${tipo}`} />
  </svg>
);

export function AuthHero() {
  return (
    <section className="hero" aria-label="Apresentação">
      <span className="blob blob-tl" />
      <span className="blob blob-l" />
      <span className="blob blob-bl" />
      <Deco style={{ top: "11%", left: "14%", "--s": "44px", "--r": "-12deg" }} />
      <Deco style={{ top: "36%", right: "6%", "--s": "64px", "--r": "14deg" }} />
      <Deco style={{ top: "66%", left: "1%", "--s": "52px", "--r": "-10deg" }} />
      <Deco style={{ top: "58%", left: "9%", "--s": "34px", "--r": "10deg" }} />
      <Deco extra="pale" style={{ bottom: "4%", left: "3%", "--s": "44px", "--r": "-8deg" }} />
      <Deco extra="pale" style={{ bottom: "2%", left: "52%", "--s": "48px", "--r": "8deg" }} />
      <Deco tipo="heart" style={{ top: "19%", right: "1%", "--s": "54px", "--r": "12deg" }} />
      <Deco tipo="heart" style={{ top: "60%", right: "6%", "--s": "46px", "--r": "8deg" }} />

      <div className="hero-inner">
        <h1 className="headline">
          <span className="h-light">Cuidado e amor para</span> <span className="h-bold">quem você mais ama</span>
        </h1>
        <img className="pets" src="img/doglogin.png" alt="Gatinho e cachorrinho encostados, felizes" />
        <ul className="perks">
          <li>
            <span className="perk-icon">
              <svg
                viewBox="0 0 48 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 12h22v20H6zM28 19h9l5 7v6H28z" />
                <circle cx="15" cy="34" r="4" fill="#ffe9b8" />
                <circle cx="36" cy="34" r="4" fill="#ffe9b8" />
              </svg>
            </span>
            <strong>Frete Fixo</strong>
            <small>a partir de R$ 10,00</small>
          </li>
          <li>
            <span className="perk-icon">
              <svg viewBox="0 0 48 48" fill="currentColor">
                <path d="M24 5l15 5v12c0 10-6 17-15 21C15 39 9 32 9 22V10z" />
                <path d="M24 13v18M18 22l6 8 6-8" stroke="#ffe9b8" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </span>
            <strong>Entrega Rápida</strong>
            <small>em até 2 dias úteis</small>
          </li>
          <li>
            <span className="perk-icon">
              <svg viewBox="0 0 48 48" fill="currentColor">
                <path d="M24 42C8 31 4 21 10 14c5-5 12-3 14 3 2-6 9-8 14-3 6 7 2 17-14 28z" />
                <use href="#paw" x="15" y="16" width="18" height="18" fill="#ffe9b8" />
              </svg>
            </span>
            <strong>Compra Segura</strong>
            <small>seus dados protegidos</small>
          </li>
        </ul>
      </div>
    </section>
  );
}

export function AuthCard({ titulo, children }) {
  return (
    <section className="panel">
      <div className="card">
        <Deco style={{ top: "5%", right: "4%", "--s": "58px", "--r": "14deg" }} />
        <Deco style={{ top: "17%", right: "1%", "--s": "30px", "--r": "-8deg" }} />
        <Deco style={{ bottom: "12%", right: "3%", "--s": "46px", "--r": "10deg" }} />
        <span className="card-blob" />
        <img className="logo logo-card" src="img/logo-topo.png" alt="Happy Snouts" />
        <h2 className="title">{titulo}</h2>
        {children}
      </div>
    </section>
  );
}

export const IconeUsuario = () => (
  <svg className="i-left" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="8" r="4.2" />
    <path d="M4 21c0-4.6 3.6-7 8-7s8 2.4 8 7z" />
  </svg>
);
export const IconeCadeado = () => (
  <svg className="i-left" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M7 10V8a5 5 0 0110 0v2h1.5A1.5 1.5 0 0120 11.5v8a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 19.5v-8A1.5 1.5 0 015.5 10zm2 0h6V8a3 3 0 00-6 0z" />
  </svg>
);
export const IconeEmail = () => (
  <svg className="i-left" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M3 5h18a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V6a1 1 0 011-1zm9 7.5L4 7.3V17h16V7.3z" />
  </svg>
);

export function Campo({ id, rotulo, icone, erro, erroId, children }) {
  return (
    <div className={"field" + (erro ? " invalid" : "")}>
      <label htmlFor={id}>{rotulo}</label>
      <div className="input">
        {icone}
        {children}
      </div>
      <p className="error" id={erroId || `${id}Error`} role="alert">
        {erro}
      </p>
    </div>
  );
}

export function InputSenha({ inputRef, botaoId, aoAlternar, ...props }) {
  const [mostrar, setMostrar] = useState(false);
  return (
    <>
      <input {...props} ref={inputRef} type={mostrar ? "text" : "password"} aria-invalid={props["aria-invalid"]} />
      <button
        type="button"
        className="eye"
        id={botaoId}
        aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={mostrar}
        onClick={() => {
          setMostrar(!mostrar);
          aoAlternar?.();
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
          <path className="slash" d="M3 3l18 18" />
        </svg>
      </button>
    </>
  );
}

export function BotaoPrimario({ texto, seta = true, ...props }) {
  return (
    <button className="btn-primary" type="submit" {...props}>
      <svg className="btn-paw" aria-hidden="true">
        <use href="#paw" />
      </svg>
      <span>{texto}</span>
      {seta && (
        <svg
          className="btn-arrow"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 12h16M14 6l6 6-6 6" />
        </svg>
      )}
    </button>
  );
}
