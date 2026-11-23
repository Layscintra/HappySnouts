import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import Icone from "../../components/Icone.jsx";
import Footer from "../../components/layout/Footer.jsx";
import Header from "../../components/layout/Header.jsx";
import {
  buscarProdutos,
  buscarFavoritos,
  alternarFavorito,
  adicionarAoCarrinho,
  clienteLogado,
  formatarPreco,
  avisar
} from "../../lib/api.js";
import { navegar } from "../../lib/navegar.js";

// Produtos que dá para abrir direto pelo link (/produtos?ver=...): nome na loja e busca reserva.
// Na loja o alimentador se chama "Comedouro Automático" e a coleira rastreadora "Coleira inteligente GPS".
const DESTAQUES = {
  alimentador: { nome: /alimentador|comedouro automatico/, busca: "comedouro" },
  coleira: { nome: /coleira (inteligente|gps|rastreadora)|rastreador/, busca: "coleira inteligente" }
};

const norm = v =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const FAIXAS = [
  ["todos", "Qualquer preço", () => true],
  ["ate50", "Até R$ 50", v => v <= 50],
  ["50a100", "R$ 50 a R$ 100", v => v > 50 && v <= 100],
  ["100a200", "R$ 100 a R$ 200", v => v > 100 && v <= 200],
  ["200mais", "Acima de R$ 200", v => v > 200]
];
const ORDENS = [
  ["novos", "Mais recentes"],
  ["menor", "Menor preço"],
  ["maior", "Maior preço"]
];
const FILTROS_VAZIOS = { cat: "todos", preco: "todos", promo: false };

const desconto = p => (p.de ? `-${Math.round(100 - (p.preco / p.de) * 100)}%` : "");

function Preco({ produto: p }) {
  return (
    <p className="price">
      {p.de && <s>{formatarPreco(p.de)}</s>}
      <b>{formatarPreco(p.preco)}</b>
    </p>
  );
}

function Foto({ produto: p }) {
  const [erro, setErro] = useState(false);
  return (
    <>
      <Icone id="paw" />
      {p.imagem && !erro && <img src={p.imagem} alt={p.nome} loading="lazy" onError={() => setErro(true)} />}
    </>
  );
}

// menu suspenso (categoria, preço, ordenar)
// o menu fica "fixed" para não ser cortado pela rolagem lateral no celular
function MenuSuspenso({
  nome,
  lista,
  atual,
  rotulo,
  ativo,
  icone,
  ordem = false,
  aberto,
  aoAbrir,
  aoFechar,
  aoEscolher
}) {
  const caixa = useRef(null);
  const botao = useRef(null);
  const menu = useRef(null);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!aberto) {
      setPos(null);
      return;
    }
    const r = botao.current.getBoundingClientRect();
    const largura = Math.max(r.width, menu.current.offsetWidth);
    let left = ordem ? r.right - largura : r.left;
    left = Math.min(Math.max(8, left), innerWidth - largura - 8);
    setPos({ top: `${r.bottom + 8}px`, left: `${left}px`, minWidth: `${r.width}px` });
    (menu.current.querySelector('[aria-checked="true"]') || menu.current.querySelector("button"))?.focus();
  }, [aberto, ordem]);

  // fecha clicando fora, com Esc, rolando ou redimensionando; setas navegam
  useEffect(() => {
    if (!aberto) return;
    const fora = e => {
      if (!caixa.current.contains(e.target)) aoFechar();
    };
    const teclas = e => {
      if (e.key === "Escape") {
        aoFechar();
        botao.current.focus();
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const itens = [...menu.current.querySelectorAll("[data-valor]")];
        const i = itens.indexOf(document.activeElement);
        itens[(i + (e.key === "ArrowDown" ? 1 : -1) + itens.length) % itens.length].focus();
      }
    };
    document.addEventListener("click", fora);
    document.addEventListener("keydown", teclas);
    addEventListener("resize", aoFechar);
    addEventListener("scroll", aoFechar, { passive: true });
    return () => {
      document.removeEventListener("click", fora);
      document.removeEventListener("keydown", teclas);
      removeEventListener("resize", aoFechar);
      removeEventListener("scroll", aoFechar);
    };
  }, [aberto, aoFechar]);

  return (
    <div className="dd" data-dd={nome} ref={caixa}>
      <button
        ref={botao}
        type="button"
        className={`fbtn${ordem ? " fbtn-ordem" : ""}${ativo ? " on" : ""}`}
        aria-haspopup="true"
        aria-expanded={aberto}
        onClick={() => (aberto ? aoFechar() : aoAbrir())}
      >
        <Icone id={icone} />
        {ordem && <span className="fpre">Ordenar:</span>}
        <span data-rotulo="">{rotulo}</span>
        <Icone id="seta" className="i seta" />
      </button>
      <div
        ref={menu}
        className={`dd-menu${ordem ? " dd-menu-dir" : ""}`}
        role="menu"
        hidden={!aberto}
        style={pos || undefined}
      >
        {lista.map(([valor, texto]) => (
          <button
            key={valor}
            type="button"
            role="menuitemradio"
            aria-checked={valor === atual}
            data-valor={valor}
            onClick={() => {
              aoEscolher(valor);
              aoFechar();
              botao.current.focus();
            }}
          >
            <span>{texto}</span>
            <Icone id="check" />
          </button>
        ))}
      </div>
    </div>
  );
}

function Cartao({ produto: p, favoritado, ocupado, aoAbrir, aoFavoritar, aoAdicionar }) {
  return (
    <article className="card" data-id={p.id}>
      <div className="ph">
        {p.de && <span className="badge off">{desconto(p)}</span>}
        <button
          type="button"
          className={"fav" + (favoritado ? " on" : "")}
          aria-pressed={favoritado}
          disabled={ocupado === "fav"}
          aria-label={`${favoritado ? "Remover dos favoritos" : "Favoritar"}: ${p.nome}`}
          onClick={aoFavoritar}
        >
          <Icone id="heart" />
        </button>
        <button type="button" className="img" aria-label={`Ver detalhes: ${p.nome}`} onClick={aoAbrir}>
          <Foto produto={p} />
        </button>
      </div>
      <h3>
        <button type="button" onClick={aoAbrir}>
          {p.nome}
        </button>
      </h3>
      <small className="pcat">{p.categoria}</small>
      <Preco produto={p} />
      {p.indisponivel ? (
        <button type="button" className="add" disabled aria-disabled="true">
          Indisponível
        </button>
      ) : (
        <button type="button" className="add" disabled={ocupado === "add"} onClick={aoAdicionar}>
          <Icone id="cart" />
          <span className="longo">Adicionar ao carrinho</span>
          <span className="curto">Adicionar</span>
        </button>
      )}
    </article>
  );
}

function Detalhes({ produto: p, aoFechar, aoComprar, aoAdicionar }) {
  const dialogo = useRef(null);
  useEffect(() => {
    const d = dialogo.current;
    if (p && !d.open && typeof d.showModal === "function") d.showModal();
    if (!p && d.open) d.close();
  }, [p]);

  return (
    <dialog
      id="modal"
      aria-labelledby="mName"
      ref={dialogo}
      onClose={aoFechar}
      onClick={e => {
        if (e.target === dialogo.current) dialogo.current.close();
      }}
    >
      <button className="x" aria-label="Fechar" onClick={() => dialogo.current.close()}>
        <Icone id="x" />
      </button>
      <div id="mBody" className="mbody">
        {p && (
          <>
            <div className="mimg">
              <Foto produto={p} />
            </div>
            <div className="minfo" data-id={p.id}>
              {p.de && <span className="badge off">{desconto(p)}</span>}
              <small className="pcat">{p.categoria}</small>
              <h2 id="mName">{p.nome}</h2>
              <Preco produto={p} />
              <small>Ou 3x de {formatarPreco(p.preco / 3)} sem juros</small>
              <p>{p.descricao}</p>
              {p.indisponivel ? (
                <p>
                  <b>Este produto não está mais disponível na loja.</b>
                </p>
              ) : (
                <div className="mbtns">
                  <button type="button" className="btn" onClick={aoComprar}>
                    <Icone id="cart" /> Comprar agora
                  </button>
                  <button type="button" className="btn alt" onClick={aoAdicionar}>
                    Adicionar ao carrinho
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}

export default function Loja({ modo = "loja" }) {
  const modoFavoritos = modo === "favoritos";
  const [produtos, setProdutos] = useState(null); // null = carregando
  const [erro, setErro] = useState("");
  const [favs, setFavs] = useState(new Set());
  const [busca, setBusca] = useState(() => new URLSearchParams(location.search).get("q") || "");
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [ordem, setOrdem] = useState("novos");
  const [menuAberto, setMenuAberto] = useState(null);
  const [aberto, setAberto] = useState(null);
  const [ocupado, setOcupado] = useState({}); // { [id]: "fav" | "add" }
  const grid = useRef(null);
  const fecharMenu = useCallback(() => setMenuAberto(null), []);

  // Abre um produto em destaque pelo nome. Se ele não estiver na lista, busca por ele.
  // Usado pelo "Ver produto" do banner e pelos cards de Super Ofertas da página inicial
  // (/produtos?ver=alimentador / /produtos?ver=coleira).
  const abrirDestaque = useCallback(
    qual => {
      const d = DESTAQUES[qual];
      if (!d) return;
      const produto = (produtos || []).find(p => d.nome.test(norm(p.nome)));
      if (produto) return setAberto(produto);
      setBusca(d.busca);
      grid.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [produtos]
  );
  const verDestaque = () => abrirDestaque("alimentador");

  // chegou pelo link "?ver=...": abre o produto assim que a lista carrega (uma vez só)
  const destaqueDaUrl = useRef(new URLSearchParams(location.search).get("ver"));
  useEffect(() => {
    if (!produtos || !destaqueDaUrl.current) return;
    abrirDestaque(destaqueDaUrl.current);
    destaqueDaUrl.current = null;
    const url = new URL(location.href);
    url.searchParams.delete("ver");
    history.replaceState(history.state, "", url); // recarregar a página não abre de novo
  }, [produtos, abrirDestaque]);

  const carregar = useCallback(async () => {
    setErro("");
    setProdutos(null);
    try {
      if (modoFavoritos) {
        if (!clienteLogado()) return; // a navegação já mostra o aviso de login
        // o favorito traz poucos campos; cruzamos com a lista da loja para ter descrição e status
        const [lista, loja] = await Promise.all([buscarFavoritos(), buscarProdutos().catch(() => [])]);
        const daLoja = new Map(loja.map(p => [p.id, p]));
        setProdutos(lista.map(p => daLoja.get(p.id) || { ...p, indisponivel: true }));
        setFavs(new Set(lista.map(p => p.id)));
      } else {
        const [lista, favoritos] = await Promise.all([buscarProdutos(), buscarFavoritos().catch(() => [])]);
        setProdutos(lista);
        setFavs(new Set(favoritos.map(p => p.id)));
      }
    } catch (err) {
      setErro(err instanceof TypeError ? "Não consegui falar com o servidor. O backend está rodando?" : err.message);
    }
  }, [modoFavoritos]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const categorias = useMemo(() => {
    const vistas = new Map();
    (produtos || []).forEach(p => {
      if (!vistas.has(String(p.idCategoria))) vistas.set(String(p.idCategoria), p.categoria);
    });
    return [...vistas].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [produtos]);
  const cat = filtros.cat !== "todos" && !categorias.some(([id]) => id === filtros.cat) ? "todos" : filtros.cat;

  const lista = useMemo(() => {
    const q = norm(busca.trim());
    const faixa = (FAIXAS.find(([v]) => v === filtros.preco) || FAIXAS[0])[2];
    return (produtos || [])
      .filter(
        p =>
          (cat === "todos" || String(p.idCategoria) === cat) &&
          faixa(Number(p.preco)) &&
          (!filtros.promo || p.de) &&
          (!q || norm(p.nome + " " + p.categoria + " " + p.descricao).includes(q))
      )
      .sort(
        (a, b) => (ordem === "menor" ? a.preco - b.preco : ordem === "maior" ? b.preco - a.preco : b.id - a.id)
      );
  }, [produtos, busca, filtros, cat, ordem]);

  const ativos = (cat !== "todos") + (filtros.preco !== "todos") + filtros.promo;
  const limpar = () => setFiltros(FILTROS_VAZIOS);
  const contagem = lista.length === 1 ? "1 produto" : `${lista.length} produtos`;

  async function acao(p, tipo, fn) {
    if (ocupado[p.id]) return;
    setOcupado(o => ({ ...o, [p.id]: tipo }));
    try {
      await fn();
    } catch (err) {
      avisar(err.message, "erro");
    } finally {
      setOcupado(o => ({ ...o, [p.id]: undefined }));
    }
  }

  const favoritar = p =>
    acao(p, "fav", async () => {
      const favoritar = !favs.has(p.id);
      if (!(await alternarFavorito(p.id, favoritar))) return;
      setFavs(atual => {
        const novo = new Set(atual);
        if (favoritar) novo.add(p.id);
        else novo.delete(p.id);
        return novo;
      });
      if (modoFavoritos && !favoritar) setProdutos(atual => atual.filter(x => x.id !== p.id));
      avisar(favoritar ? "Salvo nos seus favoritos ♥" : "Removido dos favoritos");
    });

  const adicionar = p =>
    acao(p, "add", async () => {
      if (await adicionarAoCarrinho(p.id)) {
        setAberto(null);
        avisar(`${p.nome} foi para o carrinho!`);
      }
    });

  const comprar = p =>
    acao(p, "add", async () => {
      if (await adicionarAoCarrinho(p.id)) navegar("/carrinho");
    });

  let estado = null;
  if (erro) {
    estado = (
      <>
        {erro}
        <br />
        <button type="button" id="tentarDeNovo" onClick={carregar}>
          Tentar de novo
        </button>
      </>
    );
  } else if (!produtos) {
    estado = "Carregando produtos... 🐾";
  } else if (!lista.length && !produtos.length) {
    estado = modoFavoritos ? (
      <>
        Você ainda não favoritou nenhum produto. Toque no ♥ de um produto para guardar aqui.
        <br />
        <Link to="/produtos">Ver produtos</Link>
      </>
    ) : (
      "Ainda não há produtos cadastrados na loja. Volte em breve! 🐾"
    );
  } else if (!lista.length) {
    estado = busca.trim() ? (
      "Não encontramos produtos com esse nome."
    ) : !modoFavoritos ? (
      <>
        Nenhum produto com esses filtros.{" "}
        <button type="button" className="hs-link" onClick={limpar}>
          Limpar filtros
        </button>
      </>
    ) : (
      "Nenhum produto nesta categoria."
    );
  }

  const menuOrdem = (
    <MenuSuspenso
      nome="sort"
      lista={ORDENS}
      atual={ordem}
      ordem
      icone="ordenar"
      rotulo={(ORDENS.find(([v]) => v === ordem) || ORDENS[0])[1]}
      aberto={menuAberto === "sort"}
      aoAbrir={() => setMenuAberto("sort")}
      aoFechar={fecharMenu}
      aoEscolher={setOrdem}
    />
  );

  return (
    <>
      <LojaIcones />
      <Header
        atual={modoFavoritos ? undefined : "produtos"}
        busca={{
          valor: busca,
          aoMudar: setBusca,
          aoBuscar: () => grid.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        }}
      />

      <main className="wrap hs-container">
        {!modoFavoritos && (
          <section className="hero" aria-label="Destaque da semana">
            <h1 className="sr">Destaque da Semana: Alimentador Automático</h1>
            <img
              className="hero__img"
              src="img/bannerdestaque.webp"
              width="2000"
              height="688"
              alt="Destaque da semana: alimentador automático. Mais praticidade, saúde e bem-estar para o seu pet, com programação de horários e controle de porções."
            />
            {/* botão de verdade por cima do "Ver produto" desenhado na imagem */}
            <button type="button" className="hero__btn" onClick={verDestaque}>
              Ver produto
            </button>
          </section>
        )}

        <section aria-labelledby="ptitle">
          <div className="phead">
            <div>
              <h2 id="ptitle">
                <Icone id="paw" /> {modoFavoritos ? "Meus favoritos" : "Nossos Produtos"}
              </h2>
              {modoFavoritos ? (
                <p>
                  Os produtos que você salvou com ♥. <span id="pcount">{produtos && !erro ? contagem : ""}</span>
                </p>
              ) : (
                <p>Tudo o que seu pet precisa em um só lugar. Qualidade, carinho e os melhores preços!</p>
              )}
            </div>

            {modoFavoritos && (
              <div className="fsolo" id="filtros" aria-label="Ordenar produtos">
                {menuOrdem}
              </div>
            )}
          </div>

          {!modoFavoritos && (
            <>
              <div className="fbar" id="filtros" role="toolbar" aria-label="Filtrar e ordenar produtos">
                <div className="fbar-filtros" onScroll={fecharMenu}>
                  <span className="flabel">
                    <Icone id="funil" /> Filtrar por
                    <em className="fcount" id="fCount" hidden={!ativos}>
                      {ativos}
                    </em>
                  </span>

                  <MenuSuspenso
                    nome="cat"
                    lista={[["todos", "Todas as categorias"], ...categorias]}
                    atual={cat}
                    icone="paw"
                    rotulo={cat !== "todos" ? categorias.find(([id]) => id === cat)?.[1] : "Categoria"}
                    ativo={cat !== "todos"}
                    aberto={menuAberto === "cat"}
                    aoAbrir={() => setMenuAberto("cat")}
                    aoFechar={fecharMenu}
                    aoEscolher={v => setFiltros(f => ({ ...f, cat: v }))}
                  />
                  <MenuSuspenso
                    nome="preco"
                    lista={FAIXAS}
                    atual={filtros.preco}
                    icone="etiqueta"
                    rotulo={filtros.preco !== "todos" ? FAIXAS.find(([v]) => v === filtros.preco)[1] : "Preço"}
                    ativo={filtros.preco !== "todos"}
                    aberto={menuAberto === "preco"}
                    aoAbrir={() => setMenuAberto("preco")}
                    aoFechar={fecharMenu}
                    aoEscolher={v => setFiltros(f => ({ ...f, preco: v }))}
                  />

                  <button
                    type="button"
                    className={"fbtn" + (filtros.promo ? " on" : "")}
                    id="fPromo"
                    aria-pressed={filtros.promo}
                    onClick={() => setFiltros(f => ({ ...f, promo: !f.promo }))}
                  >
                    <Icone id="porcento" />
                    <span>Promoções</span>
                  </button>

                  <button type="button" className="flimpar" id="fLimpar" hidden={!ativos} onClick={limpar}>
                    <Icone id="x" /> Limpar
                  </button>
                </div>

                <div className="fbar-ordem">{menuOrdem}</div>
              </div>

              <p className="presult" id="pcount" aria-live="polite">
                {produtos && !erro ? contagem : ""}
              </p>
            </>
          )}

          <div id="grid" className="grid" aria-live="polite" ref={grid}>
            {estado ? (
              <div className="hs-estado">{estado}</div>
            ) : (
              lista.map(p => (
                <Cartao
                  key={p.id}
                  produto={p}
                  favoritado={favs.has(p.id)}
                  ocupado={ocupado[p.id]}
                  aoAbrir={() => setAberto(p)}
                  aoFavoritar={() => favoritar(p)}
                  aoAdicionar={() => adicionar(p)}
                />
              ))
            )}
          </div>
        </section>
      </main>

      <Footer />

      <Detalhes
        produto={aberto}
        aoFechar={() => setAberto(null)}
        aoComprar={() => comprar(aberto)}
        aoAdicionar={() => adicionar(aberto)}
      />
    </>
  );
}

function LojaIcones() {
  return (
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
      <symbol id="funil" viewBox="0 0 24 24">
        <path d="M3 4h18l-7 8.5V19l-4 2v-8.5z" />
      </symbol>
      <symbol id="etiqueta" viewBox="0 0 24 24">
        <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
        <circle cx="7.5" cy="7.5" r="1.5" />
      </symbol>
      <symbol id="porcento" viewBox="0 0 24 24">
        <path d="M19 5 5 19" />
        <circle cx="6.5" cy="6.5" r="2.5" />
        <circle cx="17.5" cy="17.5" r="2.5" />
      </symbol>
      <symbol id="ordenar" viewBox="0 0 24 24">
        <path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4" />
      </symbol>
      <symbol id="seta" viewBox="0 0 24 24">
        <path d="m6 9 6 6 6-6" />
      </symbol>
      <symbol id="check" viewBox="0 0 24 24">
        <path d="M20 6 9 17l-5-5" />
      </symbol>
    </svg>
  );
}
