// O código fica salvo no pet (id_coleira / id_alimentador); null desconecta.

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ENDPOINTS, pedir } from "../../lib/api.js";
import { confirmar } from "../../lib/ui.js";
import AvatarPet from "../AvatarPet.jsx";
import { Icone } from "./comum.jsx";

export const NOME_APARELHO = { coleira: "Coleira rastreadora", comedouro: "Alimentador automático" };
const CAMPO = { coleira: "id_coleira", comedouro: "id_alimentador" };

export const aparelhosDe = (pets = []) =>
  pets.flatMap(pet => [
    ...(pet.id_coleira ? [{ pet, tipo: "coleira", codigo: String(pet.id_coleira) }] : []),
    ...(pet.id_alimentador ? [{ pet, tipo: "comedouro", codigo: String(pet.id_alimentador) }] : [])
  ]);

const salvarAparelho = (pet, tipo, codigo, msg) =>
  pedir(
    `${ENDPOINTS.pets}/${pet.id_pet}`,
    { method: "PUT", body: JSON.stringify({ nome_pet: pet.nome_pet, raca: pet.raca, [CAMPO[tipo]]: codigo }) },
    msg
  );

export function ListaAparelhos({ pets, aoAbrir, aoConectar, aoMudou, aviso }) {
  const aparelhos = aparelhosDe(pets);
  const [ocupado, setOcupado] = useState("");

  const desconectar = async ap => {
    const qual = ap.tipo === "coleira" ? "a coleira GPS" : "o alimentador automático";
    const ok = await confirmar({
      titulo: `Desconectar ${qual}?`,
      mensagem: `O aparelho (código ${ap.codigo}) deixa de enviar dados de ${ap.pet.nome_pet}. Você pode conectar de novo depois com o mesmo código.`,
      botao: "Desconectar",
      tipo: "aviso"
    });
    if (!ok) return;
    setOcupado(`${ap.tipo}-${ap.pet.id_pet}`);
    try {
      await salvarAparelho(ap.pet, ap.tipo, null, "Não foi possível desconectar o aparelho.");
      aviso(ap.tipo === "coleira" ? "Coleira desconectada" : "Alimentador desconectado");
      await aoMudou();
    } catch (err) {
      aviso(err.message);
    } finally {
      setOcupado("");
    }
  };

  if (!aparelhos.length) return <SemAparelhos temPet={pets.length > 0} aoConectar={aoConectar} />;

  return (
    <section className="dv-card dv-aparelhos" aria-labelledby="aparelhosTitulo">
      <header className="dv-aparelhos__topo">
        <div>
          <h2 id="aparelhosTitulo">Meus dispositivos</h2>
          <p>Selecione um dispositivo para ver o relatório.</p>
        </div>
        <button type="button" className="dv-btn dv-btn--ghost" onClick={aoConectar}>
          <Icone id="link" /> Conectar outro dispositivo
        </button>
      </header>
      <ul className="dv-aparelhos__lista">
        {aparelhos.map(ap => {
          const chave = `${ap.tipo}-${ap.pet.id_pet}`;
          return (
            <li key={chave} className="dv-aparelho">
              <button type="button" className="dv-aparelho__abrir" onClick={() => aoAbrir(ap)}>
                <span className={`dv-aparelho__icone dv-aparelho__icone--${ap.tipo}`} aria-hidden="true">
                  <Icone id={ap.tipo === "coleira" ? "gps" : "bowl"} />
                </span>
                <span className="dv-aparelho__texto">
                  <strong>{NOME_APARELHO[ap.tipo]}</strong>
                  <span>
                    <AvatarPet pet={ap.pet} tamanho={20} className="dv-aparelho__av" />
                    {ap.pet.nome_pet} • código {ap.codigo}
                  </span>
                </span>
                <span className="dv-aparelho__ver">
                  Ver relatório
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </span>
              </button>
              <button
                type="button"
                className="dv-aparelho__desconectar"
                onClick={() => desconectar(ap)}
                disabled={ocupado === chave}
                aria-label={`Desconectar ${NOME_APARELHO[ap.tipo].toLowerCase()} de ${ap.pet.nome_pet}`}
                title="Desconectar"
              >
                <Icone id="unlink" />
                <span>{ocupado === chave ? "Desconectando..." : "Desconectar"}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SemAparelhos({ temPet, aoConectar }) {
  const passos = [
    temPet ? "Ligue o aparelho e deixe-o por perto." : "Cadastre o seu pet.",
    'Clique em "Conectar dispositivo" e escolha se é uma coleira ou um alimentador.',
    "Digite o código que está na etiqueta do aparelho e escolha o pet."
  ];
  return (
    <section className="dv-card dv-sem-aparelho" aria-labelledby="semAparelhoTitulo">
      <span className="dv-sem-aparelho__icone" aria-hidden="true">
        <Icone id="link" />
      </span>
      <h2 id="semAparelhoTitulo">Nenhum dispositivo conectado</h2>
      <p>Conecte a coleira rastreadora ou o alimentador automático ao seu pet para acompanhar tudo por aqui.</p>
      <ol className="dv-passos">
        {passos.map((t, i) => (
          <li key={i}>
            <span aria-hidden="true">{i + 1}</span>
            {t}
          </li>
        ))}
      </ol>
      <div className="dv-sem-aparelho__acoes">
        {temPet ? (
          <button type="button" className="dv-btn dv-btn--primary" onClick={aoConectar}>
            <Icone id="link" /> Conectar dispositivo
          </button>
        ) : (
          <Link className="dv-btn dv-btn--primary" to="/perfil#pets">
            Cadastrar pet
          </Link>
        )}
        <Link className="dv-btn dv-btn--ghost" to="/produtos">
          Ainda não tenho: ver na loja
        </Link>
      </div>
    </section>
  );
}

const PASSOS = {
  coleira: nome => ["Buscando sinal de satélite...", "Sincronizando coleira...", `Localizando ${nome}...`],
  comedouro: () => ["Procurando o alimentador...", "Sincronizando aparelho...", "Quase lá..."]
};

export function ConectarAparelho({ pets, tipoInicial = "coleira", aoVoltar, aoConectado }) {
  const [tipo, setTipo] = useState(tipoInicial);
  const [petId, setPetId] = useState(String(pets[0]?.id_pet ?? ""));
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [conectando, setConectando] = useState(false);
  const campo = useRef(null);
  const pet = pets.find(p => String(p.id_pet) === petId) || pets[0];
  const atual = pet?.[CAMPO[tipo]];

  useEffect(() => {
    campo.current?.focus();
  }, []);

  const validar = v => {
    if (!v) return "Digite o código da etiqueta.";
    if (v.length < 4) return "O código tem pelo menos 4 números.";
    return "";
  };

  // código de demonstração: 8 números, sem zero na frente (igual ao app)
  const gerarTeste = () => {
    const novo =
      String(Math.floor(Math.random() * 9) + 1) +
      Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join("");
    setCodigo(novo);
    setErro("");
  };

  const conectar = async e => {
    e.preventDefault();
    if (conectando) return;
    const problema = validar(codigo);
    if (problema) {
      setErro(problema);
      campo.current?.focus();
      return;
    }
    setErro("");
    setConectando(true);
    try {
      // a animação dura pelo menos ~2,4 s, mesmo que o servidor responda antes (igual ao app)
      await Promise.all([
        salvarAparelho(pet, tipo, Number(codigo), "Não foi possível conectar o aparelho."),
        new Promise(r => setTimeout(r, 2400))
      ]);
      await aoConectado(pet, tipo);
    } catch (err) {
      setConectando(false);
      setErro(err.message);
    }
  };

  return (
    <section className="dv-conectar" aria-labelledby="conectarTitulo">
      <button type="button" className="dv-voltar" onClick={aoVoltar} disabled={conectando}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m15 6-6 6 6 6" />
        </svg>
        Meus dispositivos
      </button>

      <div className="dv-card dv-conectar__topo">
        <Radar />
        <h2 id="conectarTitulo">{tipo === "coleira" ? "Parear coleira GPS" : "Parear alimentador"}</h2>
        <p>Ligue o aparelho, deixe-o por perto e digite o código (número de série) da etiqueta.</p>
      </div>

      <form className="dv-card dv-conectar__form" noValidate onSubmit={conectar}>
        <div className="dv-conectar__tipos" role="radiogroup" aria-label="Tipo de aparelho">
          {[
            ["coleira", "gps", "Coleira GPS"],
            ["comedouro", "bowl", "Alimentador"]
          ].map(([valor, icone, texto]) => (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={tipo === valor}
              className={"dv-tipo" + (tipo === valor ? " on" : "")}
              onClick={() => setTipo(valor)}
              disabled={conectando}
            >
              <Icone id={icone} /> {texto}
            </button>
          ))}
        </div>

        {pets.length > 1 ? (
          <label className="dv-campo">
            <span>Pet</span>
            <select value={petId} onChange={e => setPetId(e.target.value)} disabled={conectando}>
              {pets.map(p => (
                <option key={p.id_pet} value={String(p.id_pet)}>
                  {p.nome_pet}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="dv-conectar__pet">
            <AvatarPet pet={pet} tamanho={32} className="dv-aparelho__av" /> Para <strong>{pet?.nome_pet}</strong>
          </p>
        )}

        <label className="dv-campo">
          <span>Código / número de série</span>
          <input
            ref={campo}
            inputMode="numeric"
            autoComplete="off"
            placeholder="Ex.: 48213097"
            maxLength={9}
            value={codigo}
            disabled={conectando}
            aria-invalid={erro ? "true" : "false"}
            aria-describedby="codigoErro"
            onChange={e => {
              setCodigo(e.target.value.replace(/\D/g, "").slice(0, 9));
              setErro("");
            }}
          />
        </label>
        <div className="dv-conectar__linha">
          <p className="dv-conectar__erro" id="codigoErro" role="alert">
            {erro}
          </p>
          <button type="button" className="dv-link-btn" onClick={gerarTeste} disabled={conectando}>
            Gerar código de teste
          </button>
        </div>

        {atual ? (
          <p className="dv-conectar__aviso">
            {tipo === "coleira"
              ? `${pet.nome_pet} já tem uma coleira conectada (código ${atual}). Ao conectar, ela será substituída.`
              : `${pet.nome_pet} já tem um alimentador conectado (código ${atual}). Ao conectar, ele será substituído.`}
          </p>
        ) : null}

        <button type="submit" className="dv-btn dv-btn--navy dv-btn--big" disabled={conectando}>
          <Icone id="link" /> Conectar dispositivo
        </button>
      </form>

      {conectando && <Pareando passos={PASSOS[tipo](pet?.nome_pet || "seu pet")} />}
    </section>
  );
}

function Radar({ grande = false }) {
  return (
    <span className={"dv-radar" + (grande ? " dv-radar--grande" : "")} aria-hidden="true">
      <span className="dv-radar__onda" />
      <span className="dv-radar__onda dv-radar__onda--2" />
      <span className="dv-radar__centro">
        <Icone id="wifi" />
      </span>
    </span>
  );
}

function Pareando({ passos }) {
  const [passo, setPasso] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPasso(p => Math.min(p + 1, passos.length - 1)), 800);
    return () => clearInterval(t);
  }, [passos.length]);
  return (
    <div className="dv-pareando" role="status" aria-live="polite">
      <div className="dv-pareando__card">
        <Radar grande />
        <p className="dv-pareando__atual">{passos[passo]}</p>
        <ul>
          {passos.map((t, i) => (
            <li key={t} className={i < passo ? "feito" : i === passo ? "atual" : ""}>
              <span aria-hidden="true">{i < passo ? "✓" : ""}</span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
