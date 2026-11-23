import { useState } from "react";
import { Link } from "react-router";
import { navegar } from "../../lib/navegar.js";
import { useUi } from "../../lib/ui.js";

const LINKS = [
  { id: "blog", href: "/blog", icone: "#chat", texto: "Blog" },
  { id: "carrinho", href: "/carrinho", icone: "#cart", texto: "Carrinho" },
  { id: "produtos", href: "/produtos", icone: "#box", texto: "Produtos" },
  { id: "controle", href: "/controle", icone: "#chart", texto: "Relatório" },
  { id: "perfil", href: "/perfil", icone: "#user", texto: "Perfil" }
];

// Topo da loja. O ícone de cada link vem do <symbol> da própria página.
// atual: id do link destacado.
// busca: { valor, aoMudar(texto), aoBuscar(texto), rotulo } para páginas que filtram
//        na própria tela (loja, favoritos, blog). Sem ela, a busca leva para a loja.
export default function Header({ atual, busca, semAriaCurrent = false }) {
  const { carrinho } = useUi();
  const [texto, setTexto] = useState("");
  const valor = busca ? busca.valor : texto;

  const enviar = e => {
    e.preventDefault();
    const termo = valor.trim();
    if (busca?.aoBuscar) busca.aoBuscar(termo);
    else if (!busca) navegar("/produtos" + (termo ? "?q=" + encodeURIComponent(termo) : ""));
  };

  return (
    <header className="top">
      <Link className="logo" to="/" aria-label="Happy Snouts - início">
        <img src="img/logo-topo.png" alt="Happy Snouts" />
      </Link>

      <form className="search" id="searchForm" role="search" onSubmit={enviar}>
        <svg className="i" aria-hidden="true">
          <use href="#search" />
        </svg>
        <input
          id="q"
          name="q"
          type="search"
          placeholder="Busque ração, brinquedos, acessórios e muito mais..."
          aria-label={busca?.rotulo || "Buscar produtos"}
          value={valor}
          onChange={e => (busca ? busca.aoMudar(e.target.value) : setTexto(e.target.value))}
        />
        <button type="submit" aria-label="Buscar">
          <svg className="i" aria-hidden="true">
            <use href="#search" />
          </svg>
        </button>
      </form>

      <nav className="nav" aria-label="Principal">
        {LINKS.map(l => {
          const cur = l.id === atual;
          return (
            <Link
              key={l.id}
              to={l.href}
              className={cur ? "cur" : undefined}
              aria-current={cur && !semAriaCurrent ? "page" : undefined}
            >
              <svg className="i" aria-hidden="true">
                <use href={l.icone} />
              </svg>
              {l.id === "carrinho" && (
                <em id="cartCount" hidden={!carrinho}>
                  {carrinho}
                </em>
              )}
              <span>{l.texto}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
