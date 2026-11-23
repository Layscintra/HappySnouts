import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { guardarDestino, PAGINAS } from "../../lib/api.js";
import { navegar } from "../../lib/navegar.js";
import { useUi, fecharAvisoLogin } from "../../lib/ui.js";

export default function Avisos() {
  const { aviso, toast, confirmacao } = useUi();
  return (
    <>
      {aviso && <AvisoLogin {...aviso} />}
      {confirmacao && <Confirmacao key={confirmacao.id} {...confirmacao} />}
      <div
        className={
          "hs-toast" + (toast?.visivel ? " hs-toast--on" : "") + (toast?.tipo === "erro" ? " hs-toast--erro" : "")
        }
        role="status"
        aria-live="polite"
      >
        {toast?.mensagem}
      </div>
    </>
  );
}

const ICONES = {
  perigo: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />,
  sair: <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4" />,
  aviso: <path d="M12 3 2 20h20L12 3zM12 10v4M12 17.5h.01" />,
  padrao: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" />
};

function Confirmacao({ titulo, mensagem, botao, cancelar, tipo = "padrao", responder }) {
  const janela = useRef(null);
  const btnCancelar = useRef(null);
  const btnConfirmar = useRef(null);
  const perigo = tipo === "perigo";

  useEffect(() => {
    // <dialog> com showModal() fica por cima de tudo, até de outras janelas já abertas
    // (editar produto, evento do calendário...), e prende o Tab dentro dela.
    const d = janela.current;
    if (!d.open) d.showModal();
    // em ação que apaga algo, o foco começa no "Cancelar" (Enter sem querer não apaga)
    (perigo ? btnCancelar : btnConfirmar).current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      if (d.open) d.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <dialog
      ref={janela}
      className="hs-confirma"
      aria-labelledby="hsConfirmaTitulo"
      aria-describedby={mensagem ? "hsConfirmaTexto" : undefined}
      onCancel={e => {
        e.preventDefault();
        responder(false);
      }}
      onClick={e => {
        if (e.target === e.currentTarget) responder(false);
      }}
    >
      <div className={`hs-aviso__caixa hs-confirma__caixa hs-confirma--${ICONES[tipo] ? tipo : "padrao"}`}>
        <div className="hs-confirma__icone" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="26"
            height="26"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {ICONES[tipo] || ICONES.padrao}
          </svg>
        </div>
        <h2 id="hsConfirmaTitulo">{titulo || "Tem certeza?"}</h2>
        {mensagem && (
          <p id="hsConfirmaTexto" className="hs-confirma__texto">
            {mensagem}
          </p>
        )}
        <div className="hs-confirma__botoes">
          <button ref={btnCancelar} type="button" className="hs-confirma__btn" onClick={() => responder(false)}>
            {cancelar || "Cancelar"}
          </button>
          <button
            ref={btnConfirmar}
            type="button"
            className={"hs-confirma__btn hs-confirma__btn--principal" + (perigo ? " hs-confirma__btn--perigo" : "")}
            onClick={() => responder(true)}
          >
            {botao || "Confirmar"}
          </button>
        </div>
      </div>
    </dialog>
  );
}

function AvisoLogin({ mensagem, bloqueante, destino }) {
  const janela = useRef(null);
  const principal = useRef(null);

  const fechar = () => {
    if (bloqueante) {
      navegar(PAGINAS.inicio);
      return;
    }
    fecharAvisoLogin();
  };

  useEffect(() => {
    // <dialog> com showModal() fica por cima de tudo, até do modal do produto
    // (que também é um <dialog>); um z-index comum ficaria atrás dele.
    const d = janela.current;
    if (!d.open) d.showModal();
    principal.current?.focus();
    return () => {
      if (d.open) d.close();
    };
  }, []);

  return (
    <dialog
      ref={janela}
      className="hs-aviso"
      aria-labelledby="hsAvisoTitulo"
      onCancel={e => {
        e.preventDefault();
        fechar();
      }}
      onClick={e => {
        if (e.target === e.currentTarget && !bloqueante) fechar();
      }}
    >
      <div className="hs-aviso__caixa">
        <div className="hs-aviso__patinha" aria-hidden="true">
          🐾
        </div>
        <h2 id="hsAvisoTitulo">Entre na sua conta</h2>
        <p>{mensagem || "Para continuar, você precisa estar logado."}</p>
        <div className="hs-aviso__botoes">
          <Link
            ref={principal}
            className="hs-aviso__btn hs-aviso__btn--principal"
            to={PAGINAS.login}
            onClick={() => guardarDestino(destino)}
          >
            Entrar
          </Link>
          <Link className="hs-aviso__btn" to={PAGINAS.cadastro} onClick={() => guardarDestino(destino)}>
            Criar conta
          </Link>
        </div>
        <button type="button" className="hs-aviso__fechar" onClick={fechar}>
          {bloqueante ? "Voltar ao início" : "Agora não"}
        </button>
      </div>
    </dialog>
  );
}
