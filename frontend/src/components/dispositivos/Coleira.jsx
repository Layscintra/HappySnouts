// Dados simulados: ainda não há integração com a coleira física.

import { useEffect, useMemo, useRef, useState } from "react";
import { urlImagem } from "../../lib/api.js";
import { entre, kmDoTrajeto, metrosEntre } from "../../lib/mapas.js";
import { MapaGoogle, Linha, Marcador, ProvedorMapas, ZonaSegura, enquadrar, useMap } from "./MapaGoogle.jsx";
import {
  Icone,
  Seletor,
  CardAparelho,
  Selos,
  Relatorio,
  DIAS,
  diaDaSemana,
  hoje,
  hm,
  km,
  decimal,
  quando,
  relogio
} from "./comum.jsx";
import { AO_VIVO, BAIRRO, CASA, MATINAL, RAIO_ZONA, RAPIDA, TARDE } from "./trajetosColeira.js";

const dentroDaZona = p => metrosEntre(p, CASA) <= RAIO_ZONA;
const ROTA_TAMANHO = AO_VIVO.length;

function dadosDoPet(pet) {
  const semente = Number(pet?.id_pet) || 0;
  const idade = pet?.idade_pet != null && pet.idade_pet !== "" ? Number(pet.idade_pet) : null;
  return {
    nome: pet?.nome_pet || "Zoe",
    raca: pet?.raca || "Vira-lata",
    idade: idade == null ? "" : idade === 1 ? "1 ano" : `${idade} anos`,
    foto: pet?.foto_url ? urlImagem(pet.foto_url) : "",
    coleira: pet?.id_coleira ? String(pet.id_coleira).padStart(8, "0") : String(24673914 + semente * 7919).slice(-8),
    bateria: pet ? 35 + ((semente * 37) % 61) : 75,
    // ponto do passeio ao vivo onde o pet está agora (0 é a porta de casa)
    inicial: pet ? 1 + ((semente * 5 + 2) % (ROTA_TAMANHO - 1)) : 3,
    fator: pet ? 0.7 + ((semente * 13) % 7) / 10 : 1
  };
}

const SEMANA = {
  ativo: [102, 130, 106, 86, 148, 166, 122],
  km: [3.1, 3.8, 3.2, 2.4, 4.2, 4.9, 3.6],
  kcal: [310, 380, 320, 250, 420, 470, 360]
};

function passeiosDeHoje(fator = 1) {
  return [
    { titulo: "Caminhada matinal", inicio: hoje(7, 10), min: 15, pts: MATINAL, saiu: [7, 13], voltou: [7, 22] },
    { titulo: "Volta rápida", inicio: hoje(12, 30), min: 8, pts: RAPIDA },
    { titulo: "Caminhada da tarde", inicio: hoje(16, 10), min: 22, pts: TARDE, saiu: [16, 16], voltou: [16, 29] }
  ]
    .map(p => ({ ...p, min: Math.max(5, Math.round(p.min * fator)) }))
    .filter(p => p.inicio <= new Date());
}

function PinoPet({ alvo, duracao, nome }) {
  const [pos, setPos] = useState(alvo);
  const atual = useRef(alvo);

  useEffect(() => {
    if (!duracao) {
      atual.current = alvo;
      setPos(alvo);
      return;
    }
    const de = atual.current;
    const t0 = performance.now();
    let quadro;
    const animar = agora => {
      const t = Math.min(1, (agora - t0) / duracao);
      const suave = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      atual.current = entre(de, alvo, suave);
      setPos(atual.current);
      if (t < 1) quadro = requestAnimationFrame(animar);
    };
    quadro = requestAnimationFrame(animar);
    return () => cancelAnimationFrame(quadro);
  }, [alvo, duracao]);

  return (
    <Marcador posicao={pos} zIndex={10} titulo={nome}>
      <div className="dv-pino" id="pino">
        <Pino nome={nome} />
      </div>
    </Marcador>
  );
}

const MarcadorCasa = () => (
  <Marcador posicao={CASA} zIndex={5} titulo="Casa">
    <span className="dv-casa">
      <svg className="dv-i" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
      </svg>
    </span>
  </Marcador>
);

function Pino({ nome }) {
  return (
    <>
      <span className="dv-pino__pulso" />
      <span className="dv-pino__pulso" />
      <span className="dv-pino__nome">{nome}</span>
      <span className="dv-pino__marca">
        <svg viewBox="0 0 48 58">
          <path d="M24 57C24 57 46 36 46 22A22 22 0 0 0 2 22C2 36 24 57 24 57Z" fill="#1E4A3A" />
          <circle cx="24" cy="22" r="15" fill="#FF7A00" />
          <g fill="#fff">
            <ellipse cx="24" cy="27" rx="5.5" ry="4.5" />
            <ellipse cx="17.5" cy="20" rx="2.2" ry="2.8" />
            <ellipse cx="22" cy="15.5" rx="2.2" ry="2.8" />
            <ellipse cx="26.5" cy="15.5" rx="2.2" ry="2.8" />
            <ellipse cx="31" cy="20" rx="2.2" ry="2.8" />
          </g>
        </svg>
      </span>
    </>
  );
}

export default function Coleira(props) {
  return (
    <ProvedorMapas>
      <Rastreador {...props} />
    </ProvedorMapas>
  );
}

function Rastreador({ visivel, pet, seletorPets }) {
  const PET = useMemo(() => dadosDoPet(pet), [pet]);
  const INICIAL = PET.inicial;
  const semana = useMemo(
    () => ({
      ativo: SEMANA.ativo.map(v => Math.round(v * PET.fator)),
      km: SEMANA.km.map(v => v * PET.fator),
      kcal: SEMANA.kcal.map(v => Math.round(v * PET.fator))
    }),
    [PET]
  );
  const passeios = useMemo(() => passeiosDeHoje(PET.fator), [PET]);
  const brincadeira = useMemo(
    () =>
      [
        [8, 5],
        [14, 7],
        [20, 8]
      ].filter(([h]) => h <= new Date().getHours()),
    []
  );
  const inicioAoVivo = useMemo(() => new Date(Date.now() - 6 * 60000), []);

  const [sim, setSim] = useState({
    indice: INICIAL,
    trilha: AO_VIVO.slice(1, INICIAL + 1),
    ultima: Date.now(),
    duracao: 0,
    eventos: []
  });
  const [, setRelogio] = useState(0); // redesenha a cada segundo ("há 3 s")
  const [seguindo, setSeguindo] = useState(true);
  const [aba, setAba] = useState(0);
  const [rotaEscolhida, setRotaEscolhida] = useState(null);
  const [endereco, setEndereco] = useState(AO_VIVO[INICIAL].rua);
  const [trocandoEndereco, setTrocandoEndereco] = useState(false);
  const mapaVivo = useMap("mapaAoVivo");
  const mapaRotas = useMap("mapaRotas");

  useEffect(() => {
    const passo = setInterval(
      () =>
        setSim(s => {
          const estavaDentro = dentroDaZona(AO_VIVO[s.indice]);
          const indice = (s.indice + 1) % AO_VIVO.length;
          const trilha = indice === 0 ? [] : [...s.trilha, AO_VIVO[indice]];
          const dentro = dentroDaZona(AO_VIVO[indice]);
          let eventos = s.eventos;
          if (dentro !== estavaDentro) {
            // a simulação dá uma volta por minuto: guarda só a última saída/entrada
            eventos = [...eventos, { hora: new Date(), saiu: !dentro }].slice(-2);
          }
          return { indice, trilha, ultima: Date.now(), duracao: 2400, eventos };
        }),
      4000
    );
    const segundo = setInterval(() => setRelogio(n => n + 1), 1000);
    return () => {
      clearInterval(passo);
      clearInterval(segundo);
    };
  }, []);

  const posicao = AO_VIVO[sim.indice];
  const dentro = dentroDaZona(posicao);

  // câmera acompanha o pet (a não ser que a pessoa tenha arrastado o mapa)
  useEffect(() => {
    if (seguindo) mapaVivo?.panTo(posicao);
  }, [sim.indice, mapaVivo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const novo = AO_VIVO[sim.indice].rua;
    if (novo === endereco) return;
    setTrocandoEndereco(true);
    const t = setTimeout(
      () => {
        setEndereco(novo);
        setTrocandoEndereco(false);
      },
      sim.duracao ? 220 : 0
    );
    return () => clearTimeout(t);
  }, [sim.indice]); // eslint-disable-line react-hooks/exhaustive-deps

  const pontosAoVivo = [AO_VIVO[0], ...sim.trilha];
  const distAoVivo = kmDoTrajeto(pontosAoVivo);
  const aoVivo = {
    titulo: "Passeio agora",
    inicio: inicioAoVivo,
    min: Math.max(1, Math.round(distAoVivo / 0.07)),
    pts: pontosAoVivo,
    vivo: true
  };
  const todos = [...passeios, aoVivo];
  const minutosAtivos = todos.reduce((s, p) => s + p.min, 0) + brincadeira.reduce((s, [, m]) => s + m, 0);
  const kmHoje = todos.reduce((s, p) => s + kmDoTrajeto(p.pts), 0);
  const kcalHoje = Math.round(minutosAtivos * 2.1 + kmHoje * 30);
  const segundos = Math.round((Date.now() - sim.ultima) / 1000);
  const desdeUltima =
    segundos < 5 ? "agora mesmo" : segundos < 60 ? `há ${segundos} s` : `há ${Math.floor(segundos / 60)} min`;

  function eventos() {
    const raio = `Raio de ${RAIO_ZONA} m em volta de casa`;
    const zona = (hora, saiu, novo) => ({
      chave: `zona-${hora.getTime()}-${saiu}`,
      t: hora,
      icone: saiu ? "exit" : "shield",
      cor: saiu ? "red" : "green",
      titulo: saiu ? "Saiu da Zona Segura" : "Entrou na Zona Segura",
      sub: raio,
      hora: quando(hora),
      novo
    });
    return [
      ...todos.map(p => ({
        chave: `passeio-${p.inicio.getTime()}`,
        t: p.inicio,
        icone: "walk",
        cor: "orange",
        titulo: p.vivo ? "Passeio em andamento" : p.titulo,
        sub: `${hm(p.min)} • ${km(kmDoTrajeto(p.pts))}`,
        hora: quando(p.inicio)
      })),
      ...passeios.flatMap(p => (p.saiu ? [zona(hoje(...p.saiu), true), zona(hoje(...p.voltou), false)] : [])),
      ...sim.eventos.map(e => zona(e.hora, e.saiu, true))
    ]
      .sort((a, b) => b.t - a.t)
      .slice(0, 6);
  }

  const dadosRelatorio = faixa => {
    const semanal = faixa === 1;
    const d = diaDaSemana();
    let rotulos, valores, destaque, ativo, dist, kcal;
    if (semanal) {
      rotulos = DIAS;
      valores = DIAS.map((_, i) => (i < d ? semana.ativo[i] : i === d ? minutosAtivos : 0));
      destaque = d;
      ativo = valores.reduce((s, v) => s + v, 0);
      dist = semana.km.slice(0, d).reduce((s, v) => s + v, 0) + kmHoje;
      kcal = semana.kcal.slice(0, d).reduce((s, v) => s + v, 0) + kcalHoje;
    } else {
      const horas = [6, 8, 10, 12, 14, 16, 18, 20, 22];
      const balde = h => Math.min(Math.max(Math.floor((h - 6) / 2), 0), horas.length - 1);
      valores = horas.map(() => 0);
      todos.forEach(p => {
        valores[balde(p.inicio.getHours())] += p.min;
      });
      brincadeira.forEach(([h, m]) => {
        valores[balde(h)] += m;
      });
      rotulos = horas.map(h => `${h}h`);
      destaque = balde(new Date().getHours());
      ativo = minutosAtivos;
      dist = kmHoje;
      kcal = kcalHoje;
    }
    const dias = semanal ? d + 1 : 1;
    return {
      titulo: semanal ? "Resumo da semana" : "Resumo de hoje",
      sub: `Atualizado ${desdeUltima === "agora mesmo" ? "agora" : desdeUltima}`,
      metricas: [
        {
          icone: "walk",
          cor: "orange",
          rotulo: "Tempo Ativo",
          valor: hm(ativo),
          nota: semanal ? `média ${hm(ativo / dias)}/dia` : "meta 2h por dia"
        },
        {
          icone: "route",
          cor: "blue",
          rotulo: "Distância",
          valor: km(dist),
          nota: semanal ? `média ${km(dist / dias)}/dia` : `${todos.length} passeios hoje`
        },
        {
          icone: "fire",
          cor: "red",
          rotulo: "Calorias",
          valor: `${kcal} kcal`,
          nota: semanal ? `média ${Math.round(kcal / dias)} kcal/dia` : "meta 400 kcal"
        }
      ],
      grafico: {
        titulo: "Minutos ativos",
        sub: semanal ? "Por dia da semana" : "Por horário do dia",
        rotulos,
        valores,
        unidade: " min",
        destaque
      },
      eventos: {
        titulo: "Eventos recentes",
        sub: "Passeios e Zona Segura",
        itens: eventos(),
        vazio: "Nenhum evento hoje."
      }
    };
  };

  const indiceRota = rotaEscolhida === null || rotaEscolhida >= todos.length ? todos.length - 1 : rotaEscolhida;
  const escolhida = todos[indiceRota];

  // ao abrir uma aba (ou mostrar o painel), ajusta a câmera do mapa dela
  // (espera um instante: o mapa só tem tamanho depois que a aba aparece)
  useEffect(() => {
    if (!visivel) return;
    if (aba === 0) {
      const timer = setTimeout(() => mapaVivo?.setCenter(posicao), 80);
      return () => clearTimeout(timer);
    }
    if (aba === 2) return enquadrar(mapaRotas, escolhida.pts);
  }, [aba, visivel, mapaVivo, mapaRotas]); // eslint-disable-line react-hooks/exhaustive-deps

  const escolherRota = i => {
    setRotaEscolhida(i);
    enquadrar(mapaRotas, todos[i].pts);
  };

  const [ini, fim] = [escolhida.pts[0], escolhida.pts[escolhida.pts.length - 1]];

  return (
    <>
      <div className="dv-lateral">
        {seletorPets}
        <CardAparelho
          foto={
            <div className="dv-device__foto dv-device__foto--pet">
              <span>{PET.foto ? <img src={PET.foto} alt="" /> : <Icone id="gps" />}</span>
            </div>
          }
          nome={PET.nome}
          sub={PET.idade ? `${PET.raca} • ${PET.idade}` : PET.raca}
          selos={<Selos online bateria={PET.bateria} />}
          linhas={[
            { icone: "qr", rotulo: "Coleira nº", valor: PET.coleira },
            { icone: "sync", rotulo: "Última atualização", valor: desdeUltima, id: "coleiraAtualizada" },
            { icone: "target", rotulo: "Precisão do GPS", valor: "±3 m" }
          ]}
        >
          <button
            type="button"
            className="dv-btn dv-btn--primary dv-btn--big"
            id="verRotas"
            onClick={() => {
              setRotaEscolhida(null);
              setAba(2);
            }}
          >
            <Icone id="route" /> Ver rotas de hoje
          </button>
        </CardAparelho>
      </div>

      <div className="dv-coluna">
        <Seletor
          opcoes={[
            { texto: "Tempo Real", icone: "gps" },
            { texto: "Relatórios & Saúde", icone: "chart" },
            { texto: "Rotas", icone: "route" }
          ]}
          ativo={aba}
          aoMudar={setAba}
          rotulo="Seções do rastreador"
        />

        <div className="dv-aba" hidden={aba !== 0}>
          <MapaGoogle
            id="mapaAoVivo"
            centro={AO_VIVO[INICIAL]}
            aoArrastar={() => setSeguindo(false)}
            noMapa={
              <>
                <ZonaSegura centro={CASA} raio={RAIO_ZONA} />
                <Linha caminho={pontosAoVivo} cor="#FFFFFF" largura={10} opacidade={0.9} zIndex={2} />
                <Linha caminho={pontosAoVivo} cor="#1E4A3A" largura={5} opacidade={0.7} zIndex={3} />
                <MarcadorCasa />
                <PinoPet alvo={posicao} duracao={sim.duracao} nome={PET.nome} />
              </>
            }
          >
            <div className={"dv-mapa__chip" + (dentro ? "" : " is-fora")} id="chipZona">
              <Icone id={dentro ? "shield" : "exit"} />
              <span>{dentro ? "Dentro da Zona Segura" : "Fora da Zona Segura"}</span>
            </div>
            <div className="dv-endereco">
              <span className="dv-chip dv-chip--orange" style={{ margin: 0 }}>
                <Icone id="gps" />
              </span>
              <div className={"dv-endereco__texto" + (trocandoEndereco ? " is-trocando" : "")} id="endereco">
                <p className="dv-endereco__rua">{endereco}</p>
                <p className="dv-endereco__bairro">{BAIRRO}</p>
              </div>
              <button
                type="button"
                className={"dv-centralizar" + (seguindo ? " is-seguindo" : "")}
                id="centralizar"
                aria-label={`Centralizar na ${PET.nome}`}
                title={`Centralizar na ${PET.nome}`}
                onClick={() => {
                  setSeguindo(true);
                  mapaVivo?.panTo(posicao);
                }}
              >
                <Icone id="target" />
              </button>
            </div>
          </MapaGoogle>
          <div className="dv-mini">
            <div className="dv-card">
              <span className="dv-chip dv-chip--orange">
                <Icone id="walk" />
              </span>
              <div>
                <p className="dv-mini__valor" id="miniVel">{`${decimal(distAoVivo / (aoVivo.min / 60))} km/h`}</p>
                <p className="dv-mini__rotulo">Velocidade média</p>
              </div>
            </div>
            <div className="dv-card">
              <span className="dv-chip dv-chip--blue">
                <Icone id="route" />
              </span>
              <div>
                <p className="dv-mini__valor" id="miniDist">
                  {km(distAoVivo)}
                </p>
                <p className="dv-mini__rotulo">Neste passeio</p>
              </div>
            </div>
            <div className="dv-card">
              <span className="dv-chip dv-chip--navy">
                <Icone id="clock" />
              </span>
              <div>
                <p className="dv-mini__valor" id="miniTempo">
                  {hm(aoVivo.min)}
                </p>
                <p className="dv-mini__rotulo">Duração</p>
              </div>
            </div>
          </div>
        </div>

        <div className="dv-aba" hidden={aba !== 1}>
          <Relatorio dados={dadosRelatorio} />
        </div>

        <div className="dv-aba" hidden={aba !== 2}>
          <MapaGoogle
            id="mapaRotas"
            style={{ height: "360px" }}
            centro={CASA}
            zoom={16}
            noMapa={
              <>
                <ZonaSegura centro={CASA} raio={RAIO_ZONA} />
                {todos.map((p, i) =>
                  i === indiceRota ? null : (
                    <Linha key={i} caminho={p.pts} cor="#1E4A3A" largura={4} opacidade={0.45} tracejada zIndex={1} />
                  )
                )}
                <Linha caminho={escolhida.pts} cor="#FFFFFF" largura={11} opacidade={0.9} zIndex={2} />
                <Linha caminho={escolhida.pts} cor="#FF7A00" largura={6} zIndex={3} />
                <MarcadorCasa />
                <Marcador posicao={ini} zIndex={6} titulo="Início">
                  <span className="dv-ponto" style={{ background: "#12B76A" }} />
                </Marcador>
                <Marcador posicao={fim} zIndex={7} titulo="Fim">
                  <span className="dv-ponto" style={{ background: "#FF7A00" }} />
                </Marcador>
              </>
            }
          />
          <article className="dv-card">
            <div className="dv-titulo">
              <div>
                <h3>Rotas de hoje</h3>
                <p>Clique num passeio para ver o trajeto no mapa</p>
              </div>
            </div>
            <ul className="dv-lista dv-lista--rotas" id="listaRotas">
              {todos.map((p, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className={"dv-rota" + (i === indiceRota ? " is-ativa" : "")}
                    aria-pressed={i === indiceRota}
                    onClick={() => escolherRota(i)}
                  >
                    <span className={`dv-chip dv-chip--${i === indiceRota ? "orange" : "navy"}`} style={{ margin: 0 }}>
                      <Icone id="walk" />
                    </span>
                    <span className="dv-item__texto">
                      <span className="dv-item__titulo" style={{ display: "block" }}>
                        {p.titulo}
                      </span>
                      <span
                        className="dv-item__sub"
                        style={{ display: "block" }}
                      >{`${hm(p.min)} • ${km(kmDoTrajeto(p.pts))} • ${decimal(kmDoTrajeto(p.pts) / (p.min / 60))} km/h`}</span>
                    </span>
                    {p.vivo ? (
                      <span className="dv-ao-vivo">Ao vivo</span>
                    ) : (
                      <span className="dv-item__hora">{relogio(p.inicio)}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </>
  );
}
