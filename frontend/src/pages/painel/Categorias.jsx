import { useEffect, useRef, useState } from "react";
import Dialogo from "../../components/Dialogo.jsx";
import { ENDPOINTS, avisar, pedir, semServidor, json } from "../../lib/api.js";
import { confirmar } from "../../lib/ui.js";
import { EscolhaIcone, PreviaIcone, useEscolhaIcone } from "./EscolhaIcone.jsx";
import { BotaoSalvar, Cabecalho, Estado, Icone, IconeCategoria, ehImagem, norm } from "./comum.jsx";

const GRUPOS = {
  Pets: ["🐾", "🐶", "🐱", "🐕", "🐈", "🐩", "🐦", "🦜", "🐟", "🐠", "🐢", "🐰", "🐹", "🦎"],
  Alimentação: ["🍖", "🦴", "🥩", "🍗", "🥕", "🍎", "🥣", "🍽️", "💧", "🥫"],
  Brinquedos: ["🎾", "🧸", "🪀", "⚽", "🥏", "🎀", "🧶"],
  Cuidados: ["🛁", "🧴", "🧼", "✂️", "🪮", "💊", "💉", "🩺", "🩹", "🌡️"],
  "Casa e passeio": ["🏠", "🛏️", "🧺", "🦮", "🎒", "🧥", "🚗", "🧳", "🌳"],
  Tecnologia: ["📱", "📡", "🔋", "⌚", "📍", "💡", "🔔", "⚙️"],
  Outros: ["⭐", "❤️", "🎁", "🏷️", "✨", "🆕", "🛒", "📦", "➕"]
};

export default function Categorias({ categorias, produtos, erro, recarregar, novaAoAbrir, aoConsumirNova }) {
  const [modal, setModal] = useState({ aberto: false, categoria: null });
  const cats = categorias || [];
  const lista = produtos || [];

  // "Novo produto" sem categoria manda para cá já com o pop-up aberto
  useEffect(() => {
    if (novaAoAbrir) {
      setModal({ aberto: true, categoria: null });
      aoConsumirNova();
    }
  }, [novaAoAbrir, aoConsumirNova]);

  return (
    <>
      <Cabecalho
        titulo="Categorias"
        subtitulo="As categorias aparecem como filtros na loja. Só dá para excluir uma categoria sem produtos."
      >
        <button type="button" className="btn" onClick={() => setModal({ aberto: true, categoria: null })}>
          <Icone id="plus" />
          Nova categoria
        </button>
      </Cabecalho>

      <Estado
        erro={erro}
        carregando={!categorias}
        aoTentar={recarregar}
        vazio={!cats.length && <p>Nenhuma categoria ainda. Crie a primeira para poder cadastrar produtos.</p>}
      >
        <div className="cats">
          {cats.map(c => {
            const n = lista.filter(p => p.idCategoria === c.id_categoria).length;
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
                  <small>
                    {n === 1 ? "1 produto" : `${n} produtos`}
                    {ehImagem(c.icone) ? " · imagem própria" : ""}
                  </small>
                </span>
                <Icone id="pen" className="cat-edit" />
              </button>
            );
          })}
        </div>
      </Estado>

      <ModalCategoria
        aberto={modal.aberto}
        categoria={modal.categoria}
        categorias={cats}
        produtos={lista}
        aoFechar={() => setModal(m => ({ ...m, aberto: false }))}
        aoSalvo={recarregar}
      />
    </>
  );
}

function ModalCategoria({ aberto, categoria, categorias, produtos, aoFechar, aoSalvo }) {
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const campoNome = useRef(null);
  const escolha = useEscolhaIcone(aberto, categoria?.icone);

  useEffect(() => {
    if (!aberto) return;
    setNome(categoria?.nome || "");
    setErro("");
  }, [aberto, categoria]);

  const salvar = async e => {
    e.preventDefault();
    const n = nome.trim();
    if (n.length < 2) {
      setErro("Digite o nome da categoria.");
      return campoNome.current.focus();
    }
    if (categorias.some(c => norm(c.nome) === norm(n) && c.id_categoria !== categoria?.id_categoria)) {
      setErro("Já existe uma categoria com esse nome.");
      return campoNome.current.focus();
    }
    const invalido = escolha.validar();
    if (invalido) return setErro(invalido);

    setSalvando(true);
    try {
      const dados = { nome: n, icone: await escolha.resolver() };
      if (categoria)
        await pedir(
          `${ENDPOINTS.categoriasProduto}/${categoria.id_categoria}`,
          json("PUT", dados),
          "Não foi possível salvar a categoria."
        );
      else await pedir(ENDPOINTS.categoriasProduto, json("POST", dados), "Não foi possível criar a categoria.");
      aoFechar();
      avisar(categoria ? "Categoria atualizada!" : "Categoria criada!");
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
    if (produtos.some(p => p.idCategoria === c.id_categoria)) {
      setErro("Essa categoria tem produtos (inclusive desativados). Mude a categoria deles antes de excluir.");
      return;
    }
    const ok = await confirmar({
      titulo: "Excluir categoria?",
      mensagem: `"${c.nome}" deixa de aparecer na loja.`,
      botao: "Excluir",
      tipo: "perigo"
    });
    if (!ok) return;
    setExcluindo(true);
    try {
      await pedir(
        `${ENDPOINTS.categoriasProduto}/${c.id_categoria}`,
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
      id="categoriaModal"
      aria-labelledby="categoriaTitulo"
      aberto={aberto}
      aoFechar={aoFechar}
      aoAbrir={() => campoNome.current.focus()}
    >
      <form className="mform" noValidate onSubmit={salvar}>
        <header>
          <h2 id="categoriaTitulo">{categoria ? "Editar categoria" : "Nova categoria"}</h2>
          <button type="button" className="x" data-close aria-label="Fechar">
            <Icone id="x" />
          </button>
        </header>

        <div className="cat-topo">
          <PreviaIcone escolha={escolha} />
          <label className="f">
            Nome
            <input
              ref={campoNome}
              maxLength="50"
              required
              placeholder="Ex.: Brinquedos"
              value={nome}
              onChange={e => setNome(e.target.value)}
            />
          </label>
        </div>

        <EscolhaIcone escolha={escolha} grupos={GRUPOS} nome="icone" aoErro={setErro} />

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
