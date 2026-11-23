import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  tipoDe,
  hora,
  dataCurta,
  dataBr,
  formatarPeso,
  normalizarLembrete,
  buscarPesos,
  linkAgenda,
  linkPeso
} from "../../lib/agenda.js";
import { ENDPOINTS, clienteLogado, pedir } from "../../lib/api.js";
import { Icone } from "./comum.jsx";

function Cartao({ href, cor, icone, rotulo, valor, nota, acao }) {
  return (
    <Link className="dv-card dv-kpi dv-kpi--link" to={href}>
      <span className={`dv-chip dv-chip--${cor}`}>
        <Icone id={icone} />
      </span>
      <p className="dv-kpi__rotulo">{rotulo}</p>
      <p className="dv-kpi__valor">{valor}</p>
      <p className="dv-kpi__nota">{nota}</p>
      <span className="dv-kpi__acao">
        {acao} <span aria-hidden="true">›</span>
      </span>
    </Link>
  );
}

export default function SaudePet({ pets, pet, erro }) {
  const logado = clienteLogado();
  const [proximos, setProximos] = useState(null);
  const [pesos, setPesos] = useState({}); // id_pet -> histórico (null = backend sem histórico)

  useEffect(() => {
    if (!logado) return; // a navegação já mostra o aviso de login
    pedir(`${ENDPOINTS.lembretes}/proximos?limite=50`, {}, "Não foi possível carregar a agenda.")
      .then(lista => setProximos(lista.map(normalizarLembrete)))
      .catch(() => setProximos([]));
  }, [logado]);

  useEffect(() => {
    if (!pet || pet.id_pet in pesos) return;
    buscarPesos(pet.id_pet)
      .then(lista => setPesos(p => ({ ...p, [pet.id_pet]: lista })))
      .catch(() => setPesos(p => ({ ...p, [pet.id_pet]: null })));
  }, [pet]); // eslint-disable-line react-hooks/exhaustive-deps

  const doPet = (proximos || []).filter(ev => pet && ev.idPet === Number(pet.id_pet) && !ev.concluido);
  const consulta = doPet.find(ev => ev.tipo === "consulta");
  const lembretes = doPet.filter(ev => ev.tipo !== "consulta");
  const lembrete = lembretes[0];

  const historico = pet ? pesos[pet.id_pet] : undefined;
  const ultimo = historico?.length ? historico[historico.length - 1] : null;
  const anterior = historico?.length > 1 ? historico[historico.length - 2] : null;
  const pesoAtual = ultimo ? ultimo.peso : pet?.peso_atual != null ? Number(pet.peso_atual) : null;
  let notaPeso = "Nenhuma pesagem registrada";
  if (ultimo) {
    const dia = dataCurta(ultimo.quando);
    notaPeso = `Última pesagem: ${["Hoje", "Ontem", "Amanhã"].includes(dia) ? dia.toLowerCase() : dataBr(ultimo.quando)}`;
    if (anterior) {
      const dif = ultimo.peso - anterior.peso;
      notaPeso += dif === 0 ? " · sem mudança" : ` · ${dif > 0 ? "+" : "−"}${formatarPeso(Math.abs(dif))}`;
    }
  } else if (pesoAtual != null) {
    notaPeso = "Peso informado no cadastro";
  }

  const nome = pet?.nome_pet || "seu pet";
  const quando = ev => `${dataCurta(ev.quando)}, ${hora(ev.quando)}`;

  return (
    <section className="dv-saude" aria-labelledby="saudeTitulo">
      <div className="dv-titulo">
        <div>
          <h2 id="saudeTitulo">Saúde de {nome}</h2>
          <p>Peso, lembretes e consultas</p>
        </div>
      </div>

      {erro && <p className="dv-saude__aviso">{erro}</p>}

      {pets && !pets.length && !erro && (
        <p className="dv-saude__aviso">
          Você ainda não cadastrou nenhum pet. <Link to="/perfil#pets">Cadastre seu pet no perfil</Link> para ver o
          resumo de saúde.
        </p>
      )}

      {!pets && <p className="dv-saude__aviso">Carregando a saúde do seu pet... 🐾</p>}

      {pet && (
        <div className="dv-saude__grid">
          <Cartao
            href={linkPeso(pet.id_pet)}
            cor="orange"
            icone="scale"
            rotulo="Peso"
            valor={
              historico === undefined && pesoAtual == null ? "…" : pesoAtual != null ? formatarPeso(pesoAtual) : "-"
            }
            nota={notaPeso}
            acao={pesoAtual != null ? "Ver histórico de peso" : "Registrar peso"}
          />
          <Cartao
            href={
              lembrete
                ? linkAgenda({ pet: pet.id_pet, data: lembrete.quando, evento: lembrete.id })
                : linkAgenda({ pet: pet.id_pet, novo: "remedio" })
            }
            cor="blue"
            icone="bell"
            rotulo="Próximo lembrete"
            valor={proximos === null ? "…" : lembrete ? quando(lembrete) : "Nenhum"}
            nota={
              lembrete
                ? lembretes
                    .slice(0, 3)
                    .map(ev => `${tipoDe(ev.tipo).emoji} ${ev.titulo}`)
                    .join(" • ")
                : "Agende remédios, vacinas e banhos"
            }
            acao={lembrete ? "Abrir na agenda" : "Agendar lembrete"}
          />
          <Cartao
            href={
              consulta
                ? linkAgenda({ pet: pet.id_pet, data: consulta.quando, evento: consulta.id })
                : linkAgenda({ pet: pet.id_pet, novo: "consulta" })
            }
            cor="green"
            icone="calendar"
            rotulo="Próxima consulta"
            valor={proximos === null ? "…" : consulta ? quando(consulta) : "Nenhuma"}
            nota={
              consulta
                ? consulta.titulo + (consulta.descricao ? ` · ${consulta.descricao}` : "")
                : "Nenhuma consulta marcada"
            }
            acao={consulta ? "Abrir na agenda" : "Agendar consulta"}
          />
        </div>
      )}
    </section>
  );
}
