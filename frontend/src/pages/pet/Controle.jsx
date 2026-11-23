import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ConectarAparelho, ListaAparelhos } from "../../components/dispositivos/Aparelhos.jsx";
import Coleira from "../../components/dispositivos/Coleira.jsx";
import Comedouro from "../../components/dispositivos/Comedouro.jsx";
import SaudePet from "../../components/dispositivos/SaudePet.jsx";
import { Seletor } from "../../components/dispositivos/comum.jsx";
import Footer from "../../components/layout/Footer.jsx";
import Header from "../../components/layout/Header.jsx";
import { ENDPOINTS, clienteLogado, pedir, semServidor } from "../../lib/api.js";

function ControleIcones() {
  return (
    <>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" className="dv-sprite">
        <symbol id="dv-gps" viewBox="0 0 24 24">
          <path d="M12 21s7-6.5 7-11.5A7 7 0 1 0 5 9.5C5 14.5 12 21 12 21z" />
          <circle cx="12" cy="9.5" r="2.5" />
        </symbol>
        <symbol id="dv-bowl" viewBox="0 0 24 24">
          <path d="M3 11h18a9 9 0 0 1-18 0z" />
          <path d="M8 7c0-1.5 1-2 1-3.5M12 7c0-1.5 1-2 1-3.5M16 7c0-1.5 1-2 1-3.5" />
        </symbol>
        <symbol id="dv-wifi" viewBox="0 0 24 24">
          <path d="M2 8.8a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0" />
          <circle cx="12" cy="19.5" r=".8" />
        </symbol>
        <symbol id="dv-qr" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h3v3h-3zM20 14v.01M17 20h4M20 17v3" />
        </symbol>
        <symbol id="dv-sync" viewBox="0 0 24 24">
          <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12a9 9 0 0 1 15.5-6.2L21 8" />
          <path d="M21 3v5h-5M3 21v-5h5" />
        </symbol>
        <symbol id="dv-target" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </symbol>
        <symbol id="dv-walk" viewBox="0 0 24 24">
          <circle cx="13" cy="4" r="2" />
          <path d="m9 21 2.5-6.5L14 17v4M7 12l3-4.5h3.5l2.5 4 3 1M10 7.5 9 13" />
        </symbol>
        <symbol id="dv-fire" viewBox="0 0 24 24">
          <path d="M12 22c4 0 7-2.7 7-7 0-4-3-6.5-4-10-2 2-3 4-3 6-1.5-1-2-2.5-2-4-3 2.5-5 5.5-5 8 0 4.3 3 7 7 7z" />
        </symbol>
        <symbol id="dv-route" viewBox="0 0 24 24">
          <circle cx="6" cy="19" r="2.5" />
          <circle cx="18" cy="5" r="2.5" />
          <path d="M8.5 19H16a3.5 3.5 0 0 0 0-7H8a3.5 3.5 0 0 1 0-7h7.5" />
        </symbol>
        <symbol id="dv-clock" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </symbol>
        <symbol id="dv-shield" viewBox="0 0 24 24">
          <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />
          <path d="m9 12 2 2 4-4" />
        </symbol>
        <symbol id="dv-exit" viewBox="0 0 24 24">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l-5-5 5-5M5 12h11" />
        </symbol>
        <symbol id="dv-plus" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" />
        </symbol>
        <symbol id="dv-sun" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </symbol>
        <symbol id="dv-moon" viewBox="0 0 24 24">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </symbol>
        <symbol id="dv-check" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 3 3 5-6" />
        </symbol>
        <symbol id="dv-hand" viewBox="0 0 24 24">
          <path d="M9 11V5a1.5 1.5 0 0 1 3 0v6M12 10V4a1.5 1.5 0 0 1 3 0v7M15 10.5V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7h-.5a6 6 0 0 1-5-2.7L3 14.5a1.5 1.5 0 0 1 2.5-1.7L9 16V11" />
        </symbol>
        <symbol id="dv-box" viewBox="0 0 24 24">
          <path d="m12 3 9 5-9 5-9-5 9-5Z" />
          <path d="M3 8v9l9 5 9-5V8M12 13v9" />
        </symbol>
        <symbol id="dv-chart" viewBox="0 0 24 24">
          <path d="M3 3v18h18" />
          <path d="m8 14 4-4 4 4 5-7" />
        </symbol>
        <symbol id="dv-link" viewBox="0 0 24 24">
          <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
          <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
        </symbol>
        <symbol id="dv-unlink" viewBox="0 0 24 24">
          <path d="M18.8 13.3 20.5 11.5a5 5 0 0 0-7-7L11.7 6.2M5.2 10.7 3.5 12.5a5 5 0 0 0 7 7l1.8-1.8M8 2v3M2 8h3M16 22v-3M22 16h-3" />
        </symbol>
        <symbol id="dv-scale" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M8 9a5 5 0 0 1 8 0l-3 3" />
        </symbol>
        <symbol id="dv-bell" viewBox="0 0 24 24">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
        </symbol>
        <symbol id="dv-calendar" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </symbol>
        <symbol id="dv-dots" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="19" r="1" />
        </symbol>
        <symbol id="dv-trash" viewBox="0 0 24 24">
          <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
        </symbol>
        <symbol id="dv-insights" viewBox="0 0 24 24">
          <path d="M3 17l5-5 4 4 8-8" />
          <path d="M14 8h6v6" />
        </symbol>
      </svg>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <symbol id="search" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.3-4.3" />
        </symbol>
        <symbol id="doc" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M8 13h8M8 17h8" />
        </symbol>
        <symbol id="cart" viewBox="0 0 24 24">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
        </symbol>
        <symbol id="heart" viewBox="0 0 24 24">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
        </symbol>
        <symbol id="user" viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </symbol>
        <symbol id="chat" viewBox="0 0 24 24">
          <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
        </symbol>
        <symbol id="pen" viewBox="0 0 24 24">
          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </symbol>
        <symbol id="help" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" />
        </symbol>
        <symbol id="bulb" viewBox="0 0 24 24">
          <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
        </symbol>
        <symbol id="monitor" viewBox="0 0 24 24">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </symbol>
        <symbol id="chev" viewBox="0 0 24 24">
          <path d="M9 18l6-6-6-6" />
        </symbol>
        <symbol id="trash" viewBox="0 0 24 24">
          <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
        </symbol>
        <symbol id="x" viewBox="0 0 24 24">
          <path d="M18 6L6 18M6 6l12 12" />
        </symbol>
        <symbol id="paw" viewBox="0 0 24 24">
          <g fill="currentColor" stroke="none">
            <ellipse cx="5.5" cy="11" rx="2" ry="2.6" />
            <ellipse cx="9.5" cy="6.5" rx="2" ry="2.6" />
            <ellipse cx="14.5" cy="6.5" rx="2" ry="2.6" />
            <ellipse cx="18.5" cy="11" rx="2" ry="2.6" />
            <path d="M12 11c-3 0-6 3.2-6 5.7C6 19.4 8.5 20 12 20s6-.6 6-3.3C18 14.2 15 11 12 11z" />
          </g>
        </symbol>
        <symbol id="box" viewBox="0 0 24 24">
          <path d="m12 3 9 5-9 5-9-5 9-5Z" />
          <path d="M3 8v9l9 5 9-5V8M12 13v9" />
        </symbol>
        <symbol id="chart" viewBox="0 0 24 24">
          <path d="M3 3v18h18" />
          <path d="m8 14 4-4 4 4 5-7" />
        </symbol>
      </svg>
      <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute", overflow: "hidden" }}>
        <symbol id="paw-icon" viewBox="0 0 32 32">
          <ellipse cx="16" cy="22" rx="9" ry="7" />
          <ellipse cx="6" cy="12" rx="3.4" ry="4.2" />
          <ellipse cx="14" cy="6.5" rx="3.4" ry="4.2" />
          <ellipse cx="22" cy="6.5" rx="3.4" ry="4.2" />
          <ellipse cx="27" cy="13.5" rx="3.4" ry="4.2" />
        </symbol>
      </svg>
    </>
  );
}

const APARELHOS = ["coleira", "comedouro"];

function useAviso() {
  const [toast, setToast] = useState({ texto: "", visivel: false, montado: false });
  const timers = useRef([]);
  const aviso = texto => {
    timers.current.forEach(clearTimeout);
    setToast({ texto, visivel: false, montado: true });
    requestAnimationFrame(() => setToast(t => ({ ...t, visivel: true })));
    timers.current = [
      setTimeout(() => setToast(t => ({ ...t, visivel: false })), 2600),
      setTimeout(() => setToast(t => ({ ...t, montado: false })), 2860)
    ];
  };
  return [toast, aviso];
}

const PET_SALVO = "relatorioPet"; // lembra o último pet escolhido no Relatório
function petSalvo() {
  const daUrl = new URLSearchParams(location.search).get("pet");
  if (daUrl) return daUrl;
  try {
    return localStorage.getItem(PET_SALVO);
  } catch {
    return null;
  }
}

function usePetEscolhido() {
  const logado = clienteLogado();
  const [pets, setPets] = useState(null);
  const [erro, setErro] = useState("");
  const [petId, setPetId] = useState(petSalvo);

  const recarregar = useCallback(async () => {
    try {
      const lista = await pedir(ENDPOINTS.pets, {}, "Não foi possível carregar seus pets.");
      setPets(lista);
      setErro("");
      return lista;
    } catch (err) {
      setPets(p => p ?? []);
      setErro(semServidor(err));
      return null;
    }
  }, []);

  useEffect(() => {
    if (logado) recarregar(); // deslogado: a navegação já mostra o aviso de login
  }, [logado, recarregar]);

  const pet = pets?.length ? pets.find(p => String(p.id_pet) === String(petId)) || pets[0] : null;
  const escolher = id => {
    setPetId(String(id));
    try {
      localStorage.setItem(PET_SALVO, String(id));
    } catch {}
  };
  return { logado, pets, pet, erro, escolher, recarregar };
}

/* Telas da página (como no app): "dispositivos" (lista ou passo a passo), "conectar"
   e o relatório de um aparelho ("coleira" / "comedouro"). Ficam no endereço (#...)
   para o botão Voltar do navegador funcionar. */
const TELAS = ["dispositivos", "conectar", ...APARELHOS];
const telaDaUrl = () => (TELAS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "dispositivos");
const temAparelho = (pet, tipo) => Boolean(pet && (tipo === "coleira" ? pet.id_coleira : pet.id_alimentador));

function SemRelatorio({ logado, erro, carregando }) {
  if (carregando) {
    return (
      <p className="dv-vazio dv-sem-relatorio__carregando" role="status">
        Carregando seus pets...
      </p>
    );
  }
  let titulo = "Entre para ver seus relatórios";
  let texto = "Entre na sua conta para conectar a coleira e o comedouro e acompanhar seus pets por aqui.";
  if (logado && erro) {
    titulo = "Não foi possível carregar seus pets";
    texto = erro;
  }
  return (
    <section className="dv-card dv-sem-relatorio" aria-labelledby="semRelatorioTitulo">
      <span className="dv-sem-relatorio__icone" aria-hidden="true">
        <svg viewBox="0 0 32 32">
          <use href="#paw-icon" />
        </svg>
      </span>
      <h2 id="semRelatorioTitulo">{titulo}</h2>
      <p>{texto}</p>
      <div className="dv-sem-relatorio__acoes">
        {!logado ? (
          <Link className="dv-btn dv-btn--primary" to="/login">
            Entrar na minha conta
          </Link>
        ) : (
          <button type="button" className="dv-btn dv-btn--primary" onClick={() => location.reload()}>
            Tentar de novo
          </button>
        )}
      </div>
    </section>
  );
}

export default function Controle() {
  const [tela, setTela] = useState(telaDaUrl);
  const [tipoNovo, setTipoNovo] = useState("coleira");
  const [toast, aviso] = useAviso();
  const { logado, pets, pet, erro, escolher, recarregar } = usePetEscolhido();

  // troca de tela (cria uma entrada no histórico: o Voltar do navegador volta para a anterior)
  const irPara = proxima => {
    setTela(proxima);
    if (location.hash !== `#${proxima}`) history.pushState(null, "", `#${proxima}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  useEffect(() => {
    const aoMudar = () => setTela(telaDaUrl());
    window.addEventListener("popstate", aoMudar);
    window.addEventListener("hashchange", aoMudar);
    return () => {
      window.removeEventListener("popstate", aoMudar);
      window.removeEventListener("hashchange", aoMudar);
    };
  }, []);

  // relatório só de aparelho conectado; "conectar" só com pet. Senão, volta para a lista.
  const aparelho = APARELHOS.includes(tela) ? tela : null;
  const telaValida = !pets
    ? tela
    : aparelho
      ? temAparelho(pet, aparelho)
        ? tela
        : "dispositivos"
      : tela === "conectar" && !pets.length
        ? "dispositivos"
        : tela;
  useEffect(() => {
    if (pets && telaValida !== tela) {
      setTela(telaValida);
      history.replaceState(history.state, "", `#${telaValida}`);
    }
  }, [pets, tela, telaValida]);

  const abrirRelatorio = ap => {
    escolher(ap.pet.id_pet);
    irPara(ap.tipo);
  };
  const abrirConectar = (tipo = "coleira") => {
    setTipoNovo(tipo);
    irPara("conectar");
  };
  // depois de parear: coleira abre o rastreador; alimentador volta para a lista (igual ao app)
  const aoConectado = async (petConectado, tipo) => {
    await recarregar();
    escolher(petConectado.id_pet);
    if (tipo === "coleira") {
      aviso("Coleira conectada!");
      irPara("coleira");
    } else {
      aviso("Alimentador conectado!");
      irPara("dispositivos");
    }
  };

  const ambos = temAparelho(pet, "coleira") && temAparelho(pet, "comedouro");
  const topoLateral = (
    <>
      <button type="button" className="dv-voltar dv-voltar--lateral" onClick={() => irPara("dispositivos")}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m15 6-6 6 6 6" />
        </svg>
        Meus dispositivos
      </button>
      {ambos && (
        <Seletor
          className="dv-seg--lateral"
          rotulo={`Aparelhos de ${pet.nome_pet}`}
          opcoes={[
            { texto: " Rastreador GPS", icone: "gps" },
            { texto: " Alimentação", icone: "bowl" }
          ]}
          ativo={APARELHOS.indexOf(aparelho)}
          aoMudar={i => irPara(APARELHOS[i])}
        />
      )}
    </>
  );

  let conteudo;
  if (!logado || pets === null || (erro && !pets.length)) {
    conteudo = <SemRelatorio logado={logado} erro={erro} carregando={logado && pets === null} />;
  } else if (telaValida === "conectar") {
    conteudo = (
      <ConectarAparelho
        key={tipoNovo}
        pets={pets}
        tipoInicial={tipoNovo}
        aoVoltar={() => irPara("dispositivos")}
        aoConectado={aoConectado}
      />
    );
  } else if (aparelho && telaValida === aparelho) {
    conteudo = (
      <>
        <section className="dv-painel" id="painel-coleira" aria-label="Rastreador GPS" hidden={aparelho !== "coleira"}>
          {temAparelho(pet, "coleira") && (
            <Coleira key={pet.id_pet} pet={pet} visivel={aparelho === "coleira"} seletorPets={topoLateral} />
          )}
        </section>
        <section className="dv-painel" id="painel-comedouro" aria-label="Alimentação" hidden={aparelho !== "comedouro"}>
          {temAparelho(pet, "comedouro") && (
            <Comedouro key={pet.id_pet} pet={pet} aviso={aviso} seletorPets={topoLateral} />
          )}
        </section>
        <SaudePet pets={pets} pet={pet} erro={erro} />
      </>
    );
  } else {
    conteudo = (
      <>
        <ListaAparelhos
          pets={pets}
          aoAbrir={abrirRelatorio}
          aoConectar={() => abrirConectar()}
          aoMudou={recarregar}
          aviso={aviso}
        />
        {pets.length > 0 && <SaudePet pets={pets} pet={pet} erro={erro} />}
      </>
    );
  }

  return (
    <>
      <ControleIcones />
      <Header atual="controle" />

      <div className="page hs-container">
        <main className="content dv" id="dispositivos">
          <section className="dv-banner">
            <h1 className="dv-banner__titulo">Acompanhe o seu pet em tempo real</h1>
            <img
              className="dv-banner__img"
              src="img/bannerrelatorio-pet.webp"
              width="2000"
              height="679"
              alt="Dispositivos inteligentes: coleira GPS e comedouro automático no mesmo lugar, com relatórios diários e semanais."
            />
          </section>

          {conteudo}
        </main>

        <div
          className={"dv-toast" + (toast.visivel ? " is-visivel" : "")}
          id="dvToast"
          role="status"
          aria-live="polite"
          hidden={!toast.montado}
        >
          {toast.texto}
        </div>
      </div>

      <Footer />
    </>
  );
}
