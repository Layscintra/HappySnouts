import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import AvatarPet from "../../components/AvatarPet.jsx";
import Dialogo from "../../components/Dialogo.jsx";
import Icone from "../../components/Icone.jsx";
import Footer from "../../components/layout/Footer.jsx";
import Header from "../../components/layout/Header.jsx";
import {
  TIPOS,
  tipoDe,
  chaveMes,
  chaveDia,
  mesmoDia,
  hora,
  dataLonga,
  dataCurta,
  diaDaChave,
  normalizarLembrete as normalizar
} from "../../lib/agenda.js";
import { ENDPOINTS, clienteLogado, avisar, semServidor, pedir } from "../../lib/api.js";
import { confirmar } from "../../lib/ui.js";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
];
const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const somarMeses = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);

// 6 semanas (42 dias) começando no domingo antes do dia 1
function diasDaGrade(mes) {
  const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1 - mes.getDay());
  return Array.from({ length: 42 }, (_, i) => new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i));
}

// dia da lista de próximos: "Hoje", "Amanhã" ou "qui., 26/11"
const dataProxima = d =>
  ["Hoje", "Amanhã"].includes(dataCurta(d))
    ? dataCurta(d)
    : d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });

function ItemEvento({ ev, mostrarData = false, aoAbrir }) {
  const t = tipoDe(ev.tipo);
  return (
    <li>
      <button
        type="button"
        className={"cal-ev" + (ev.concluido ? " is-feito" : "")}
        onClick={() => aoAbrir(ev)}
        style={{ "--cor": t.cor }}
      >
        <span className="cal-ev__ico" aria-hidden="true">
          {t.emoji}
        </span>
        <span className="cal-ev__texto">
          <b>{ev.titulo}</b>
          <small>
            {t.nome}
            {ev.pet ? ` · ${ev.pet}` : ""}
            {ev.recorrente ? " · repete" : ""}
          </small>
        </span>
        <span className="cal-ev__hora">
          {mostrarData && <small>{dataProxima(ev.quando)}</small>}
          {ev.concluido ? "Feito ✓" : hora(ev.quando)}
        </span>
      </button>
    </li>
  );
}

function ModalEvento({ aberto, evento, diaInicial, tipoInicial, pets, petInicial, aoFechar, aoSalvo }) {
  const [f, setF] = useState({});
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState("");
  const form = useRef(null);
  const editando = Boolean(evento);

  useEffect(() => {
    if (!aberto) return;
    const base = evento?.quando || diaInicial || new Date();
    setF({
      idPet: String(evento?.idPet ?? petInicial ?? pets[0]?.id_pet ?? ""),
      tipo: evento?.tipo || tipoInicial || "consulta",
      titulo: evento?.titulo || "",
      data: chaveDia(base),
      hora: evento ? hora(evento.quando) : "09:00",
      descricao: evento?.descricao || "",
      recorrente: evento?.recorrente || false
    });
    setErro("");
    setOcupado("");
  }, [aberto, evento, diaInicial, tipoInicial, petInicial, pets]);

  const mudar = (campo, valor) => setF(atual => ({ ...atual, [campo]: valor }));
  const falha = (msg, campo) => {
    setErro(msg);
    if (campo) form.current.elements[campo]?.focus();
  };

  async function executar(qual, tarefa) {
    setOcupado(qual);
    setErro("");
    try {
      await tarefa();
    } catch (err) {
      setErro(semServidor(err));
    } finally {
      setOcupado("");
    }
  }

  const salvar = e => {
    e.preventDefault();
    const titulo = f.titulo.trim() || tipoDe(f.tipo).nome;
    if (!f.idPet) return falha("Escolha o pet.");
    if (titulo.length > 100) return falha("O título pode ter até 100 letras.", "titulo");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.data)) return falha("Escolha a data.", "data");
    if (!/^\d{2}:\d{2}$/.test(f.hora)) return falha("Escolha o horário.", "hora");
    if (f.descricao.length > 150) return falha("A observação pode ter até 150 letras.", "descricao");

    const dados = {
      titulo,
      tipo: f.tipo,
      cor: tipoDe(f.tipo).cor,
      descricao: f.descricao.trim() || null,
      data_hora: `${f.data} ${f.hora}:00`,
      recorrente: f.recorrente
    };
    executar("salvar", async () => {
      if (editando) {
        await pedir(
          `${ENDPOINTS.lembretes}/${evento.id}`,
          { method: "PUT", body: JSON.stringify(dados) },
          "Não foi possível salvar o compromisso."
        );
      } else {
        await pedir(
          ENDPOINTS.lembretes,
          { method: "POST", body: JSON.stringify({ ...dados, id_pet: Number(f.idPet) }) },
          "Não foi possível agendar o compromisso."
        );
      }
      aoFechar();
      avisar(editando ? "Compromisso atualizado!" : "Compromisso agendado! 🐾");
      await aoSalvo(new Date(`${f.data}T${f.hora}:00`));
    });
  };

  const concluir = () =>
    executar("concluir", async () => {
      await pedir(`${ENDPOINTS.lembretes}/${evento.id}/concluir`, { method: "PATCH" }, "Não foi possível concluir.");
      aoFechar();
      avisar("Marcado como feito ✓");
      await aoSalvo();
    });

  const excluir = async () => {
    const ok = await confirmar({
      titulo: "Excluir este lembrete?",
      mensagem: `"${evento.titulo}" sai do calendário e você deixa de ser avisado.`,
      botao: "Excluir",
      tipo: "perigo"
    });
    if (!ok) return;
    executar("excluir", async () => {
      await pedir(`${ENDPOINTS.lembretes}/${evento.id}`, { method: "DELETE" }, "Não foi possível excluir.");
      aoFechar();
      avisar("Compromisso excluído");
      await aoSalvo();
    });
  };

  return (
    <Dialogo
      id="eventoModal"
      className="cal-modal"
      aria-labelledby="eventoTitulo"
      aberto={aberto}
      aoFechar={aoFechar}
      aoAbrir={d => d.querySelector('[name="titulo"]')?.focus()}
    >
      <form className="cal-form" noValidate ref={form} onSubmit={salvar}>
        <header className="cal-form__topo">
          <h2 id="eventoTitulo">{editando ? "Editar compromisso" : "Agendar compromisso"}</h2>
          <button type="button" className="cal-x" data-close aria-label="Fechar">
            <Icone id="x" />
          </button>
        </header>

        {/* pet: no editar não dá para trocar (o backend guarda o lembrete no pet) */}
        <fieldset className="cal-campo">
          <legend>Pet</legend>
          <div className="cal-chips">
            {pets.map(p => (
              <label key={p.id_pet} className={"cal-chip" + (String(p.id_pet) === f.idPet ? " on" : "")}>
                <input
                  type="radio"
                  name="pet"
                  value={p.id_pet}
                  disabled={editando}
                  checked={String(p.id_pet) === f.idPet}
                  onChange={() => mudar("idPet", String(p.id_pet))}
                />
                <AvatarPet pet={p} tamanho={24} /> {p.nome_pet}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="cal-campo">
          <legend>Tipo</legend>
          <div className="cal-tipos">
            {Object.entries(TIPOS).map(([id, t]) => (
              <label key={id} className={"cal-tipo" + (f.tipo === id ? " on" : "")} style={{ "--cor": t.cor }}>
                <input type="radio" name="tipo" value={id} checked={f.tipo === id} onChange={() => mudar("tipo", id)} />
                <span aria-hidden="true">{t.emoji}</span>
                {t.nome}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="cal-campo">
          <span>Título</span>
          <input
            name="titulo"
            maxLength="100"
            placeholder={tipoDe(f.tipo).exemplo}
            value={f.titulo ?? ""}
            onChange={e => mudar("titulo", e.target.value)}
          />
        </label>

        <div className="cal-dupla">
          <label className="cal-campo">
            <span>Data</span>
            <input
              name="data"
              type="date"
              required
              value={f.data ?? ""}
              onChange={e => mudar("data", e.target.value)}
            />
          </label>
          <label className="cal-campo">
            <span>Horário</span>
            <input
              name="hora"
              type="time"
              required
              value={f.hora ?? ""}
              onChange={e => mudar("hora", e.target.value)}
            />
          </label>
        </div>

        <label className="cal-campo">
          <span>Observação (opcional)</span>
          <textarea
            name="descricao"
            rows="2"
            maxLength="150"
            placeholder="Ex.: levar a carteirinha de vacinação"
            value={f.descricao ?? ""}
            onChange={e => mudar("descricao", e.target.value)}
          />
        </label>

        <label className="cal-check">
          <input
            type="checkbox"
            checked={Boolean(f.recorrente)}
            onChange={e => mudar("recorrente", e.target.checked)}
          />
          <span>Lembrete recorrente (repete, como um remédio diário)</span>
        </label>

        <p className="cal-erro" role="alert">
          {erro}
        </p>

        <div className="cal-form__botoes">
          {editando && (
            <button type="button" className="cal-btn cal-btn--perigo" disabled={Boolean(ocupado)} onClick={excluir}>
              <Icone id="trash" /> Excluir
            </button>
          )}
          {editando && !evento.concluido && (
            <button type="button" className="cal-btn cal-btn--leve" disabled={Boolean(ocupado)} onClick={concluir}>
              <Icone id="check" /> {ocupado === "concluir" ? "Salvando..." : "Marcar como feito"}
            </button>
          )}
          <button type="submit" className="cal-btn cal-btn--laranja" disabled={Boolean(ocupado)}>
            {ocupado === "salvar" ? "Salvando..." : editando ? "Salvar" : "Agendar"}
          </button>
        </div>
      </form>
    </Dialogo>
  );
}

// Links vindos do Relatório e de outras telas:
//   /calendario?pet=3&data=2026-11-26&evento=12   abre o dia, filtra o pet e mostra o compromisso
//   /calendario?pet=3&novo=consulta                abre o pop-up para agendar (já com o tipo)
function lerLink() {
  const q = new URLSearchParams(location.search);
  return {
    pet: /^\d+$/.test(q.get("pet") || "") ? q.get("pet") : null,
    dia: diaDaChave(q.get("data")),
    evento: /^\d+$/.test(q.get("evento") || "") ? Number(q.get("evento")) : null,
    novo: q.get("novo") && TIPOS[q.get("novo")] ? q.get("novo") : null
  };
}

export default function Calendario() {
  const logado = clienteLogado();
  const hoje = useMemo(() => new Date(), []);
  const link = useMemo(lerLink, []);
  const pendente = useRef({ evento: link.evento, novo: link.novo }); // abre só uma vez
  const inicio = link.dia || hoje;
  const [mes, setMes] = useState(() => new Date(inicio.getFullYear(), inicio.getMonth(), 1));
  const [diaEscolhido, setDiaEscolhido] = useState(inicio);
  const [pets, setPets] = useState(null);
  const [filtroPet, setFiltroPet] = useState(link.pet || "todos");
  const [porMes, setPorMes] = useState({});
  const [proximos, setProximos] = useState(null);
  const [erro, setErro] = useState("");
  const [modal, setModal] = useState({ aberto: false, evento: null, dia: null });

  // carregar
  // o mês atual e os vizinhos (a grade mostra dias do mês anterior e do próximo)
  const porMesRef = useRef(porMes);
  porMesRef.current = porMes;
  const carregarMeses = useCallback(async (centro, forcar = false) => {
    const chaves = [-1, 0, 1].map(n => chaveMes(somarMeses(centro, n)));
    const faltando = forcar ? chaves : chaves.filter(k => !(k in porMesRef.current));
    if (!faltando.length) return;
    try {
      const listas = await Promise.all(
        faltando.map(k => pedir(`${ENDPOINTS.lembretes}?mes=${k}`, {}, "Não foi possível carregar a agenda."))
      );
      setPorMes(atual => {
        const novo = forcar ? {} : { ...atual };
        faltando.forEach((k, i) => {
          novo[k] = (listas[i] || []).map(normalizar);
        });
        return novo;
      });
      setErro("");
    } catch (err) {
      setErro(semServidor(err));
    }
  }, []);

  const carregarProximos = useCallback(async () => {
    try {
      const lista = await pedir(
        `${ENDPOINTS.lembretes}/proximos?limite=50`,
        {},
        "Não foi possível carregar os próximos compromissos."
      );
      setProximos(lista.map(normalizar));
    } catch {
      setProximos([]);
    }
  }, []);

  useEffect(() => {
    if (!logado) return; // a navegação já mostra o aviso de login
    pedir(ENDPOINTS.pets, {}, "Não foi possível carregar seus pets.")
      .then(setPets)
      .catch(err => {
        setPets([]);
        setErro(semServidor(err));
      });
    carregarProximos();
  }, [logado, carregarProximos]);

  useEffect(() => {
    if (logado) carregarMeses(mes);
  }, [logado, mes, carregarMeses]);

  const recarregar = async irPara => {
    if (irPara) {
      setDiaEscolhido(irPara);
      setMes(new Date(irPara.getFullYear(), irPara.getMonth(), 1));
    }
    await Promise.all([carregarMeses(irPara || mes, true), carregarProximos()]);
  };

  const passaFiltro = ev => filtroPet === "todos" || ev.idPet === Number(filtroPet);
  const eventosDoDia = useMemo(() => {
    const mapa = {};
    Object.values(porMes)
      .flat()
      .filter(passaFiltro)
      .forEach(ev => {
        const k = chaveDia(ev.quando);
        (mapa[k] ||= []).push(ev);
      });
    Object.values(mapa).forEach(l => l.sort((a, b) => a.quando - b.quando));
    return mapa;
  }, [porMes, filtroPet]); // eslint-disable-line react-hooks/exhaustive-deps

  const listaDoDia = eventosDoDia[chaveDia(diaEscolhido)] || [];
  const listaProximos = (proximos || []).filter(passaFiltro).slice(0, 6);
  const temPets = Boolean(pets?.length);
  const petsPorId = useMemo(() => new Map((pets || []).map(p => [Number(p.id_pet), p])), [pets]);

  const abrirNovo = dia => {
    if (!temPets) {
      avisar("Cadastre um pet no seu perfil para agendar compromissos.", "erro");
      return;
    }
    setModal({ aberto: true, evento: null, dia: dia || diaEscolhido });
  };
  const abrirEvento = ev => setModal({ aberto: true, evento: ev, dia: null });

  // link: pet que não é da conta volta para "todos"
  useEffect(() => {
    if (pets && filtroPet !== "todos" && !pets.some(p => String(p.id_pet) === filtroPet)) setFiltroPet("todos");
  }, [pets]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const { evento, novo } = pendente.current;
    if (evento) {
      const ev = Object.values(porMes)
        .flat()
        .find(e => e.id === evento);
      if (ev) {
        pendente.current.evento = null;
        setModal({ aberto: true, evento: ev, dia: null });
      } else if (chaveMes(mes) in porMes) {
        pendente.current.evento = null; // o mês carregou e o compromisso não está lá (foi apagado)
      }
    }
    if (novo && pets) {
      pendente.current.novo = null;
      if (pets.length) setModal({ aberto: true, evento: null, dia: link.dia || diaEscolhido, tipo: novo });
    }
  }, [porMes, pets]); // eslint-disable-line react-hooks/exhaustive-deps

  const escolherDia = d => {
    setDiaEscolhido(d);
    if (d.getMonth() !== mes.getMonth()) setMes(new Date(d.getFullYear(), d.getMonth(), 1));
  };
  const irParaHoje = () => escolherDia(new Date());

  const teclaGrade = e => {
    const passos = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (!passos) return;
    e.preventDefault();
    const d = new Date(diaEscolhido.getFullYear(), diaEscolhido.getMonth(), diaEscolhido.getDate() + passos);
    escolherDia(d);
    setTimeout(() => document.querySelector(`[data-dia="${chaveDia(d)}"]`)?.focus());
  };

  const contagemMes = useMemo(
    () =>
      Object.entries(eventosDoDia)
        .filter(([k]) => k.startsWith(chaveMes(mes)))
        .reduce((s, [, l]) => s + l.length, 0),
    [eventosDoDia, mes]
  );

  return (
    <>
      <CalendarioIcones />
      <Header />

      <main className="cal hs-container">
        {/* banner: a imagem pronta, com o botão de verdade por cima do botão desenhado */}
        <section className="cal-banner">
          <h1 className="cal-banner__titulo">Calendário de vacinas e compromissos</h1>
          <img
            className="cal-banner__img"
            src="img/bannercalendario.webp"
            width="1973"
            height="797"
            alt="Agenda do pet: calendário de vacinas e compromissos. Consultas, vacinas, banho e tosa e remédios num lugar só. Os lembretes também aparecem no app Happy Snouts."
          />
          {/* tampa o "+" desenhado no botão com um pedaço laranja do próprio botão */}
          <span className="cal-banner__tampa" aria-hidden="true" />
          <button type="button" className="cal-banner__btn" onClick={() => abrirNovo()}>
            Agendar compromisso
          </button>
        </section>

        {pets && pets.length > 1 && (
          <div className="cal-filtro" role="radiogroup" aria-label="Filtrar por pet">
            <span className="cal-filtro__rotulo">Mostrar:</span>
            {[{ id_pet: "todos", nome_pet: "Todos os pets" }, ...pets].map(p => {
              const on = String(p.id_pet) === filtroPet;
              return (
                <button
                  key={p.id_pet}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={"cal-chip" + (on ? " on" : "")}
                  onClick={() => setFiltroPet(String(p.id_pet))}
                >
                  {p.id_pet === "todos" ? (
                    <Icone id="paw" className="i cal-chip__paw" />
                  ) : (
                    <AvatarPet pet={p} tamanho={24} />
                  )}
                  {p.nome_pet}
                </button>
              );
            })}
          </div>
        )}

        {pets && !pets.length && !erro && (
          <div className="cal-aviso">
            <span aria-hidden="true">🐶</span>
            <p>
              Você ainda não cadastrou nenhum pet. <Link to="/perfil#pets">Cadastre seu pet no perfil</Link> para
              começar a agenda.
            </p>
          </div>
        )}
        {erro && <p className="cal-aviso cal-aviso--erro">{erro}</p>}

        <div className="cal-cols">
          <section className="cal-card cal-mes" aria-labelledby="calMesTitulo">
            <div className="cal-mes__topo">
              <h2 id="calMesTitulo">
                {MESES[mes.getMonth()]} <span>{mes.getFullYear()}</span>
              </h2>
              <div className="cal-mes__nav">
                <button type="button" className="cal-btn cal-btn--leve" onClick={irParaHoje}>
                  Hoje
                </button>
                <button
                  type="button"
                  className="cal-seta"
                  aria-label="Mês anterior"
                  onClick={() => setMes(m => somarMeses(m, -1))}
                >
                  <Icone id="seta-esq" />
                </button>
                <button
                  type="button"
                  className="cal-seta"
                  aria-label="Próximo mês"
                  onClick={() => setMes(m => somarMeses(m, 1))}
                >
                  <Icone id="seta-dir" />
                </button>
              </div>
            </div>
            <p className="cal-mes__resumo">
              {contagemMes === 0
                ? "Nenhum compromisso neste mês"
                : contagemMes === 1
                  ? "1 compromisso neste mês"
                  : `${contagemMes} compromissos neste mês`}
            </p>

            <div className="cal-grade" role="grid" aria-labelledby="calMesTitulo" onKeyDown={teclaGrade}>
              <div className="cal-grade__semana" role="row">
                {SEMANA.map(d => (
                  <span key={d} role="columnheader">
                    {d}
                  </span>
                ))}
              </div>
              <div className="cal-grade__dias">
                {diasDaGrade(mes).map(d => {
                  const k = chaveDia(d);
                  const evs = eventosDoDia[k] || [];
                  const fora = d.getMonth() !== mes.getMonth();
                  const escolhido = mesmoDia(d, diaEscolhido);
                  return (
                    <button
                      key={k}
                      type="button"
                      role="gridcell"
                      data-dia={k}
                      className={
                        "cal-dia" +
                        (fora ? " is-fora" : "") +
                        (mesmoDia(d, hoje) ? " is-hoje" : "") +
                        (escolhido ? " is-escolhido" : "")
                      }
                      aria-selected={escolhido}
                      tabIndex={escolhido ? 0 : -1}
                      aria-label={`${dataLonga(d)}${evs.length ? `, ${evs.length} ${evs.length === 1 ? "compromisso" : "compromissos"}` : ""}`}
                      onClick={() => escolherDia(d)}
                      onDoubleClick={() => abrirNovo(d)}
                    >
                      <span className="cal-dia__num">{d.getDate()}</span>
                      <span className="cal-dia__evs" aria-hidden="true">
                        {evs.slice(0, 2).map(ev => (
                          <span
                            key={ev.id}
                            className={"cal-pilula" + (ev.concluido ? " is-feito" : "")}
                            style={{ "--cor": tipoDe(ev.tipo).cor }}
                          >
                            {tipoDe(ev.tipo).emoji} {ev.titulo}
                          </span>
                        ))}
                        {evs.length > 2 && <span className="cal-mais">+{evs.length - 2}</span>}
                      </span>
                      {/* no celular a grade mostra só os pontinhos */}
                      {evs.length > 0 && (
                        <span className="cal-pontos" aria-hidden="true">
                          {evs.slice(0, 3).map(ev => (
                            <i key={ev.id} style={{ background: tipoDe(ev.tipo).cor }} />
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <ul className="cal-legenda" aria-label="Tipos de compromisso">
              {Object.values(TIPOS).map(t => (
                <li key={t.nome}>
                  <i style={{ background: t.cor }} /> {t.nome}
                </li>
              ))}
            </ul>
          </section>

          <aside className="cal-lado">
            <section className="cal-card" aria-labelledby="calDiaTitulo">
              <div className="cal-card__topo">
                <div>
                  <h2 id="calDiaTitulo">{mesmoDia(diaEscolhido, hoje) ? "Hoje" : "Dia escolhido"}</h2>
                  <p className="cal-sub">{dataLonga(diaEscolhido)}</p>
                </div>
                <button
                  type="button"
                  className="cal-mini-add"
                  aria-label="Agendar neste dia"
                  title="Agendar neste dia"
                  onClick={() => abrirNovo(diaEscolhido)}
                >
                  <Icone id="plus" />
                </button>
              </div>
              {listaDoDia.length ? (
                <ul className="cal-lista">
                  {listaDoDia.map(ev => (
                    <ItemEvento key={ev.id} ev={ev} aoAbrir={abrirEvento} />
                  ))}
                </ul>
              ) : (
                <p className="cal-vazio">
                  Nada marcado para este dia.{" "}
                  {temPets && (
                    <button type="button" className="cal-link" onClick={() => abrirNovo(diaEscolhido)}>
                      Agendar algo
                    </button>
                  )}
                </p>
              )}
            </section>

            <section className="cal-card" aria-labelledby="calProxTitulo">
              <div className="cal-card__topo">
                <div>
                  <h2 id="calProxTitulo">Próximos compromissos</h2>
                  <p className="cal-sub">
                    {filtroPet === "todos"
                      ? "De todos os pets"
                      : `Só de ${petsPorId.get(Number(filtroPet))?.nome_pet || "um pet"}`}
                  </p>
                </div>
              </div>
              {proximos === null ? (
                <p className="cal-vazio">Carregando... 🐾</p>
              ) : listaProximos.length ? (
                <ul className="cal-lista">
                  {listaProximos.map(ev => (
                    <ItemEvento key={ev.id} ev={ev} mostrarData aoAbrir={abrirEvento} />
                  ))}
                </ul>
              ) : (
                <p className="cal-vazio">Nenhum compromisso pela frente. Aproveite para agendar a próxima vacina! 💉</p>
              )}
            </section>
          </aside>
        </div>
      </main>

      <Footer />

      <ModalEvento
        aberto={modal.aberto}
        evento={modal.evento}
        diaInicial={modal.dia}
        tipoInicial={modal.tipo}
        pets={pets || []}
        petInicial={filtroPet !== "todos" ? filtroPet : undefined}
        aoFechar={() => setModal(m => ({ ...m, aberto: false }))}
        aoSalvo={recarregar}
      />
    </>
  );
}

function CalendarioIcones() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ display: "none" }}>
      <symbol id="search" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </symbol>
      <symbol id="chat" viewBox="0 0 24 24">
        <path d="M21 11.5a8.5 8.5 0 0 1-12.9 7.3L3 20l1.2-4.1A8.5 8.5 0 1 1 21 11.5Z" />
      </symbol>
      <symbol id="cart" viewBox="0 0 24 24">
        <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 7H6" />
        <circle cx="10" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
      </symbol>
      <symbol id="box" viewBox="0 0 24 24">
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="M3 8v9l9 5 9-5V8M12 13v9" />
      </symbol>
      <symbol id="chart" viewBox="0 0 24 24">
        <path d="M3 3v18h18" />
        <path d="m8 14 4-4 4 4 5-7" />
      </symbol>
      <symbol id="user" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </symbol>
      <symbol id="plus" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" />
      </symbol>
      <symbol id="seta-esq" viewBox="0 0 24 24">
        <path d="M15 5 8 12l7 7" />
      </symbol>
      <symbol id="seta-dir" viewBox="0 0 24 24">
        <path d="m9 5 7 7-7 7" />
      </symbol>
      <symbol id="x" viewBox="0 0 24 24">
        <path d="M6 6l12 12M18 6 6 18" />
      </symbol>
      <symbol id="trash" viewBox="0 0 24 24">
        <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-12" />
      </symbol>
      <symbol id="check" viewBox="0 0 24 24">
        <path d="m5 12 5 5 9-10" />
      </symbol>
      <symbol id="paw" viewBox="0 0 40 40">
        <path d="M20 19c5.5 0 10.5 6.4 10.5 11 0 3.2-2.6 4.6-5.3 4.6-2.4 0-3.4-1.2-5.2-1.2s-2.8 1.2-5.2 1.2c-2.7 0-5.3-1.4-5.3-4.6C9.5 25.4 14.5 19 20 19Z" />
        <ellipse cx="8" cy="17" rx="3.6" ry="4.6" transform="rotate(-20 8 17)" />
        <ellipse cx="15" cy="9" rx="3.6" ry="4.8" transform="rotate(-6 15 9)" />
        <ellipse cx="25" cy="9" rx="3.6" ry="4.8" transform="rotate(6 25 9)" />
        <ellipse cx="32" cy="17" rx="3.6" ry="4.6" transform="rotate(20 32 17)" />
      </symbol>
    </svg>
  );
}
