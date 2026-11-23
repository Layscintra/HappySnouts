import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import Footer from "../../components/layout/Footer.jsx";
import Header from "../../components/layout/Header.jsx";
import {
  api,
  ENDPOINTS,
  clienteLogado,
  lerErro,
  urlImagem,
  formatarPreco,
  avisar,
  atualizarContadorCarrinho
} from "../../lib/api.js";
import { confirmar } from "../../lib/ui.js";

function CarrinhoIcones() {
  return (
    <>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <symbol id="search" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.3-4.3" />
        </symbol>
        <symbol id="chat" viewBox="0 0 24 24">
          <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
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
        <symbol id="x" viewBox="0 0 24 24">
          <path d="M18 6L6 18M6 6l12 12" />
        </symbol>
        <symbol id="paw" viewBox="0 0 24 24">
          <g fill="currentColor" stroke="none">
            <ellipse cx="5.5" cy="11" rx="2" ry="2.6" />
            <ellipse cx="9.5" cy="6.5" rx="2" ry="2.6" />
            <ellipse cx="14.5" cy="6.5" rx="2" ry="2.6" />
            <ellipse cx="18.5" cy="11" rx="2" ry="2.6" />
            <path d="M12 11c-3 0-6 3.2-6 5.7 0 2.700 2.500 3.300 6 3.300s6-.6 6-3.300C18 14.200 15 11 12 11z" />
          </g>
        </symbol>
      </svg>
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
      </svg>
    </>
  );
}

function ItemCarrinho({ item, aoAlterar }) {
  const [ocupado, setOcupado] = useState(false);
  const [semFoto, setSemFoto] = useState(false);

  const executar = async acao => {
    setOcupado(true);
    try {
      await aoAlterar(item, acao);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className={"cart-item" + (item.ativo ? "" : " is-off")} data-id={item.id_produto}>
      <div className="item-info">
        {item.imagem_url ? (
          <img
            src={urlImagem(item.imagem_url)}
            alt=""
            style={semFoto ? { visibility: "hidden" } : undefined}
            onError={() => setSemFoto(true)}
          />
        ) : (
          <span className="item-sem-foto" aria-hidden="true">
            🐾
          </span>
        )}
        <span className="item-name">
          {item.nome}{" "}
          {item.ativo ? (
            <small>{formatarPreco(item.preco_unico)} cada</small>
          ) : (
            <small className="item-off">Indisponível. Remova para finalizar.</small>
          )}
        </span>
      </div>
      <div className="qty-control">
        <button
          type="button"
          aria-label="Diminuir quantidade"
          disabled={ocupado || item.quantidade <= 1 || !item.ativo}
          onClick={() => executar("dec")}
        >
          −
        </button>
        <span aria-live="polite">{item.quantidade}</span>
        <button
          type="button"
          aria-label="Aumentar quantidade"
          disabled={ocupado || !item.ativo}
          onClick={() => executar("inc")}
        >
          +
        </button>
      </div>
      <div className="item-price">{formatarPreco(item.subtotal)}</div>
      <div className="item-remove">
        <button type="button" disabled={ocupado} onClick={() => executar("remove")}>
          Remover
        </button>
      </div>
    </div>
  );
}

export default function Carrinho() {
  const [carrinho, setCarrinho] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [esvaziando, setEsvaziando] = useState(false);

  const carregar = useCallback(async () => {
    if (!clienteLogado()) return; // a navegação já mostra o aviso de login
    setCarregando(true);
    setErro("");
    try {
      const resp = await api(ENDPOINTS.carrinho);
      if (!resp.ok) throw new Error(await lerErro(resp, "Não foi possível carregar o carrinho."));
      const dados = await resp.json();
      setCarrinho(dados);
      atualizarContadorCarrinho(dados.itens || []);
    } catch (err) {
      setErro(err instanceof TypeError ? "Não consegui falar com o servidor. O backend está rodando?" : err.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Faz a chamada e recarrega o carrinho do banco (assim os valores batem sempre com o backend)
  async function alterar(caminho, opcoes) {
    const resp = await api(caminho, opcoes);
    if (!resp.ok) throw new Error(await lerErro(resp, "Não foi possível atualizar o carrinho."));
    await carregar();
  }

  const alterarItem = async (item, acao) => {
    const caminho = `${ENDPOINTS.carrinho}/itens/${item.id_produto}`;
    try {
      if (acao === "remove") {
        await alterar(caminho, { method: "DELETE" });
        avisar("Produto removido do carrinho");
      } else {
        const quantidade = item.quantidade + (acao === "inc" ? 1 : -1);
        await alterar(caminho, { method: "PUT", body: JSON.stringify({ quantidade }) });
      }
    } catch (err) {
      avisar(err.message, "erro");
    }
  };

  const esvaziar = async () => {
    if (!carrinho?.itens.length) return;
    const ok = await confirmar({
      titulo: "Esvaziar o carrinho?",
      mensagem: "Todos os produtos saem do carrinho.",
      botao: "Esvaziar",
      cancelar: "Manter produtos",
      tipo: "perigo"
    });
    if (!ok) return;
    setEsvaziando(true);
    try {
      await alterar(ENDPOINTS.carrinho, { method: "DELETE" });
      avisar("Carrinho esvaziado");
    } catch (err) {
      avisar(err.message, "erro");
    } finally {
      setEsvaziando(false);
    }
  };

  const itens = carrinho?.itens || [];
  const indisponiveis = itens.filter(i => !i.ativo);
  const qtd = itens.reduce((s, i) => s + i.quantidade, 0);
  const subtotal = carrinho?.subtotal || 0;
  const frete = carrinho?.frete || 0;
  const total = subtotal + frete;
  const bloqueado = !itens.length || indisponiveis.length > 0;
  const carregado = Boolean(carrinho);

  const finalizar = e => {
    if (!carregado || !bloqueado) return;
    e.preventDefault();
    avisar(itens.length ? "Remova os produtos indisponíveis para continuar." : "Seu carrinho está vazio.", "erro");
  };

  return (
    <>
      <CarrinhoIcones />
      <Header atual="carrinho" />

      <main className="cart-page hs-container">
        <h1 className="page-title">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M3 4h2l1.6 10.6A2 2 0 008.6 16.4h8.8a2 2 0 001.96-1.6L21 7H6" />
            <circle cx="9" cy="20" r="1.6" />
            <circle cx="17" cy="20" r="1.6" />
          </svg>{" "}
          Carrinho de compras
        </h1>

        <div className="cart-layout">
          <section className="cart-table-card">
            <div className="cart-table-head" hidden={carregado && !itens.length}>
              <span>Produtos</span>
              <span>Quantidade</span>
              <span>Preço</span>
            </div>

            <div className="cart-items" id="cart-items">
              {carregando && !carrinho && <p className="hs-estado">Carregando seu carrinho... 🐾</p>}
              {erro && (
                <div className="hs-estado">
                  {erro}
                  <br />
                  <button type="button" id="tentarDeNovo" onClick={carregar}>
                    Tentar de novo
                  </button>
                </div>
              )}
              {!erro && itens.map(item => <ItemCarrinho key={item.id_produto} item={item} aoAlterar={alterarItem} />)}
            </div>

            <div className="cart-empty hs-estado" id="cart-empty" hidden={!carregado || itens.length > 0}>
              Seu carrinho está vazio. 🐾
              <br />
              <Link to="/produtos">Ver produtos</Link>
            </div>

            <div className="cart-actions">
              <Link to="/produtos" className="link-back">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M11 6l-6 6 6 6" />
                </svg>{" "}
                Continuar comprando
              </Link>
              <button
                type="button"
                id="esvaziar"
                className="link-clear"
                hidden={carregado && !itens.length}
                disabled={esvaziando}
                onClick={esvaziar}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0l1 12a1 1 0 001 1h6a1 1 0 001-1l1-12" />
                </svg>{" "}
                Esvaziar carrinho
              </button>
            </div>
          </section>

          <aside className="cart-summary">
            <div className="summary-card">
              <h2>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M6 8V6a6 6 0 0112 0v2h1a1 1 0 011 1l-1 12a2 2 0 01-2 2H7a2 2 0 01-2-2L4 9a1 1 0 011-1h1zm2 0h8V6a4 4 0 00-8 0v2z" />
                </svg>{" "}
                Resumo da compra
              </h2>

              <div className="summary-row">
                <span>
                  Subtotal (<span id="qtd-itens">{qtd}</span> itens)
                </span>
                <span id="subtotal">{formatarPreco(subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Frete</span>
                <span id="frete-resumo">{frete ? formatarPreco(frete) : "calculado no próximo passo"}</span>
              </div>

              <hr />

              <div className="summary-total">
                <span>Total</span>
                <span id="total">{formatarPreco(total)}</span>
              </div>
              <p className="parcelamento">
                em até 3x de <span id="parcela">{formatarPreco(total / 3)}</span> sem juros
              </p>

              <Link
                to="/finalizar"
                className={"btn-finalizar" + (carregado && bloqueado ? " is-disabled" : "")}
                id="finalizar"
                aria-disabled={carregado ? String(bloqueado) : undefined}
                onClick={finalizar}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M6 10V7a6 6 0 1112 0v3h.5A1.5 1.5 0 0120 11.5v9a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 20.5v-9A1.5 1.5 0 015.5 10H6zm2 0h8V7a4 4 0 00-8 0v3z" />
                </svg>{" "}
                Confirmar compra
              </Link>
            </div>

            <p className="cart-nota" id="cart-nota" hidden={!indisponiveis.length}>
              {indisponiveis.length ? "Remova os produtos indisponíveis para continuar." : ""}
            </p>
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}
