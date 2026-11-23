import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  buscarProdutos,
  buscarFavoritos,
  adicionarAoCarrinho,
  alternarFavorito,
  formatarPreco,
  avisar
} from "../lib/api.js";

const MAX_CARROSSEL = 10;

const IconeCoracao = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 20s-7-4.4-9.3-8.8C1.2 8 2.7 4.8 6 4.2c2-.4 3.7.5 6 2.9 2.3-2.4 4-3.3 6-2.9 3.3.6 4.8 3.8 3.3 7C19 15.6 12 20 12 20Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);
const IconeCarrinho = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 5h2l1.6 9.6a2 2 0 0 0 2 1.65h6.7a2 2 0 0 0 2-1.55L19.4 8.5H6.2"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="10" cy="19.3" r="1.3" fill="currentColor" />
    <circle cx="16.5" cy="19.3" r="1.3" fill="currentColor" />
  </svg>
);

function Selo({ produto, novo }) {
  const desconto = produto.de ? Math.round(100 - (produto.preco / produto.de) * 100) : 0;
  if (desconto > 0) return <span className="product-card__badge product-card__badge--sale">-{desconto}%</span>;
  if (novo) return <span className="product-card__badge product-card__badge--new">Novo</span>;
  return null;
}

function CartaoProduto({ produto: p, favoritado, novo, aoFavoritar }) {
  const [ocupado, setOcupado] = useState({ add: false, fav: false });
  const [adicionado, setAdicionado] = useState(false);
  const [semImagem, setSemImagem] = useState(false);
  const link = `/produtos?q=${encodeURIComponent(p.nome)}`;

  const executar = async (qual, acao) => {
    setOcupado(o => ({ ...o, [qual]: true }));
    try {
      await acao();
    } catch (err) {
      avisar(err.message, "erro");
    } finally {
      setOcupado(o => ({ ...o, [qual]: false }));
    }
  };

  const adicionar = () =>
    executar("add", async () => {
      if (await adicionarAoCarrinho(p.id)) {
        setAdicionado(true);
        setTimeout(() => setAdicionado(false), 700);
        avisar(`${p.nome} foi para o carrinho!`);
      }
    });

  const favoritar = () =>
    executar("fav", async () => {
      const novoEstado = !favoritado;
      if (await alternarFavorito(p.id, novoEstado)) {
        aoFavoritar(p.id, novoEstado);
        avisar(novoEstado ? "Salvo nos seus favoritos ♥" : "Removido dos favoritos");
      }
    });

  return (
    <li className="product-card" data-id={p.id}>
      <Selo produto={p} novo={novo} />
      <button
        type="button"
        className="product-card__fav"
        aria-pressed={favoritado}
        disabled={ocupado.fav}
        aria-label={`${favoritado ? "Remover dos favoritos" : "Adicionar aos favoritos"}: ${p.nome}`}
        onClick={favoritar}
      >
        <IconeCoracao />
      </button>
      <Link to={link} className="product-card__media" tabIndex={-1} aria-hidden="true">
        {p.imagem && (
          <img
            src={p.imagem}
            alt=""
            loading="lazy"
            style={semImagem ? { visibility: "hidden" } : undefined}
            onError={() => setSemImagem(true)}
          />
        )}
      </Link>
      <div className="product-card__body">
        <h3 className="product-card__name">
          <Link to={link}>{p.nome}</Link>
        </h3>
        {p.categoria && <small className="product-card__cat">{p.categoria}</small>}
        <div className="product-card__row">
          <span className="product-card__price">
            {p.de && <s>{formatarPreco(p.de)}</s>}
            {formatarPreco(p.preco)}
          </span>
          <button
            type="button"
            className={"product-card__add" + (adicionado ? " is-added" : "")}
            disabled={ocupado.add}
            aria-label={`Adicionar ${p.nome} ao carrinho`}
            onClick={adicionar}
          >
            <IconeCarrinho />
          </button>
        </div>
      </div>
    </li>
  );
}

export default function Carrossel() {
  const [estado, setEstado] = useState({ carregando: true });
  const [favoritos, setFavoritos] = useState(new Set());
  const [controles, setControles] = useState({ anterior: true, proximo: true, ativo: 0 });
  const track = useRef(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const [produtos, favs] = await Promise.all([buscarProdutos(), buscarFavoritos().catch(() => [])]);
        if (!ativo) return;
        const lista = [...produtos]
          .sort((a, b) => (b.de ? 1 : 0) - (a.de ? 1 : 0) || b.id - a.id)
          .slice(0, MAX_CARROSSEL);
        // os 3 produtos cadastrados mais recentemente ganham o selo "Novo"
        const novos = new Set(
          [...produtos]
            .sort((a, b) => b.id - a.id)
            .slice(0, 3)
            .map(p => p.id)
        );
        setFavoritos(new Set(favs.map(p => p.id)));
        setEstado({ produtos: lista, novos });
      } catch (err) {
        if (ativo)
          setEstado({ erro: err instanceof TypeError ? "Não consegui carregar os produtos agora." : err.message });
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const passo = useCallback(() => {
    const el = track.current;
    const primeiro = el?.children[0];
    if (!primeiro) return 0;
    const style = window.getComputedStyle(el);
    const gap = parseFloat(style.columnGap || style.gap || "0");
    return primeiro.getBoundingClientRect().width + gap;
  }, []);

  const atualizarControles = useCallback(() => {
    const el = track.current;
    if (!el || !passo()) return;
    const maxScroll = el.scrollWidth - el.clientWidth - 4;
    setControles({
      anterior: el.scrollLeft <= 4,
      proximo: el.scrollLeft >= maxScroll,
      ativo: Math.round(el.scrollLeft / passo())
    });
  }, [passo]);

  useEffect(() => {
    if (!estado.produtos?.length) return;
    const el = track.current;
    let timer;
    const aoRolar = () => {
      clearTimeout(timer);
      timer = setTimeout(atualizarControles, 60);
    };
    el.addEventListener("scroll", aoRolar);
    window.addEventListener("resize", atualizarControles);
    atualizarControles();
    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", atualizarControles);
    };
  }, [estado.produtos, atualizarControles]);

  const aoFavoritar = (id, favoritado) =>
    setFavoritos(atual => {
      const novo = new Set(atual);
      if (favoritado) novo.add(id);
      else novo.delete(id);
      return novo;
    });

  const vazio = estado.erro || (estado.produtos && !estado.produtos.length);
  const irPara = i => track.current.scrollTo({ left: i * passo(), behavior: "smooth" });
  const rolar = direcao => track.current.scrollBy({ left: direcao * passo(), behavior: "smooth" });

  return (
    <>
      <div className={"carousel" + (vazio ? " carousel--vazio" : "")}>
        <button
          type="button"
          className="carousel__btn carousel__btn--prev"
          id="carousel-prev"
          aria-label="Produto anterior"
          disabled={Boolean(estado.produtos?.length) && controles.anterior}
          onClick={() => rolar(-1)}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 5 8 12l7 7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <ul className="carousel__track" id="carousel-track" ref={track}>
          {estado.carregando && <li className="hs-estado">Carregando produtos... 🐾</li>}
          {estado.erro && (
            <li className="hs-estado">
              {estado.erro} <Link to="/produtos">Ver loja</Link>
            </li>
          )}
          {estado.produtos && !estado.produtos.length && (
            <li className="hs-estado">Em breve teremos novidades por aqui! 🐾</li>
          )}
          {estado.produtos?.map(p => (
            <CartaoProduto
              key={p.id}
              produto={p}
              favoritado={favoritos.has(p.id)}
              novo={estado.novos.has(p.id)}
              aoFavoritar={aoFavoritar}
            />
          ))}
        </ul>

        <button
          type="button"
          className="carousel__btn carousel__btn--next"
          id="carousel-next"
          aria-label="Próximo produto"
          disabled={Boolean(estado.produtos?.length) && controles.proximo}
          onClick={() => rolar(1)}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="m9 5 7 7-7 7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* indicadores (um por cartão): aparecem só no celular, onde as setas somem */}
      <div className="carousel__dots" id="carousel-dots">
        {estado.produtos?.map((p, i) => (
          <button
            key={p.id}
            type="button"
            aria-label={`Ir para o produto ${i + 1}`}
            aria-current={i === controles.ativo ? "true" : "false"}
            onClick={() => irPara(i)}
          />
        ))}
      </div>
    </>
  );
}
