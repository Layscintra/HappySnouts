import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import Dialogo from "../../components/Dialogo.jsx";
import { ENDPOINTS, avisar, urlImagem, pedir, semServidor, json } from "../../lib/api.js";
import { confirmar } from "../../lib/ui.js";
import { EscolhaIcone, PreviaIcone, useEscolhaIcone } from "./EscolhaIcone.jsx";
import { BotaoSalvar, Cabecalho, Estado, Icone, IconeCategoria, ehImagem, norm } from "./comum.jsx";

const GRUPOS = {
  Temas: ["🐾", "🩺", "🩹", "💊", "🧠", "❤️", "📚", "💡", "⭐", "🎉", "📰", "❓"],
  "Dia a dia": ["🍖", "🥕", "🦴", "🎾", "🧸", "🛁", "✂️", "🦮", "🏃", "🌳", "🏠", "✈️"],
  Pets: ["🐶", "🐱", "🐦", "🐟", "🐰", "🐹", "🐢", "🦎"]
};
const CORES = ["#6F8BDA", "#E57373", "#4DB6AC", "#FFB74D", "#BA68C8", "#81C784", "#F06292", "#A1887F"];
const corValida = c => (/^#[0-9a-f]{6}$/i.test(c || "") ? c : "#6F8BDA");

export default function Blog({ ativo }) {
  const [categorias, setCategorias] = useState(null);
  const [posts, setPosts] = useState(null); // { id_categoria: total } (null = não deu pra contar)
  const [erro, setErro] = useState("");
  const [modal, setModal] = useState({ aberto: false, categoria: null });

  const carregar = useCallback(async () => {
    try {
      const [lista, todos] = await Promise.all([
        pedir(ENDPOINTS.categoriasBlog, {}, "Não foi possível carregar as categorias do blog."),
        // todos os posts (inclusive os removidos) para contar quantos tem em cada categoria
        pedir(`${ENDPOINTS.postsBlog}/admin/todos`, {}, "").catch(() => null)
      ]);
      setCategorias(lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
      setPosts(
        Array.isArray(todos)
          ? todos.reduce((acc, p) => ({ ...acc, [p.id_categoria]: (acc[p.id_categoria] || 0) + 1 }), {})
          : null
      );
      setErro("");
    } catch (err) {
      setErro(semServidor(err));
    }
  }, []);

  useEffect(() => {
    if (ativo && !categorias) carregar();
  }, [ativo, categorias, carregar]);

  const cats = categorias || [];

  return (
    <>
      <Cabecalho
        titulo="Blog"
        subtitulo="Categorias do blog: viram as abas do blog (no site e no app) e aparecem na hora de criar um post."
      >
        <Link className="ghost borda" to="/blog" target="_blank" rel="noopener">
          <Icone id="eye" />
          Ver blog
        </Link>
        <button type="button" className="btn" onClick={() => setModal({ aberto: true, categoria: null })}>
          <Icone id="plus" />
          Nova categoria
        </button>
      </Cabecalho>

      <Estado
        erro={erro}
        carregando={!categorias}
        aoTentar={carregar}
        vazio={!cats.length && <p>Nenhuma categoria do blog ainda.</p>}
      >
        <div className="cats">
          {cats.map(c => {
            const n = posts?.[c.id_categoria] || 0;
            return (
              <button
                type="button"
                className="cat"
                key={c.id_categoria}
                onClick={() => setModal({ aberto: true, categoria: c })}
              >
                <IconeCategoria icone={c.icone} />
                <span className="cat-txt">
                  <b>{c.nome}</b>
                  <small className="cat-cor">
                    <i style={{ background: corValida(c.cor) }} aria-hidden="true" />
                    {posts ? (n === 1 ? "1 post" : `${n} posts`) : corValida(c.cor).toUpperCase()}
                    {ehImagem(c.icone) ? " · imagem própria" : ""}
                  </small>
                </span>
                <Icone id="pen" className="cat-edit" />
              </button>
            );
          })}
        </div>
      </Estado>

      <ModalCategoriaBlog
        aberto={modal.aberto}
        categoria={modal.categoria}
        categorias={cats}
        totalPosts={modal.categoria ? posts?.[modal.categoria.id_categoria] || 0 : 0}
        aoFechar={() => setModal(m => ({ ...m, aberto: false }))}
        aoSalvo={carregar}
      />
    </>
  );
}

function ModalCategoriaBlog({ aberto, categoria, categorias, totalPosts, aoFechar, aoSalvo }) {
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(CORES[0]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const campoNome = useRef(null);
  const escolha = useEscolhaIcone(aberto, categoria?.icone);

  useEffect(() => {
    if (!aberto) return;
    setNome(categoria?.nome || "");
    setCor(categoria ? corValida(categoria.cor) : CORES[0]);
    setErro("");
  }, [aberto, categoria]);

  const corInicial = categoria ? corValida(categoria.cor).toUpperCase() : CORES[0];
  const cores = CORES.includes(corInicial) ? CORES : [corInicial, ...CORES];

  const falha = msg => {
    setErro(msg);
    campoNome.current.focus();
  };

  const salvar = async e => {
    e.preventDefault();
    const n = nome.trim();
    if (n.length < 2) return falha("Digite o nome da categoria.");
    if (categorias.some(c => norm(c.nome) === norm(n) && c.id_categoria !== categoria?.id_categoria))
      return falha("Já existe uma categoria do blog com esse nome.");

    const invalido = escolha.validar();
    if (invalido) return setErro(invalido);

    setSalvando(true);
    try {
      const dados = { nome: n, cor: cor.toUpperCase(), icone: await escolha.resolver() };
      if (categoria)
        await pedir(
          `${ENDPOINTS.categoriasBlog}/${categoria.id_categoria}`,
          json("PUT", dados),
          "Não foi possível salvar a categoria."
        );
      else await pedir(ENDPOINTS.categoriasBlog, json("POST", dados), "Não foi possível criar a categoria.");
      aoFechar();
      avisar(categoria ? "Categoria do blog atualizada!" : "Categoria criada! Já aparece no blog.");
      await aoSalvo();
    } catch (err) {
      setErro(semServidor(err));
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async () => {
    const c = categoria;
    if (!c) return;
    if (totalPosts > 0) {
      setErro("Essa categoria tem posts. Só dá para excluir uma categoria sem posts.");
      return;
    }
    const ok = await confirmar({
      titulo: "Excluir categoria do blog?",
      mensagem: `"${c.nome}" deixa de aparecer como aba no blog do site e do app.`,
      botao: "Excluir",
      tipo: "perigo"
    });
    if (!ok) return;
    setExcluindo(true);
    try {
      await pedir(
        `${ENDPOINTS.categoriasBlog}/${c.id_categoria}`,
        { method: "DELETE" },
        "Não foi possível excluir a categoria."
      );
      aoFechar();
      avisar("Categoria excluída.");
      await aoSalvo();
    } catch (err) {
      setErro(semServidor(err));
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <Dialogo
      id="categoriaBlogModal"
      aria-labelledby="categoriaBlogTitulo"
      aberto={aberto}
      aoFechar={aoFechar}
      aoAbrir={() => campoNome.current.focus()}
    >
      <form className="mform" noValidate onSubmit={salvar}>
        <header>
          <h2 id="categoriaBlogTitulo">{categoria ? "Editar categoria do blog" : "Nova categoria do blog"}</h2>
          <button type="button" className="x" data-close aria-label="Fechar">
            <Icone id="x" />
          </button>
        </header>
        <div className="cat-topo">
          <PreviaIcone escolha={escolha} estilo={{ background: `${cor}22` }} />
          <label className="f">
            Nome
            <input
              ref={campoNome}
              maxLength="50"
              required
              placeholder="Ex.: Saúde"
              value={nome}
              onChange={e => setNome(e.target.value)}
            />
          </label>
        </div>
        <EscolhaIcone escolha={escolha} grupos={GRUPOS} nome="iconeBlog" aoErro={setErro} />
        <fieldset className="grupo">
          <legend>Cor</legend>
          <div className="cores-grade">
            {cores.map(c => (
              <label className="cor" key={c}>
                <input
                  type="radio"
                  name="corBlog"
                  value={c}
                  checked={c.toUpperCase() === cor.toUpperCase()}
                  onChange={() => setCor(c)}
                />
                <span style={{ background: c }} aria-label={`Cor ${c}`} />
              </label>
            ))}
            <label className="cor outra" title="Outra cor">
              <input type="color" value={cor} onChange={e => setCor(e.target.value)} aria-label="Escolher outra cor" />
            </label>
          </div>
        </fieldset>
        <div className="previa-blog">
          <small>Como aparece no blog:</small>
          <span className="chip-blog" style={{ background: `${cor}22`, color: cor }}>
            {escolha.modo === "imagem"
              ? escolha.mostrar && (
                  <img className="chip-img" src={escolha.previa || urlImagem(escolha.imagemAtual)} alt="" />
                )
              : escolha.icone}{" "}
            {nome.trim() || "Nome da categoria"}
          </span>
        </div>
        <p className="err" role="alert">
          {erro}
        </p>
        <div className="act2">
          <button type="button" className="ghost perigo" hidden={!categoria} disabled={excluindo} onClick={excluir}>
            <Icone id="trash" />
            Excluir
          </button>
          <button type="button" className="ghost" data-close>
            Cancelar
          </button>
          <BotaoSalvar salvando={salvando} />
        </div>
      </form>
    </Dialogo>
  );
}
