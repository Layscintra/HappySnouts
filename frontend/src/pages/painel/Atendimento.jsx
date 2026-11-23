// O backend guarda uma resposta por mensagem: responder de novo substitui a anterior.

import { useEffect, useRef, useState } from "react";
import { ENDPOINTS, avisar, pedir, semServidor, json } from "../../lib/api.js";
import { confirmar } from "../../lib/ui.js";
import { Cabecalho, Estado, Icone, STATUS_MENSAGEM, Selo, dataHora, norm, tempoAtras } from "./comum.jsx";

const FILTROS = [
  ["aberta", "Aguardando"],
  ["respondida", "Respondidas"],
  ["fechada", "Encerradas"],
  ["todas", "Todas"]
];

const iniciais = nome =>
  String(nome || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase())
    .join("");
const protocolo = m => `#${String(m.id_mensagem).padStart(5, "0")}`;

export default function Atendimento({ mensagens, erro, recarregar }) {
  const [filtro, setFiltro] = useState("aberta");
  const [busca, setBusca] = useState("");
  const [selecionada, setSelecionada] = useState(null);

  const lista = mensagens || [];
  const contar = s => (s === "todas" ? lista.length : lista.filter(m => m.status === s).length);
  const q = norm(busca.trim());
  const visiveis = lista.filter(
    m =>
      (filtro === "todas" || m.status === filtro) &&
      (!q ||
        norm(m.nome).includes(q) ||
        norm(m.email).includes(q) ||
        norm(m.assunto).includes(q) ||
        norm(m.mensagem).includes(q) ||
        protocolo(m).includes(q))
  );
  const atual = lista.find(m => m.id_mensagem === selecionada) || null;

  return (
    <>
      <Cabecalho
        titulo="Atendimento"
        subtitulo="Mensagens do Fale conosco. Novas mensagens aparecem sozinhas a cada 30 segundos."
      >
        <button type="button" className="ghost borda" onClick={recarregar}>
          <Icone id="refresh" />
          Atualizar
        </button>
      </Cabecalho>

      <Estado erro={erro} carregando={!mensagens} aoTentar={recarregar}>
        <div className={"chat" + (atual ? " com-conversa" : "")}>
          <aside className="chat-lista" aria-label="Conversas">
            <div className="chat-filtros">
              <label className="busca">
                <Icone id="search" />
                <input
                  type="search"
                  placeholder="Buscar conversa"
                  aria-label="Buscar conversa"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                />
              </label>
              <div className="chips" role="group" aria-label="Filtrar conversas">
                {FILTROS.map(([id, rotulo]) => (
                  <button
                    key={id}
                    type="button"
                    className="chip"
                    aria-pressed={filtro === id}
                    onClick={() => setFiltro(id)}
                  >
                    {rotulo} <span className="chip-n">{contar(id)}</span>
                  </button>
                ))}
              </div>
            </div>
            <ul className="conversas">
              {visiveis.map(m => (
                <li key={m.id_mensagem}>
                  <button
                    type="button"
                    className={
                      "conversa" +
                      (m.id_mensagem === selecionada ? " ativa" : "") +
                      (m.status === "aberta" ? " nova" : "")
                    }
                    aria-current={m.id_mensagem === selecionada ? "true" : undefined}
                    onClick={() => setSelecionada(m.id_mensagem)}
                  >
                    <span className="avatar" aria-hidden="true">
                      {iniciais(m.nome)}
                    </span>
                    <span className="conversa-txt">
                      <span className="conversa-topo">
                        <b>{m.nome}</b>
                        <small>{tempoAtras(m.data_resposta || m.data_envio)}</small>
                      </span>
                      <span className="conversa-assunto">{m.assunto || "Sem assunto"}</span>
                      <span className="conversa-previa">{m.resposta ? `Você: ${m.resposta}` : m.mensagem}</span>
                    </span>
                    {m.status === "aberta" && <span className="ponto" aria-label="Aguardando resposta" />}
                  </button>
                </li>
              ))}
              {!visiveis.length && (
                <li className="conversas-vazio">
                  {lista.length ? "Nenhuma conversa aqui." : "Nenhuma mensagem recebida ainda."}
                </li>
              )}
            </ul>
          </aside>

          <section className="chat-conversa" aria-label="Conversa">
            {atual ? (
              <Conversa key={atual.id_mensagem} m={atual} aoVoltar={() => setSelecionada(null)} aoMudou={recarregar} />
            ) : (
              <div className="chat-vazio">
                <Icone id="chat" />
                <p>Escolha uma conversa para ver a mensagem e responder.</p>
              </div>
            )}
          </section>
        </div>
      </Estado>
    </>
  );
}

function Conversa({ m, aoVoltar, aoMudou }) {
  const [resposta, setResposta] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fim = useRef(null);
  const st = STATUS_MENSAGEM[m.status] || STATUS_MENSAGEM.aberta;
  const fechada = m.status === "fechada";

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "nearest" });
  }, [m.resposta]);

  const enviar = async e => {
    e?.preventDefault();
    if (resposta.trim().length < 2) {
      setErro("Escreva a resposta.");
      return;
    }
    if (
      m.resposta &&
      !(await confirmar({
        titulo: "Substituir a resposta?",
        mensagem: "Esta mensagem já foi respondida. Enviar de novo troca a resposta anterior pela nova.",
        botao: "Enviar nova resposta",
        tipo: "aviso"
      }))
    )
      return;
    setEnviando(true);
    setErro("");
    try {
      await pedir(
        `${ENDPOINTS.contato}/${m.id_mensagem}/responder`,
        json("PATCH", { resposta: resposta.trim() }),
        "Não foi possível enviar a resposta."
      );
      setResposta("");
      avisar("Resposta enviada por e-mail e no app do cliente.");
      await aoMudou();
    } catch (err) {
      setErro(semServidor(err));
    } finally {
      setEnviando(false);
    }
  };

  const mudarStatus = async status => {
    try {
      await pedir(
        `${ENDPOINTS.contato}/${m.id_mensagem}/status`,
        json("PATCH", { status }),
        "Não foi possível atualizar o atendimento."
      );
      avisar(status === "fechada" ? "Atendimento encerrado." : "Atendimento reaberto.");
      await aoMudou();
    } catch (err) {
      setErro(semServidor(err));
    }
  };

  return (
    <>
      <header className="conversa-cab">
        <button type="button" className="x voltar" onClick={aoVoltar} aria-label="Voltar para a lista">
          <Icone id="back" />
        </button>
        <span className="avatar" aria-hidden="true">
          {iniciais(m.nome)}
        </span>
        <div className="conversa-quem">
          <b>{m.nome}</b>
          <small>
            <a href={`mailto:${m.email}`}>{m.email}</a> · Protocolo {protocolo(m)}
          </small>
        </div>
        <Selo tom={st.tom}>{st.rotulo}</Selo>
        <button
          type="button"
          className="ghost borda btn-sm"
          onClick={() => mudarStatus(fechada ? "aberta" : "fechada")}
        >
          {fechada ? "Reabrir" : "Encerrar"}
        </button>
      </header>

      <div className="mensagens">
        <p className="assunto-linha">
          Assunto: <b>{m.assunto || "Sem assunto"}</b>
        </p>
        <div className="balao cliente">
          <p>{m.mensagem}</p>
          <small>
            {m.nome.split(" ")[0]} · {dataHora(m.data_envio)}
          </small>
        </div>
        {m.resposta && (
          <div className="balao equipe">
            <p>{m.resposta}</p>
            <small>
              {m.funcionario || "Equipe"} · {dataHora(m.data_resposta)}
            </small>
          </div>
        )}
        <span ref={fim} />
      </div>

      {fechada ? (
        <div className="compor fechado">
          <p>Atendimento encerrado. Reabra para responder de novo.</p>
        </div>
      ) : (
        <form className="compor" onSubmit={enviar}>
          {m.resposta && <small className="nota">Enviar outra resposta substitui a anterior.</small>}
          <div className="compor-linha">
            <textarea
              rows="3"
              value={resposta}
              onChange={e => setResposta(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) enviar(e);
              }}
              placeholder={`Responder ${m.nome.split(" ")[0]}... (Ctrl + Enter envia)`}
              aria-label="Resposta"
            />
            <button className="btn" disabled={enviando} aria-label="Enviar resposta">
              <Icone id="send" />
              <span>{enviando ? "Enviando..." : "Enviar"}</span>
            </button>
          </div>
          <p className="err" role="alert">
            {erro}
          </p>
        </form>
      )}
    </>
  );
}
