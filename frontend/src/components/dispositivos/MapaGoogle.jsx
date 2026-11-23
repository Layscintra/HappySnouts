import { useEffect, useRef } from "react";
import {
  APIProvider,
  AdvancedMarker,
  AdvancedMarkerAnchorPoint,
  APILoadingStatus,
  ControlPosition,
  Map,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary
} from "@vis.gl/react-google-maps";
import { CHAVE_MAPS, MAP_ID } from "../../lib/mapas.js";

export function ProvedorMapas({ children }) {
  return (
    <APIProvider apiKey={CHAVE_MAPS} language="pt-BR" region="BR">
      {children}
    </APIProvider>
  );
}

function AvisoMapa({ texto }) {
  return (
    <div className="dv-mapa__aviso" role="status">
      <p>{texto}</p>
    </div>
  );
}

// noMapa: linhas e marcadores (andam com o mapa) | children: chips e cartões por cima
export function MapaGoogle({ id, centro, zoom = 17, aoArrastar, noMapa, children, ...props }) {
  const status = useApiLoadingStatus();
  const falhou = status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE;

  return (
    <div className="dv-mapa" {...props}>
      {!CHAVE_MAPS ? (
        <AvisoMapa texto="Mapa indisponível: falta a chave do Google Maps (VITE_GOOGLE_MAPS_KEY no arquivo frontend/.env)." />
      ) : falhou ? (
        <AvisoMapa texto="Não foi possível carregar o Google Maps. Confira a chave e a conexão com a internet." />
      ) : (
        <Map
          id={id}
          mapId={MAP_ID}
          defaultCenter={centro}
          defaultZoom={zoom}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
          zoomControlOptions={{ position: ControlPosition.RIGHT_TOP }}
          clickableIcons={false}
          onDragstart={aoArrastar}
          style={{ width: "100%", height: "100%" }}
        >
          {noMapa}
        </Map>
      )}
      {children}
    </div>
  );
}

function useObjetoNoMapa(criar, opcoes) {
  const map = useMap();
  const maps = useMapsLibrary("maps");
  const obj = useRef(null);

  useEffect(() => {
    if (!map || !maps) return;
    const o = criar(maps);
    o.setMap(map);
    obj.current = o;
    return () => {
      o.setMap(null);
      obj.current = null;
    };
  }, [map, maps]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    obj.current?.setOptions(opcoes);
  });
}

export function Linha({ caminho, cor, largura = 5, opacidade = 1, tracejada = false, zIndex = 1 }) {
  useObjetoNoMapa(maps => new maps.Polyline({ clickable: false }), {
    path: caminho,
    strokeColor: cor,
    strokeWeight: largura,
    strokeOpacity: tracejada ? 0 : opacidade,
    icons: tracejada
      ? [
          {
            icon: { path: "M 0,-1 0,1", strokeOpacity: opacidade, strokeColor: cor, scale: largura / 1.6 },
            offset: "0",
            repeat: "12px"
          }
        ]
      : null,
    zIndex
  });
  return null;
}

// Círculo da Zona Segura (raio em metros)
export function ZonaSegura({ centro, raio }) {
  useObjetoNoMapa(maps => new maps.Circle({ clickable: false }), {
    center: centro,
    radius: raio,
    fillColor: "#12B76A",
    fillOpacity: 0.1,
    strokeColor: "#12B76A",
    strokeOpacity: 0.9,
    strokeWeight: 2.5,
    zIndex: 0
  });
  return null;
}

export function Marcador({ posicao, zIndex, titulo, children }) {
  return (
    <AdvancedMarker position={posicao} anchorPoint={AdvancedMarkerAnchorPoint.CENTER} zIndex={zIndex} title={titulo}>
      {children}
    </AdvancedMarker>
  );
}

const ZOOM_MAXIMO_ENQUADRAR = 17;

// Enquadra uma lista de pontos { lat, lng } no mapa.
// Mapa que estava numa aba escondida ainda não tem tamanho: espera ele aparecer
// (o Google percebe o novo tamanho um instante depois) antes de enquadrar.
export function enquadrar(map, pontos, margem = 56) {
  if (!map || !pontos.length || !window.google?.maps) return () => {};
  let timer;
  const aplicar = (tentativas = 20) => {
    const div = map.getDiv();
    if ((!div.offsetWidth || !div.offsetHeight) && tentativas > 0) {
      timer = setTimeout(() => aplicar(tentativas - 1), 50);
      return;
    }
    const caixa = new window.google.maps.LatLngBounds();
    pontos.forEach(p => caixa.extend(p));
    // trajeto curto (passeio que acabou de começar) não pode virar um zoom de quarteirão
    window.google.maps.event.addListenerOnce(map, "idle", () => {
      if (map.getZoom() > ZOOM_MAXIMO_ENQUADRAR) map.setZoom(ZOOM_MAXIMO_ENQUADRAR);
    });
    map.fitBounds(caixa, margem);
  };
  timer = setTimeout(aplicar, 80);
  return () => clearTimeout(timer);
}

export { useMap };
