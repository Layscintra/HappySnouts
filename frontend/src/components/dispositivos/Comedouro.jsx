// Dados simulados: ainda não há integração com o alimentador físico.

import { useEffect, useRef, useState } from "react";
import { confirmar } from "../../lib/ui.js";
import {
  Icone,
  Carregando,
  Seletor,
  CardAparelho,
  Selos,
  Relatorio,
  DIAS,
  diaDaSemana,
  gramas,
  mesmoDia,
  quando
} from "./comum.jsx";

const PORCAO = 90;
const SEMANA = { gramas: [630, 540, 630, 630, 540, 630, 630], refeicoes: [4, 3, 4, 4, 3, 4, 4] };
const HORARIOS_INICIAIS = [
  { hora: "08:00", porcoes: 2, ativo: true },
  { hora: "12:00", porcoes: 2, ativo: true },
  { hora: "18:00", porcoes: 2, ativo: true },
  { hora: "23:00", porcoes: 1, ativo: true }
];

const minutosDe = hora => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};
const gramasDe = h => h.porcoes * PORCAO;
const porcoesTexto = h => `${h.porcoes} ${h.porcoes === 1 ? "porção" : "porções"} • ${gramasDe(h)}g`;
const iconeHorario = hora => (minutosDe(hora) < 17 * 60 ? "sun" : "moon");

function historicoInicial() {
  const agora = new Date();
  const lista = [];
  for (const dias of [0, 1]) {
    for (const h of [...HORARIOS_INICIAIS].reverse()) {
      const t = new Date(agora);
      t.setDate(t.getDate() - dias);
      t.setHours(...h.hora.split(":").map(Number), 0, 0);
      if (t > agora) continue;
      const atrasou = dias === 1 && h.hora === "12:00";
      if (atrasou) t.setMinutes(t.getMinutes() + 4);
      lista.push({ quando: t, gramas: gramasDe(h), status: atrasou ? "atraso" : "ok", atraso: atrasou ? 4 : 0 });
    }
  }
  return lista;
}

function ModalRefeicao({ aberto, horarios, aoFechar, aoSalvar }) {
  const dialogo = useRef(null);
  const campoHora = useRef(null);
  const [hora, setHora] = useState("08:00");
  const [porcoes, setPorcoes] = useState(1);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const d = dialogo.current;
    if (aberto && !d.open) {
      setHora("08:00");
      setPorcoes(1);
      setErro("");
      d.showModal();
      campoHora.current.focus();
    }
    if (!aberto && d.open) d.close();
  }, [aberto]);

  const salvar = e => {
    e.preventDefault();
    if (horarios.some(h => h.hora === hora)) {
      setErro(`Já existe uma refeição às ${hora}.`);
      return;
    }
    aoSalvar({ hora, porcoes, ativo: true });
  };

  return (
    <dialog
      className="dv-modal"
      id="modalRefeicao"
      aria-labelledby="modalRefeicaoTitulo"
      ref={dialogo}
      onClose={aoFechar}
      onClick={e => {
        if (e.target === dialogo.current) dialogo.current.close();
      }}
    >
      <form className="dv-modal__caixa" id="formRefeicao" onSubmit={salvar}>
        <h2 id="modalRefeicaoTitulo">Nova refeição</h2>
        <label className="dv-campo">
          <span>Horário</span>
          <input
            ref={campoHora}
            type="time"
            name="hora"
            required
            value={hora}
            onChange={e => setHora(e.target.value)}
          />
        </label>
        <div className="dv-campo">
          <span>Porções</span>
          <div className="dv-stepper">
            <button
              type="button"
              aria-label="Menos porções"
              disabled={porcoes <= 1}
              onClick={() => setPorcoes(p => Math.max(1, p - 1))}
            >
              −
            </button>
            <output name="porcoes">{porcoes}</output>
            <button
              type="button"
              aria-label="Mais porções"
              disabled={porcoes >= 6}
              onClick={() => setPorcoes(p => Math.min(6, p + 1))}
            >
              +
            </button>
          </div>
          <small className="dv-campo__dica" id="gramasRefeicao">
            {porcoes * PORCAO} g por refeição
          </small>
        </div>
        <p className="dv-modal__erro" id="erroRefeicao" hidden={!erro}>
          {erro}
        </p>
        <div className="dv-modal__botoes">
          <button
            type="button"
            className="dv-btn dv-btn--ghost"
            id="cancelarRefeicao"
            onClick={() => dialogo.current.close()}
          >
            Cancelar
          </button>
          <button type="submit" className="dv-btn dv-btn--primary">
            Salvar
          </button>
        </div>
      </form>
    </dialog>
  );
}

export default function Comedouro({ aviso, pet, seletorPets }) {
  const semente = Number(pet?.id_pet) || 0;
  const [conectado, setConectado] = useState(true);
  const [bateria] = useState(pet ? 40 + ((semente * 29) % 58) : 67);
  const capacidade = 2000;
  const [reservatorio, setReservatorio] = useState(pet ? 300 + ((semente * 433) % 1600) : 1560);
  const [horarios, setHorarios] = useState(HORARIOS_INICIAIS);
  const [historico, setHistorico] = useState(historicoInicial);
  const [liberando, setLiberando] = useState("parado"); // parado | liberando | liberado
  const [trocandoConexao, setTrocandoConexao] = useState(false);
  const [aba, setAba] = useState(0);
  const [modal, setModal] = useState(false);
  const [barraPronta, setBarraPronta] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setBarraPronta(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const ativos = horarios.filter(h => h.ativo);
  const porDia = ativos.reduce((s, h) => s + gramasDe(h), 0);

  const nivel = reservatorio / capacidade;
  const baixo = nivel < 0.2;
  const dura = porDia ? Math.floor(reservatorio / porDia) : null;

  const alternarConexao = () => {
    setTrocandoConexao(true);
    setTimeout(() => {
      const novo = !conectado;
      setConectado(novo);
      aviso(novo ? "Comedouro conectado" : "Comedouro desconectado");
      setTrocandoConexao(false);
    }, 800);
  };

  const liberarPorcao = () => {
    if (!conectado || liberando !== "parado") return;
    if (reservatorio < PORCAO) {
      aviso("Reservatório quase vazio. Reabasteça o comedouro.");
      return;
    }
    setLiberando("liberando");
    setTimeout(() => {
      setReservatorio(r => r - PORCAO);
      setHistorico(h => [{ quando: new Date(), gramas: PORCAO, status: "manual", novo: true }, ...h]);
      setLiberando("liberado");
      aviso(`Porção de ${PORCAO} g liberada`);
      setTimeout(() => setLiberando("parado"), 2200);
    }, 1200);
  };

  const ordenados = [...ativos].sort((a, b) => minutosDe(a.hora) - minutosDe(b.hora));
  const agoraMin = new Date().getHours() * 60 + new Date().getMinutes();
  const hojeTem = ordenados.find(h => minutosDe(h.hora) > agoraMin);
  const proxima = !ordenados.length ? null : hojeTem ? { h: hojeTem, hoje: true } : { h: ordenados[0], hoje: false };

  const alternarHorario = (i, ativo) => {
    const h = horarios[i];
    setHorarios(lista => lista.map((x, k) => (k === i ? { ...x, ativo } : x)));
    aviso(ativo ? `Refeição das ${h.hora} ativada` : `Refeição das ${h.hora} pausada`);
  };

  const excluirHorario = async i => {
    const h = horarios[i];
    const ok = await confirmar({
      titulo: `Excluir a refeição das ${h.hora}?`,
      mensagem: "Para só pausar essa refeição, use o interruptor ao lado dela.",
      botao: "Excluir",
      tipo: "perigo"
    });
    if (!ok) return;
    setHorarios(lista => lista.filter((_, k) => k !== i));
    aviso("Refeição excluída");
  };

  const adicionarHorario = novo => {
    setHorarios(lista => [...lista, novo].sort((a, b) => minutosDe(a.hora) - minutosDe(b.hora)));
    setModal(false);
    aviso(`Refeição das ${novo.hora} adicionada`);
  };

  const dadosRelatorio = faixa => {
    const semanal = faixa === 1;
    const agora = new Date();
    const d = diaDaSemana();
    const deHoje = historico.filter(l => mesmoDia(l.quando, agora));
    const gHoje = deHoje.reduce((s, l) => s + l.gramas, 0);
    const gPassado = SEMANA.gramas.slice(0, d).reduce((s, v) => s + v, 0);
    const media = (gPassado + gHoje) / (d + 1);
    let rotulos,
      valores,
      destaque = null,
      total,
      refeicoes;
    if (semanal) {
      rotulos = DIAS;
      valores = DIAS.map((_, i) => (i < d ? SEMANA.gramas[i] : i === d ? gHoje : 0));
      destaque = d;
      total = gPassado + gHoje;
      refeicoes = SEMANA.refeicoes.slice(0, d).reduce((s, v) => s + v, 0) + deHoje.length;
    } else {
      const lista = [...horarios].sort((a, b) => minutosDe(a.hora) - minutosDe(b.hora));
      rotulos = lista.map(h => h.hora);
      valores = lista.map(() => 0);
      let extra = 0,
        ultima = null;
      for (const l of deHoje) {
        const min = l.quando.getHours() * 60 + l.quando.getMinutes();
        const i =
          l.status === "manual" ? -1 : lista.findIndex(h => min >= minutosDe(h.hora) && min - minutosDe(h.hora) <= 30);
        if (i < 0) extra += l.gramas;
        else valores[i] += l.gramas;
        if (!ultima || l.quando > ultima) {
          ultima = l.quando;
          destaque = i < 0 ? lista.length : i;
        }
      }
      if (extra) {
        rotulos.push("Extra");
        valores.push(extra);
      }
      total = gHoje;
      refeicoes = deHoje.length;
    }
    return {
      titulo: semanal ? "Resumo da semana" : "Resumo de hoje",
      sub: conectado ? "Atualizado agora" : "Comedouro offline",
      metricas: [
        {
          icone: "bowl",
          cor: "orange",
          rotulo: "Total Consumido",
          valor: gramas(total),
          nota: semanal ? "nesta semana" : "hoje"
        },
        {
          icone: "insights",
          cor: "blue",
          rotulo: "Média Diária",
          valor: gramas(media),
          nota: `meta ${gramas(porDia)}`
        },
        {
          icone: "check",
          cor: "green",
          rotulo: "Refeições Entregues",
          valor: String(refeicoes),
          nota: semanal ? "nesta semana" : `de ${ativos.length} programadas`
        }
      ],
      grafico: {
        titulo: "Ração liberada",
        sub: semanal ? "Gramas por dia da semana" : "Gramas por horário",
        rotulos,
        valores,
        unidade: " g",
        destaque
      },
      eventos: {
        titulo: "Últimas refeições",
        sub: "Liberadas pelo comedouro",
        itens: historico.slice(0, 6).map(l => ({
          chave: `${l.quando.getTime()}-${l.status}`,
          icone: l.status === "manual" ? "hand" : "bowl",
          cor: l.status === "ok" ? "green" : l.status === "atraso" ? "orange" : "blue",
          titulo: l.status === "manual" ? "Porção extra" : "Refeição entregue",
          sub: `${l.gramas} g • ${l.status === "ok" ? "no horário" : l.status === "atraso" ? `atrasou ${l.atraso} min` : "liberada pelo site"}`,
          hora: quando(l.quando),
          novo: l.novo
        })),
        vazio: "Nenhuma refeição liberada ainda."
      }
    };
  };

  return (
    <>
      <div className="dv-lateral">
        {seletorPets}
        <CardAparelho
          foto={
            <div className="dv-device__foto">
              <img src="img/comedouro.png" alt="Comedouro automático" />
            </div>
          }
          nome={pet ? `Comedouro de ${pet.nome_pet}` : "Comedouro Automático"}
          sub={`Porção padrão de ${PORCAO} g`}
          selos={<Selos online={conectado} bateria={bateria} />}
          linhas={[
            {
              icone: "wifi",
              rotulo: "Conexão",
              conteudo: (
                <button
                  type="button"
                  className={"dv-btn dv-btn--pill" + (conectado ? " is-off" : "")}
                  id="btnConexao"
                  disabled={trocandoConexao}
                  onClick={alternarConexao}
                >
                  {trocandoConexao ? (
                    <>
                      <Carregando /> {conectado ? "Desconectando..." : "Conectando..."}
                    </>
                  ) : conectado ? (
                    <>
                      <Icone id="unlink" /> Desconectar
                    </>
                  ) : (
                    <>
                      <Icone id="link" /> Conectar
                    </>
                  )}
                </button>
              )
            },
            {
              icone: "clock",
              rotulo: "Refeições por dia",
              valor: `${ativos.length} • ${gramas(porDia)}`,
              id: "refeicoesDia"
            },
            { icone: "box", rotulo: "Ração no reservatório", valor: `${Math.round(nivel * 100)}%`, id: "nivelTexto" }
          ]}
        >
          <div className="dv-reservatorio">
            <div className={"dv-barra" + (baixo ? " dv-barra--baixa" : "")} id="nivelBarra">
              <span style={{ width: barraPronta ? `${nivel * 100}%` : undefined }} />
            </div>
            <small id="nivelNota">
              {baixo
                ? `Reabasteça em breve • ${gramas(reservatorio)} restantes`
                : `${gramas(reservatorio)} restantes${dura !== null ? ` • dura cerca de ${dura} ${dura === 1 ? "dia" : "dias"}` : ""}`}
            </small>
          </div>
          <button
            type="button"
            className={"dv-btn dv-btn--primary dv-btn--big" + (liberando === "liberado" ? " dv-btn--ok" : "")}
            id="btnLiberar"
            disabled={!conectado || liberando !== "parado"}
            onClick={liberarPorcao}
          >
            {liberando === "liberando" ? (
              <>
                <Carregando /> Liberando ração...
              </>
            ) : liberando === "liberado" ? (
              <>
                <Icone id="check" /> Porção liberada! ({PORCAO} g)
              </>
            ) : conectado ? (
              <>
                <Icone id="bowl" /> Liberar Porção Agora
              </>
            ) : (
              <>
                <Icone id="bowl" /> Conecte para liberar
              </>
            )}
          </button>
        </CardAparelho>
      </div>

      <div className="dv-coluna">
        <Seletor
          opcoes={[
            { texto: "Agendamentos", icone: "clock" },
            { texto: "Relatórios & Consumo", icone: "chart" }
          ]}
          ativo={aba}
          aoMudar={setAba}
          rotulo="Seções do comedouro"
        />

        <div className="dv-aba" hidden={aba !== 0}>
          <div className="dv-destaque">
            <div className="dv-destaque__texto">
              <p className="dv-destaque__rotulo">Próxima refeição</p>
              <p className="dv-destaque__valor" id="proximaValor">
                {proxima ? `${proxima.hoje ? "Hoje" : "Amanhã"} às ${proxima.h.hora}` : "Nenhuma ativa"}
              </p>
              <p className="dv-destaque__sub" id="proximaSub">
                {proxima ? porcoesTexto(proxima.h) : "Ative um horário para programar o comedouro"}
              </p>
            </div>
            <span className="dv-destaque__icone">
              <Icone id="clock" />
            </span>
          </div>
          <article className="dv-card">
            <div className="dv-titulo">
              <div>
                <h3>Horários</h3>
                <p id="horariosResumo">{`${ativos.length} de ${horarios.length} ativos • ${porDia} g/dia`}</p>
              </div>
              <button type="button" className="dv-btn dv-btn--primary" id="btnAdicionar" onClick={() => setModal(true)}>
                <Icone id="plus" /> Adicionar
              </button>
            </div>
            <ul className="dv-lista" id="listaHorarios">
              {horarios.length ? (
                horarios.map((h, i) => (
                  <li key={h.hora} className={"dv-horario" + (h.ativo ? "" : " is-pausado")}>
                    <span className="dv-chip dv-chip--orange">
                      <Icone id={iconeHorario(h.hora)} />
                    </span>
                    <div className="dv-item__texto">
                      <p className="dv-horario__hora">{h.hora}</p>
                      <p className="dv-item__sub">{h.ativo ? porcoesTexto(h) : "Pausado"}</p>
                    </div>
                    <label className="dv-switch" title={`${h.ativo ? "Pausar" : "Ativar"} ${h.hora}`}>
                      <input
                        type="checkbox"
                        checked={h.ativo}
                        aria-label={`Refeição das ${h.hora} ativa`}
                        onChange={e => alternarHorario(i, e.target.checked)}
                      />
                      <span />
                    </label>
                    <button
                      type="button"
                      className="dv-icone-btn"
                      aria-label={`Excluir refeição das ${h.hora}`}
                      onClick={() => excluirHorario(i)}
                    >
                      <Icone id="trash" />
                    </button>
                  </li>
                ))
              ) : (
                <li>
                  <p className="dv-vazio">Nenhum horário programado.</p>
                </li>
              )}
            </ul>
          </article>
        </div>

        <div className="dv-aba" hidden={aba !== 1}>
          <Relatorio dados={dadosRelatorio} />
        </div>
      </div>

      <ModalRefeicao aberto={modal} horarios={horarios} aoFechar={() => setModal(false)} aoSalvar={adicionarHorario} />
    </>
  );
}
