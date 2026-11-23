import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import AvatarPet from "../../components/AvatarPet.jsx";
import Icone from "../../components/Icone.jsx";
import Footer from "../../components/layout/Footer.jsx";
import Header from "../../components/layout/Header.jsx";
import { chaveDia, dataBr, formatarPeso, buscarPesos, linkAgenda } from "../../lib/agenda.js";
import { ENDPOINTS, clienteLogado, avisar, pedir, semServidor } from "../../lib/api.js";
import { confirmar } from "../../lib/ui.js";

const petDaUrl = () => new URLSearchParams(location.search).get("pet");
const variacao = dif => (dif === 0 ? "sem mudança" : `${dif > 0 ? "+" : "−"}${formatarPeso(Math.abs(dif))}`);

function Grafico({ pesos }) {
  const L = 640,
    A = 220,
    M = { e: 46, d: 16, t: 18, b: 34 };
  if (pesos.length < 2) {
    return <p className="cal-vazio">Registre mais uma pesagem para ver a evolução no gráfico.</p>;
  }
  const valores = pesos.map(p => p.peso);
  let min = Math.min(...valores),
    max = Math.max(...valores);
  const folga = Math.max((max - min) * 0.2, 0.2);
  min = Math.max(0, min - folga);
  max += folga;
  const t0 = pesos[0].quando.getTime(),
    t1 = pesos[pesos.length - 1].quando.getTime();
  const x = p => M.e + (t1 === t0 ? 0.5 : (p.quando.getTime() - t0) / (t1 - t0)) * (L - M.e - M.d);
  const y = v => M.t + (1 - (v - min) / (max - min)) * (A - M.t - M.b);
  const pontos = pesos.map(p => [x(p), y(p.peso)]);
  const linha = pontos.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join(" ");
  const area = `${linha} L${pontos.at(-1)[0].toFixed(1)} ${A - M.b} L${pontos[0][0].toFixed(1)} ${A - M.b} Z`;
  const marcas = [min, (min + max) / 2, max];
  const passo = Math.max(1, Math.ceil(pesos.length / 5));
  const rotulos = pesos.filter((_, i) => i % passo === 0 || i === pesos.length - 1);

  return (
    <svg
      className="peso-grafico"
      viewBox={`0 0 ${L} ${A}`}
      role="img"
      aria-label={`Peso de ${formatarPeso(valores[0])} para ${formatarPeso(valores.at(-1))}`}
    >
      {marcas.map(v => (
        <g key={v}>
          <line x1={M.e} x2={L - M.d} y1={y(v)} y2={y(v)} className="peso-grafico__grade" />
          <text x={M.e - 8} y={y(v) + 4} textAnchor="end" className="peso-grafico__eixo">
            {v.toFixed(1).replace(".", ",")}
          </text>
        </g>
      ))}
      <path d={area} className="peso-grafico__area" />
      <path d={linha} className="peso-grafico__linha" />
      {pontos.map(([px, py], i) => (
        <circle
          key={pesos[i].id}
          cx={px}
          cy={py}
          r={i === pontos.length - 1 ? 6 : 4.5}
          className={"peso-grafico__ponto" + (i === pontos.length - 1 ? " is-ultimo" : "")}
        >
          <title>{`${dataBr(pesos[i].quando)}: ${formatarPeso(pesos[i].peso)}`}</title>
        </circle>
      ))}
      {rotulos.map(p => (
        <text key={p.id} x={x(p)} y={A - 10} textAnchor="middle" className="peso-grafico__eixo">
          {p.quando.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
        </text>
      ))}
    </svg>
  );
}

export default function HistoricoPeso() {
  const logado = clienteLogado();
  const [pets, setPets] = useState(null);
  const [petId, setPetId] = useState(petDaUrl);
  const [pesos, setPesos] = useState(undefined); // undefined = carregando | null = backend sem histórico
  const [erro, setErro] = useState("");
  const [form, setForm] = useState({ peso: "", data: chaveDia(new Date()) });
  const [erroForm, setErroForm] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!logado) return; // a navegação já mostra o aviso de login
    pedir(ENDPOINTS.pets, {}, "Não foi possível carregar seus pets.")
      .then(setPets)
      .catch(err => {
        setPets([]);
        setErro(semServidor(err));
      });
  }, [logado]);

  const pet = useMemo(
    () => (pets?.length ? pets.find(p => String(p.id_pet) === String(petId)) || pets[0] : null),
    [pets, petId]
  );

  const carregar = useCallback(async () => {
    if (!pet) return;
    try {
      setPesos(await buscarPesos(pet.id_pet));
      setErro("");
    } catch (err) {
      setErro(semServidor(err));
      setPesos(null);
    }
  }, [pet]);

  useEffect(() => {
    setPesos(undefined);
    carregar();
  }, [carregar]);

  const escolher = id => {
    setPetId(String(id));
    history.replaceState(history.state, "", `?pet=${id}`);
  };

  const registrar = async e => {
    e.preventDefault();
    const peso = Number(String(form.peso).replace(",", "."));
    if (!(peso > 0) || peso > 200) return setErroForm("Informe o peso em kg, maior que 0 (ex.: 4,1).");
    if (!form.data) return setErroForm("Escolha a data da pesagem.");
    if (form.data > chaveDia(new Date())) return setErroForm("A data não pode ser no futuro.");
    setErroForm("");
    setSalvando(true);
    try {
      await pedir(
        `${ENDPOINTS.pets}/${pet.id_pet}/pesos`,
        {
          method: "POST",
          body: JSON.stringify({ peso, data_registro: form.data === chaveDia(new Date()) ? undefined : form.data })
        },
        "Não foi possível registrar a pesagem."
      );
      setForm({ peso: "", data: chaveDia(new Date()) });
      avisar(`Pesagem de ${formatarPeso(peso)} registrada! 🐾`);
      await carregar();
    } catch (err) {
      setErroForm(semServidor(err));
    } finally {
      setSalvando(false);
    }
  };

  const apagar = async p => {
    const ok = await confirmar({
      titulo: "Apagar esta pesagem?",
      mensagem: `${formatarPeso(p.peso)} do dia ${dataBr(p.quando)} sai do histórico e do gráfico.`,
      botao: "Apagar",
      tipo: "perigo"
    });
    if (!ok) return;
    try {
      await pedir(
        `${ENDPOINTS.pets}/${pet.id_pet}/pesos/${p.id}`,
        { method: "DELETE" },
        "Não foi possível apagar a pesagem."
      );
      avisar("Pesagem apagada");
      await carregar();
    } catch (err) {
      avisar(semServidor(err), "erro");
    }
  };

  const lista = pesos || [];
  const ultimo = lista.at(-1);
  const primeiro = lista[0];
  const pesoAtual = ultimo ? ultimo.peso : pet?.peso_atual != null ? Number(pet.peso_atual) : null;
  const semHistorico = pesos === null && !erro;

  return (
    <>
      <PesoIcones />
      <Header atual="controle" />

      <main className="cal hs-container">
        <Link className="peso-voltar" to="/controle">
          <Icone id="seta-esq" /> Voltar ao relatório
        </Link>

        <section className="cal-hero cal-hero--baixo">
          <span className="cal-hero__blob" aria-hidden="true" />
          <div className="cal-hero__texto">
            <p className="cal-selo">Saúde do pet</p>
            <h1>
              Histórico de <span>peso</span>
              {pet ? ` de ${pet.nome_pet}` : ""}
            </h1>
            <p>Todas as pesagens desde o cadastro. Quando o peso muda no perfil ou no app, ele também entra aqui.</p>
          </div>
        </section>

        {pets?.length > 1 && (
          <div className="cal-filtro" role="radiogroup" aria-label="Escolha o pet">
            <span className="cal-filtro__rotulo">Pet:</span>
            {pets.map(p => {
              const on = String(p.id_pet) === String(pet?.id_pet);
              return (
                <button
                  key={p.id_pet}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={"cal-chip" + (on ? " on" : "")}
                  onClick={() => escolher(p.id_pet)}
                >
                  <AvatarPet pet={p} tamanho={24} /> {p.nome_pet}
                </button>
              );
            })}
          </div>
        )}

        {pets && !pets.length && !erro && (
          <div className="cal-aviso">
            <span aria-hidden="true">🐶</span>
            <p>
              Você ainda não cadastrou nenhum pet. <Link to="/perfil#pets">Cadastre seu pet no perfil</Link>.
            </p>
          </div>
        )}
        {erro && <p className="cal-aviso cal-aviso--erro">{erro}</p>}
        {semHistorico && (
          <p className="cal-aviso">
            O servidor ainda não tem o histórico de peso (ele precisa ser atualizado). Por enquanto aparece só o peso
            atual do cadastro.
          </p>
        )}

        {pet && (
          <div className="cal-cols">
            <section className="cal-card" aria-labelledby="pesoGraficoTitulo">
              <div className="peso-resumo">
                <div>
                  <p className="peso-rotulo">Peso atual</p>
                  <p className="peso-valor">{pesoAtual != null ? formatarPeso(pesoAtual) : "-"}</p>
                  <p className="cal-sub">
                    {ultimo ? `Última pesagem em ${dataBr(ultimo.quando)}` : "Sem pesagens registradas"}
                  </p>
                </div>
                {primeiro && ultimo && lista.length > 1 && (
                  <div className="peso-variacao">
                    <p className="peso-rotulo">Desde {dataBr(primeiro.quando)}</p>
                    <p
                      className={
                        "peso-valor peso-valor--sm" +
                        (ultimo.peso > primeiro.peso ? " sobe" : ultimo.peso < primeiro.peso ? " desce" : "")
                      }
                    >
                      {variacao(ultimo.peso - primeiro.peso)}
                    </p>
                    <p className="cal-sub">{lista.length} pesagens</p>
                  </div>
                )}
              </div>
              <h2 id="pesoGraficoTitulo" className="peso-subtitulo">
                Evolução
              </h2>
              {pesos === undefined ? <p className="cal-vazio">Carregando... 🐾</p> : <Grafico pesos={lista} />}
            </section>

            <aside className="cal-lado">
              <section className="cal-card" aria-labelledby="pesoNovoTitulo">
                <h2 id="pesoNovoTitulo">Registrar pesagem</h2>
                <p className="cal-sub">Pesou {pet.nome_pet} hoje ou no veterinário? Anote aqui.</p>
                <form className="peso-form" onSubmit={registrar} noValidate>
                  <div className="cal-dupla">
                    <label className="cal-campo">
                      <span>Peso (kg)</span>
                      <input
                        name="peso"
                        inputMode="decimal"
                        placeholder="Ex.: 4,1"
                        value={form.peso}
                        disabled={semHistorico}
                        onChange={e => setForm({ ...form, peso: e.target.value.replace(/[^\d.,]/g, "") })}
                      />
                    </label>
                    <label className="cal-campo">
                      <span>Data</span>
                      <input
                        name="data"
                        type="date"
                        max={chaveDia(new Date())}
                        value={form.data}
                        disabled={semHistorico}
                        onChange={e => setForm({ ...form, data: e.target.value })}
                      />
                    </label>
                  </div>
                  <p className="cal-erro" role="alert">
                    {erroForm}
                  </p>
                  <button type="submit" className="cal-btn cal-btn--laranja" disabled={salvando || semHistorico}>
                    <Icone id="plus" /> {salvando ? "Salvando..." : "Registrar pesagem"}
                  </button>
                </form>
              </section>

              <section className="cal-card" aria-labelledby="pesoListaTitulo">
                <h2 id="pesoListaTitulo">Pesagens</h2>
                {lista.length ? (
                  <ul className="peso-lista">
                    {[...lista].reverse().map((p, i, arr) => {
                      const ant = arr[i + 1];
                      return (
                        <li key={p.id}>
                          <span className="peso-lista__data">{dataBr(p.quando)}</span>
                          <b>{formatarPeso(p.peso)}</b>
                          <small>{ant ? variacao(p.peso - ant.peso) : "primeiro registro"}</small>
                          <button
                            type="button"
                            className="peso-apagar"
                            aria-label={`Apagar pesagem de ${dataBr(p.quando)}`}
                            onClick={() => apagar(p)}
                          >
                            <Icone id="x" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="cal-vazio">{pesos === undefined ? "Carregando..." : "Nenhuma pesagem ainda."}</p>
                )}
                <Link className="cal-link peso-agenda" to={linkAgenda({ pet: pet.id_pet, novo: "consulta" })}>
                  Agendar uma consulta para {pet.nome_pet}
                </Link>
              </section>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}

function PesoIcones() {
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
      <symbol id="x" viewBox="0 0 24 24">
        <path d="M6 6l12 12M18 6 6 18" />
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
