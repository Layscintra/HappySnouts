import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ENDPOINTS,
  PAGINAS,
  dadosDoToken,
  funcionarioLogado,
  normalizarProduto,
  pedir,
  semServidor
} from "../../lib/api.js";
import { navegar } from "../../lib/navegar.js";
import { confirmar } from "../../lib/ui.js";
import Atendimento from "./Atendimento.jsx";
import Blog from "./Blog.jsx";
import Categorias from "./Categorias.jsx";
import Pedidos from "./Pedidos.jsx";
import Produtos from "./Produtos.jsx";
import Relatorios from "./Relatorios.jsx";
import { Icone, PainelIcones } from "./comum.jsx";

const ABAS = [
  { id: "pedidos", icone: "receipt", texto: "Pedidos" },
  { id: "produtos", icone: "box", texto: "Produtos" },
  { id: "categorias", icone: "tag", texto: "Categorias" },
  { id: "atendimento", icone: "chat", texto: "Atendimento" },
  { id: "relatorios", icone: "chart", texto: "Relatórios" },
  { id: "blog", icone: "book", texto: "Blog" }
];
const ATUALIZAR_A_CADA = 30000; // pedidos e mensagens novas aparecem sozinhos

const abaDoEndereco = () => {
  const id = window.location.hash.slice(1);
  return ABAS.some(a => a.id === id) ? id : "pedidos";
};

function useRecurso(carregar) {
  const [estado, setEstado] = useState({ dados: null, erro: "" });
  const recarregar = useCallback(async () => {
    try {
      const dados = await carregar();
      setEstado({ dados, erro: "" });
    } catch (err) {
      // se já tinha dados, mantém na tela (falha momentânea na atualização automática)
      setEstado(e => (e.dados ? e : { dados: null, erro: semServidor(err) }));
    }
  }, [carregar]);
  return [estado.dados, estado.erro, recarregar];
}

const carregarPedidos = async () => {
  const [lista, resumo] = await Promise.all([
    pedir(`${ENDPOINTS.pedidos}/admin/todos`, {}, "Não foi possível carregar os pedidos."),
    pedir(`${ENDPOINTS.pedidos}/admin/resumo`, {}, "Não foi possível carregar o resumo dos pedidos.")
  ]);
  return { lista, resumo };
};
const carregarProdutos = async () => {
  const lista = await pedir(`${ENDPOINTS.produtos}/tudo`, {}, "Não foi possível carregar os produtos.");
  // guardo o registro original para editar (o normalizado junta preço e promoção)
  return lista.map(p => ({ ...normalizarProduto(p), bruto: p }));
};
const carregarCategorias = async () => {
  const lista = await pedir(ENDPOINTS.categoriasProduto, {}, "Não foi possível carregar as categorias.");
  return lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
};
const carregarMensagens = () =>
  pedir(`${ENDPOINTS.contato}/admin/todas`, {}, "Não foi possível carregar as mensagens.");

export default function PainelFuncionario() {
  const autorizado = funcionarioLogado();
  const [aba, setAba] = useState(abaDoEndereco);
  const [novaCategoria, setNovaCategoria] = useState(false);
  const consumirNovaCategoria = useCallback(() => setNovaCategoria(false), []);

  const [pedidos, erroPedidos, recarregarPedidos] = useRecurso(carregarPedidos);
  const [produtos, erroProdutos, recarregarProdutos] = useRecurso(carregarProdutos);
  const [categorias, erroCategorias, recarregarCategorias] = useRecurso(carregarCategorias);
  const [mensagens, erroMensagens, recarregarMensagens] = useRecurso(carregarMensagens);

  useEffect(() => {
    if (!autorizado) navegar(PAGINAS.login, { replace: true });
  }, [autorizado]);

  useEffect(() => {
    if (!autorizado) return;
    recarregarPedidos();
    recarregarCategorias().then(recarregarProdutos);
    recarregarMensagens();
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      recarregarPedidos();
      recarregarMensagens();
    }, ATUALIZAR_A_CADA);
    return () => clearInterval(timer);
  }, [autorizado, recarregarPedidos, recarregarCategorias, recarregarProdutos, recarregarMensagens]);

  // a aba fica no endereço (#pedidos, #relatorios...) para sobreviver ao F5
  useEffect(() => {
    const aoMudar = () => setAba(abaDoEndereco());
    window.addEventListener("hashchange", aoMudar);
    return () => window.removeEventListener("hashchange", aoMudar);
  }, []);
  const irPara = id => {
    setAba(id);
    history.replaceState(history.state, "", `#${id}`); // mantém o estado do React Router
    window.scrollTo({ top: 0 });
  };

  if (!autorizado) return null;

  const recarregarCatalogo = async () => {
    await recarregarCategorias();
    await recarregarProdutos();
  };

  const novos = pedidos?.lista.filter(p => p.status === "recebido").length || 0;
  const aguardando = mensagens?.filter(m => m.status === "aberta").length || 0;
  const selos = { pedidos: novos, atendimento: aguardando };

  const sair = async () => {
    const ok = await confirmar({
      titulo: "Sair do painel?",
      mensagem: "Para voltar, é só entrar de novo com seu e-mail e senha.",
      botao: "Sair",
      tipo: "sair"
    });
    if (!ok) return;
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioNome");
    navegar(PAGINAS.login);
  };

  const nome = dadosDoToken()?.nome || "Funcionário";

  return (
    <>
      <PainelIcones />
      <header className="topo">
        <Link className="logo" to="/" aria-label="Ir para a loja">
          <img src="img/logo-topo.png" alt="Happy Snouts" />
        </Link>
        <div className="topo-titulo">
          <strong>Painel da loja</strong>
          <span>Área do funcionário</span>
        </div>
        <div className="topo-acoes">
          <Link className="ghost" to="/produtos" target="_blank" rel="noopener">
            <Icone id="eye" />
            <span className="so-largo">Ver loja</span>
          </Link>
          <span className="quem" title={nome}>
            <span className="avatar" aria-hidden="true">
              {nome.trim()[0]?.toUpperCase()}
            </span>
            <span className="so-largo">{nome.split(" ")[0]}</span>
          </span>
          <button type="button" className="ghost" onClick={sair}>
            <Icone id="out" />
            <span className="so-largo">Sair</span>
          </button>
        </div>
      </header>

      <div className="layout">
        <nav className="menu" aria-label="Seções do painel">
          {ABAS.map(a => (
            <button
              key={a.id}
              type="button"
              aria-current={aba === a.id ? "page" : undefined}
              onClick={() => irPara(a.id)}
            >
              <Icone id={a.icone} />
              <span>{a.texto}</span>
              {selos[a.id] > 0 && (
                <span
                  className="contador"
                  aria-label={`${selos[a.id]} ${a.id === "pedidos" ? "pedidos novos" : "mensagens aguardando"}`}
                >
                  {selos[a.id] > 99 ? "99+" : selos[a.id]}
                </span>
              )}
            </button>
          ))}
        </nav>

        <main className="conteudo">
          <section hidden={aba !== "pedidos"} aria-label="Pedidos">
            <Pedidos
              pedidos={pedidos?.lista}
              resumo={pedidos?.resumo}
              erro={erroPedidos}
              recarregar={recarregarPedidos}
            />
          </section>
          <section hidden={aba !== "produtos"} aria-label="Produtos">
            <Produtos
              produtos={produtos}
              categorias={categorias}
              erro={erroProdutos || erroCategorias}
              recarregar={recarregarCatalogo}
              semCategorias={() => {
                irPara("categorias");
                setNovaCategoria(true);
              }}
            />
          </section>
          <section hidden={aba !== "categorias"} aria-label="Categorias">
            <Categorias
              categorias={categorias}
              produtos={produtos}
              erro={erroCategorias}
              recarregar={recarregarCatalogo}
              novaAoAbrir={novaCategoria}
              aoConsumirNova={consumirNovaCategoria}
            />
          </section>
          <section hidden={aba !== "atendimento"} aria-label="Atendimento">
            <Atendimento mensagens={mensagens} erro={erroMensagens} recarregar={recarregarMensagens} />
          </section>
          <section hidden={aba !== "relatorios"} aria-label="Relatórios">
            <Relatorios
              pedidos={pedidos?.lista}
              produtos={produtos}
              categorias={categorias}
              erro={erroPedidos}
              recarregar={recarregarPedidos}
            />
          </section>
          <section hidden={aba !== "blog"} aria-label="Blog">
            <Blog ativo={aba === "blog"} />
          </section>
        </main>
      </div>
    </>
  );
}
