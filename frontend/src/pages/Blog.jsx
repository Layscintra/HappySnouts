import { useCallback, useEffect, useRef, useState } from "react";
import Icone from "../components/Icone.jsx";
import Footer from "../components/layout/Footer.jsx";
import Header from "../components/layout/Header.jsx";
import {
  api,
  ENDPOINTS,
  lerErro,
  urlImagem,
  enviarImagem,
  exigirCliente,
  avisoLogin,
  clienteLogado,
  funcionarioLogado,
  dadosDoToken
} from "../lib/api.js";
import { confirmar } from "../lib/ui.js";

function IconeCategoria({ icone }) {
  const [erro, setErro] = useState(false);
  useEffect(() => setErro(false), [icone]);
  if (/^(\/uploads|https?:)/i.test(icone || "")) {
    return erro ? (
      "🐾"
    ) : (
      <img className="cat-img" src={urlImagem(icone)} alt="" loading="lazy" onError={() => setErro(true)} />
    );
  }
  return icone || "🐾";
}

function BlogIcones() {
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
      <symbol id="grid" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </symbol>
      <symbol id="bandage" viewBox="0 0 24 24">
        <rect x="1.5" y="8" width="21" height="8" rx="4" transform="rotate(-45 12 12)" />
        <rect x="8.5" y="8.5" width="7" height="7" rx="1" transform="rotate(-45 12 12)" />
        <path d="M11 11h.01M13 11h.01M11 13h.01M13 13h.01" />
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
      <symbol id="seta" viewBox="0 0 24 24">
        <path d="m6 9 6 6 6-6" />
      </symbol>
      <symbol id="check" viewBox="0 0 24 24">
        <path d="M20 6 9 17l-5-5" />
      </symbol>
      <symbol id="box" viewBox="0 0 24 24">
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="M3 8v9l9 5 9-5V8M12 13v9" />
      </symbol>
      <symbol id="chart" viewBox="0 0 24 24">
        <path d="M3 3v18h18" />
        <path d="m8 14 4-4 4 4 5-7" />
      </symbol>
    </svg>
  );
}

const norm = s =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
const hue = s => [...String(s)].reduce((a, c) => a + c.charCodeAt(0) * 7, 0) % 360;

// Mesmas regras do formulário do app e do backend.
const TITULO_MIN = 5,
  TITULO_MAX = 120,
  TEXTO_MIN = 30,
  TEXTO_MAX = 2000;
const COMENT_MAX = 1000;
const MSG_LOGIN = "Para publicar no blog, entre na sua conta ou crie uma.";
const MSG_LOGIN_CURTIR = "Para favoritar posts e comentários, entre na sua conta ou crie uma.";
const MSG_LOGIN_COMENTAR = "Para comentar, entre na sua conta ou crie uma.";

const TOPICOS = [
  ["racao,aliment,comedouro,petisco", "Ração e alimentação", 124],
  ["comport,acostum,agress,latid", "Comportamento", 98],
  ["vacina,saude,vermif,veterin", "Saúde e vacinas", 87],
  ["banho,tosa,pelo", "Banho e tosa", 64],
  ["adoc,lar temporario", "Adoção e lar temporário", 53]
];

const ago = ts => {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "agora mesmo";
  if (m < 60) return `${m} min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ${h > 1 ? "horas" : "hora"} atrás`;
  const d = Math.floor(h / 24);
  return `${d} ${d > 1 ? "dias" : "dia"} atrás`;
};

const normalizar = p => ({
  id: String(p.id_post),
  cat: Number(p.id_categoria),
  catNome: p.categoria_nome || "",
  catCor: p.categoria_cor || "#6F8BDA",
  catIcone: p.categoria_icone || "🐾",
  title: p.titulo || "",
  text: p.resumo || "",
  user: p.autor || "Equipe Happy Snouts",
  ts: Date.parse(p.data_publicacao) || Date.now(),
  img: urlImagem(p.imagem_capa_url),
  autorId: p.id_autor == null ? null : Number(p.id_autor),
  nComentarios: Number(p.total_comentarios) || 0,
  nCurtidas: Number(p.total_curtidas) || 0,
  curtido: Boolean(Number(p.curtido))
});

const meuId = () => (clienteLogado() ? Number(dadosDoToken()?.id) : null);
const podeComentar = () => clienteLogado() || funcionarioLogado();
const podePublicar = () => {
  if (podeComentar()) return true;
  avisoLogin(MSG_LOGIN);
  return false;
};
// Botão de coração com contador; a classe "pop" reinicia a animação a cada clique
function BotaoCurtir({ on, total, className = "like", rotulo, aoClicar }) {
  const [pop, setPop] = useState(0);
  return (
    <button
      key={pop}
      className={`${className}${on ? " on" : ""}${pop ? " pop" : ""}`}
      aria-pressed={on}
      aria-label={rotulo}
      onClick={async () => {
        if (await aoClicar()) setPop(n => n + 1);
      }}
    >
      <Icone id="heart" />
      <b>{Math.max(0, total)}</b>
    </button>
  );
}

function Comentario({ c, post, aoCurtir, aoExcluir }) {
  const nome = c.autor || "Equipe Happy Snouts";
  const foto = urlImagem(c.autor_foto);
  const podeApagar =
    funcionarioLogado() || (meuId() != null && (Number(c.id_autor) === meuId() || post.autorId === meuId()));
  return (
    <li data-cid={c.id_comentario}>
      {foto ? (
        <img className="av" src={foto} alt="" />
      ) : (
        <i className="av" style={{ "--h": hue(nome) }}>
          {nome[0].toUpperCase()}
        </i>
      )}
      <div className="cm-b">
        <div className="cm-h">
          <b>{nome}</b>
          <time>{ago(Date.parse(c.data_comentario) || Date.now())}</time>
          <BotaoCurtir
            className="like cm-like"
            on={Boolean(Number(c.curtido))}
            total={Number(c.total_curtidas) || 0}
            rotulo="Favoritar comentário"
            aoClicar={() => aoCurtir(c)}
          />
          {podeApagar && (
            <button className="kb" aria-label="Excluir comentário" onClick={() => aoExcluir(c)}>
              <Icone id="trash" />
            </button>
          )}
        </div>
        <p>{c.texto}</p>
      </div>
    </li>
  );
}

function PainelComentarios({ post, lista, aoEnviar, aoCurtir, aoExcluir }) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const area = useRef(null);

  useEffect(() => {
    if (lista !== undefined) area.current?.focus();
  }, [lista === undefined]); // eslint-disable-line

  const enviar = async e => {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    if (await aoEnviar(texto.trim())) setTexto("");
    setEnviando(false);
  };

  return (
    <section className="cm" aria-label="Comentários">
      {lista === undefined ? (
        <p className="cm-vazio">Carregando comentários…</p>
      ) : lista === null ? (
        <p className="cm-vazio">Não foi possível carregar os comentários.</p>
      ) : lista.length ? (
        <ul>
          {lista.map(c => (
            <Comentario key={c.id_comentario} c={c} post={post} aoCurtir={aoCurtir} aoExcluir={aoExcluir} />
          ))}
        </ul>
      ) : (
        <p className="cm-vazio">Ninguém comentou ainda. Seja o primeiro!</p>
      )}
      {podeComentar() ? (
        <form className="cm-f" onSubmit={enviar}>
          <textarea
            ref={area}
            name="texto"
            rows="1"
            maxLength={COMENT_MAX}
            placeholder="Escreva um comentário…"
            aria-label="Seu comentário"
            required
            value={texto}
            onChange={e => {
              setTexto(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.target.form.requestSubmit();
              }
            }}
          />
          <button className="btn" type="submit" disabled={enviando}>
            Comentar
          </button>
        </form>
      ) : (
        <button className="btn-sec btn cm-login" onClick={() => avisoLogin(MSG_LOGIN_COMENTAR)}>
          Entre na sua conta para comentar
        </button>
      )}
    </section>
  );
}

function Post({ p, aberto, comentarios, aoAlternarComentarios, aoCurtir, aoExcluir, acoesComentario }) {
  const [semImagem, setSemImagem] = useState(false);
  // A lista traz só o resumo (até 200 letras, termina em "…" quando foi cortado).
  // "Ler mais" busca o texto completo em GET /postBlog/:id, como o app faz.
  const [completo, setCompleto] = useState(null);
  const [expandido, setExpandido] = useState(false);
  const [lendo, setLendo] = useState(false);
  // resumo cortado pelo backend ("…"), ou que não coube nas 2 linhas do card
  const paragrafo = useRef(null);
  const [transborda, setTransborda] = useState(false);
  useEffect(() => {
    const el = paragrafo.current;
    if (!el || expandido) return;
    const medir = () => setTransborda(el.scrollHeight > el.clientHeight + 1);
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, [p.text, expandido]);
  const cortado = p.text.endsWith("…") || transborda;
  const lerMais = async () => {
    if (completo) return setExpandido(e => !e);
    setLendo(true);
    try {
      const resp = await api(`${ENDPOINTS.postsBlog}/${p.id}`);
      if (!resp.ok) throw new Error();
      const dados = await resp.json();
      setCompleto(dados.conteudo || p.text);
      setExpandido(true);
    } catch {
      setCompleto(null);
    } finally {
      setLendo(false);
    }
  };
  // o autor apaga o próprio post; o funcionário pode apagar qualquer um (igual ao backend)
  const own = funcionarioLogado() || (p.autorId != null && p.autorId === meuId());
  const temImagem = p.img && !semImagem;
  return (
    <article className={"post" + (temImagem ? "" : " no-img")} data-id={p.id}>
      {temImagem && (
        <div className="thumb">
          <img src={p.img} alt="" loading="lazy" onError={() => setSemImagem(true)} />
        </div>
      )}
      <div className="pb">
        <div className="ph">
          {p.catNome ? (
            <span className="chip" style={{ background: `${p.catCor}22`, color: p.catCor }}>
              <IconeCategoria icone={p.catIcone} /> {p.catNome}
            </span>
          ) : (
            <span />
          )}
          {own && (
            <button
              className="kb"
              aria-label={p.autorId === meuId() ? "Excluir meu post" : "Excluir post"}
              onClick={aoExcluir}
            >
              <Icone id="trash" />
            </button>
          )}
        </div>
        <h3>{p.title}</h3>
        <p ref={paragrafo} className={expandido ? "texto-completo" : undefined}>
          {expandido ? completo : p.text}
        </p>
        {cortado && (
          <button type="button" className="ler-mais" aria-expanded={expandido} disabled={lendo} onClick={lerMais}>
            {lendo ? "Carregando..." : expandido ? "Mostrar menos" : "Ler mais"}
          </button>
        )}
        <div className="pf">
          <span className="au">
            <i className="av" style={{ "--h": hue(p.user) }}>
              {p.user[0].toUpperCase()}
            </i>
            {p.user}
            <time>{ago(p.ts)}</time>
          </span>
          <span className="st">
            <button
              className={"cmt" + (aberto ? " on" : "")}
              aria-expanded={aberto}
              aria-label="Comentários"
              onClick={aoAlternarComentarios}
            >
              <Icone id="chat" />
              <b>{p.nComentarios}</b>
            </button>
            <BotaoCurtir on={p.curtido} total={p.nCurtidas} rotulo="Favoritar post" aoClicar={aoCurtir} />
          </span>
        </div>
      </div>
      {aberto && <PainelComentarios post={p} lista={comentarios} {...acoesComentario} />}
    </article>
  );
}

function SeletorCategoria({ categorias, atual, aoEscolher, botao }) {
  const caixa = useRef(null);
  const menu = useRef(null);
  const [aberto, setAberto] = useState(false);
  const escolhida = categorias.find(c => String(c.id) === atual);

  const fechar = useCallback(
    (focar = false) => {
      setAberto(false);
      if (focar) botao.current?.focus();
    },
    [botao]
  );

  useEffect(() => {
    if (!aberto) return;
    (menu.current.querySelector('[aria-checked="true"]') || menu.current.querySelector("button"))?.focus();
    const fora = e => {
      if (!caixa.current.contains(e.target)) fechar();
    };
    const teclas = e => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        fechar(true);
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const itens = [...menu.current.querySelectorAll("button")];
        const i = itens.indexOf(document.activeElement);
        itens[(i + (e.key === "ArrowDown" ? 1 : -1) + itens.length) % itens.length].focus();
      }
    };
    document.addEventListener("click", fora);
    document.addEventListener("keydown", teclas, true);
    return () => {
      document.removeEventListener("click", fora);
      document.removeEventListener("keydown", teclas, true);
    };
  }, [aberto, fechar]);

  return (
    <div className="catsel" ref={caixa}>
      <span className="catsel-rot" id="catRot">
        Categoria
      </span>
      <button
        ref={botao}
        type="button"
        className={`catsel-btn${escolhida ? " on" : ""}`}
        aria-haspopup="true"
        aria-expanded={aberto}
        aria-labelledby="catRot catVal"
        onClick={() => setAberto(a => !a)}
      >
        {escolhida ? (
          <span className="emo" aria-hidden="true">
            <IconeCategoria icone={escolhida.icone} />
          </span>
        ) : (
          <Icone id="paw" />
        )}
        <span id="catVal">{escolhida ? escolhida.nome : "Escolha a categoria"}</span>
        <svg className="i seta" aria-hidden="true">
          <use href="#seta" />
        </svg>
      </button>
      <div ref={menu} className="catsel-menu" role="menu" hidden={!aberto}>
        {categorias.map(c => (
          <button
            key={c.id}
            type="button"
            role="menuitemradio"
            aria-checked={String(c.id) === atual}
            onClick={() => {
              aoEscolher(String(c.id));
              fechar(true);
            }}
          >
            <span className="emo" aria-hidden="true">
              <IconeCategoria icone={c.icone} />
            </span>
            <span className="catsel-nome">{c.nome}</span>
            <Icone id="check" />
          </button>
        ))}
      </div>
    </div>
  );
}

function NovoPost({ aberto, categorias, aoFechar, aoPublicar }) {
  const dialogo = useRef(null);
  const form = useRef(null);
  const botaoCat = useRef(null);
  const [f, setF] = useState({ cat: "", title: "", text: "" });
  const [foto, setFoto] = useState(null);
  const [previa, setPrevia] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const d = dialogo.current;
    if (aberto && !d.open) {
      setErro("");
      d.showModal();
      form.current.elements.title.focus();
    }
    if (!aberto && d.open) d.close();
  }, [aberto]);

  const limpar = () => {
    setF({ cat: "", title: "", text: "" });
    setFoto(null);
    setPrevia("");
    setErro("");
  };

  const escolherFoto = e => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) {
      setErro("Escolha um arquivo de imagem.");
      return;
    }
    setFoto(arquivo);
    setPrevia(URL.createObjectURL(arquivo));
  };

  const publicar = async e => {
    e.preventDefault();
    if (!podePublicar()) {
      aoFechar();
      return;
    }
    const title = f.title.trim(),
      text = f.text.trim();
    const campos = form.current.elements;
    if (!f.cat) {
      setErro("Escolha a categoria.");
      botaoCat.current?.focus();
      return;
    }
    if (title.length < TITULO_MIN) {
      setErro(`Escreva um título com pelo menos ${TITULO_MIN} caracteres.`);
      campos.title.focus();
      return;
    }
    if (text.length < TEXTO_MIN) {
      setErro(`Escreva pelo menos ${TEXTO_MIN} caracteres.`);
      campos.text.focus();
      return;
    }

    setEnviando(true);
    setErro("");
    try {
      const imagem = foto ? await enviarImagem(foto) : null;
      const resp = await api(ENDPOINTS.postsBlog, {
        method: "POST",
        body: JSON.stringify({ id_categoria: Number(f.cat), titulo: title, conteudo: text, imagem_capa_url: imagem })
      });
      if (!resp.ok) throw new Error(await lerErro(resp, "Não foi possível publicar o post."));
    } catch (err) {
      setErro(err.message || "Não foi possível publicar o post.");
      setEnviando(false);
      return;
    }
    setEnviando(false);
    limpar();
    aoPublicar();
  };

  return (
    <dialog
      id="modal"
      aria-labelledby="mt"
      ref={dialogo}
      onClose={aoFechar}
      onClick={e => {
        if (e.target === dialogo.current) dialogo.current.close();
      }}
    >
      <form id="postForm" noValidate ref={form} onSubmit={publicar}>
        <header>
          <h2 id="mt">Novo post</h2>
          <button type="button" className="x" aria-label="Fechar" onClick={() => dialogo.current.close()}>
            <Icone id="x" />
          </button>
        </header>
        <p className="hint">Conte sua dica, dúvida ou experiência para ajudar outros tutores.</p>
        <label className="cover" id="coverBox">
          <input type="file" name="photo" accept="image/*" onChange={escolherFoto} />{" "}
          <img id="coverPreview" alt="" hidden={!previa} src={previa || undefined} />{" "}
          <span id="coverEmpty" hidden={Boolean(previa)}>
            <Icone id="paw" /> Foto de capa (opcional)
          </span>
        </label>
        <SeletorCategoria
          categorias={categorias}
          atual={f.cat}
          botao={botaoCat}
          aoEscolher={cat => setF(v => ({ ...v, cat }))}
        />
        <label className="f">
          Título{" "}
          <input
            name="title"
            maxLength={TITULO_MAX}
            required
            placeholder="Ex.: Como ensinei meu cão a passear sem puxar"
            value={f.title}
            onChange={e => setF({ ...f, title: e.target.value })}
          />{" "}
          <small id="cntTitle">
            {f.title.length}/{TITULO_MAX}
          </small>
        </label>{" "}
        <label className="f">
          Texto
          <textarea
            name="text"
            rows="6"
            maxLength={TEXTO_MAX}
            required
            placeholder="Descreva com detalhes para a comunidade te ajudar melhor."
            value={f.text}
            onChange={e => setF({ ...f, text: e.target.value })}
          />
          <small id="cnt">
            {f.text.length}/{TEXTO_MAX}
          </small>
        </label>
        <p className="note">
          Seja gentil e evite orientações médicas: em caso de doença, o veterinário é sempre o melhor caminho.
        </p>
        <p className="err" id="err" role="alert">
          {erro}
        </p>
        <div className="act">
          <button type="button" className="ghost" onClick={() => dialogo.current.close()}>
            Cancelar
          </button>{" "}
          <button type="submit" className="btn" disabled={enviando}>
            Publicar
          </button>
        </div>
      </form>
    </dialog>
  );
}

export default function Blog() {
  const [categorias, setCategorias] = useState([]);
  const [posts, setPosts] = useState(null);
  const [erroPosts, setErroPosts] = useState(false);
  const [filtro, setFiltro] = useState({ cat: "all", q: "", topic: null, fav: false });
  const [abertos, setAbertos] = useState(new Set());
  const [comentarios, setComentarios] = useState({});
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState({ texto: "", on: false });
  const toastTimer = useRef(null);
  const lista = useRef(null);

  const avisar = texto => {
    setToast({ texto, on: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, on: false })), 2600);
  };

  const [busca, setBusca] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setBusca(filtro.q.trim()), 350);
    return () => clearTimeout(t);
  }, [filtro.q]);

  // Categoria, busca e curtidos são filtrados no backend (igual ao app), então
  // os filtros enxergam todos os posts, e não só os 50 primeiros.
  const ultimaBusca = useRef(0);
  const carregarPosts = useCallback(async () => {
    const pedido = ++ultimaBusca.current;
    const params = new URLSearchParams({ limite: "50" });
    if (filtro.cat !== "all") params.set("categoria", String(filtro.cat));
    if (busca) params.set("busca", busca);
    if (filtro.fav) params.set("curtidos", "1");
    try {
      const resp = await api(`${ENDPOINTS.postsBlog}?${params}`);
      if (!resp.ok) throw new Error();
      const lista = (await resp.json()).map(normalizar);
      if (pedido !== ultimaBusca.current) return; // chegou depois de uma busca mais nova
      setPosts(lista);
      setErroPosts(false);
    } catch {
      if (pedido === ultimaBusca.current) setErroPosts(true);
    }
  }, [filtro.cat, filtro.fav, busca]);

  useEffect(() => {
    carregarPosts();
  }, [carregarPosts]);

  useEffect(() => {
    (async () => {
      try {
        const resp = await api(ENDPOINTS.categoriasBlog);
        if (!resp.ok) throw new Error();
        setCategorias(
          (await resp.json())
            .map(c => ({ id: Number(c.id_categoria), nome: c.nome, cor: c.cor, icone: c.icone || "🐾" }))
            .sort((a, b) => a.nome.localeCompare(b.nome))
        );
      } catch {
        setCategorias([]);
      }
    })();
  }, []);

  const mudarPost = (id, fn) => setPosts(ps => ps.map(p => (p.id === id ? { ...p, ...fn(p) } : p)));

  async function curtir(caminho, on) {
    try {
      const resp = await api(caminho, { method: on ? "POST" : "DELETE" });
      if (!resp.ok) throw new Error(await lerErro(resp, "Não foi possível favoritar."));
      return await resp.json();
    } catch (erro) {
      avisar(erro.message || "Não foi possível favoritar.");
      return null;
    }
  }

  const curtirPost = async p => {
    if (!exigirCliente(MSG_LOGIN_CURTIR)) return false;
    const on = !p.curtido;
    mudarPost(p.id, x => ({ curtido: on, nCurtidas: x.nCurtidas + (on ? 1 : -1) }));
    const r = await curtir(`${ENDPOINTS.postsBlog}/${p.id}/curtir`, on);
    if (!r) {
      mudarPost(p.id, x => ({ curtido: !on, nCurtidas: x.nCurtidas + (on ? -1 : 1) }));
      return false;
    }
    mudarPost(p.id, () => ({ nCurtidas: r.total_curtidas }));
    return true;
  };

  const excluirPost = async p => {
    const ok = await confirmar({
      titulo: "Excluir este post?",
      mensagem: "O post e os comentários dele somem do blog. Essa ação não pode ser desfeita.",
      botao: "Excluir post",
      tipo: "perigo"
    });
    if (!ok) return;
    const resp = await api(`${ENDPOINTS.postsBlog}/${p.id}`, { method: "DELETE" });
    if (!resp.ok) {
      avisar(await lerErro(resp, "Não foi possível excluir o post."));
      return;
    }
    setPosts(ps => ps.filter(x => x.id !== p.id));
    avisar("Post excluído");
  };

  // comentários (qualquer pessoa logada comenta em qualquer post)
  async function carregarComentarios(id) {
    let resultado;
    try {
      const resp = await api(`${ENDPOINTS.postsBlog}/${id}/comentarios`);
      if (!resp.ok) throw new Error();
      resultado = await resp.json();
    } catch {
      resultado = null;
    }
    setComentarios(c => ({ ...c, [id]: resultado }));
    if (Array.isArray(resultado)) mudarPost(id, () => ({ nComentarios: resultado.length }));
  }

  const alternarComentarios = id => {
    const novo = new Set(abertos);
    if (novo.has(id)) novo.delete(id);
    else {
      novo.add(id);
      carregarComentarios(id);
    }
    setAbertos(novo);
  };

  const acoesComentario = p => ({
    aoEnviar: async texto => {
      if (!podeComentar()) {
        avisoLogin(MSG_LOGIN_COMENTAR);
        return false;
      }
      const resp = await api(`${ENDPOINTS.postsBlog}/${p.id}/comentarios`, {
        method: "POST",
        body: JSON.stringify({ texto })
      });
      if (!resp.ok) {
        avisar(await lerErro(resp, "Não foi possível comentar."));
        return false;
      }
      avisar("Comentário publicado!");
      await carregarComentarios(p.id);
      return true;
    },
    aoExcluir: async c => {
      const ok = await confirmar({
        titulo: "Excluir este comentário?",
        mensagem: "Essa ação não pode ser desfeita.",
        botao: "Excluir",
        tipo: "perigo"
      });
      if (!ok) return;
      const resp = await api(`${ENDPOINTS.postsBlog}/${p.id}/comentarios/${c.id_comentario}`, { method: "DELETE" });
      if (!resp.ok) {
        avisar(await lerErro(resp, "Não foi possível excluir o comentário."));
        return;
      }
      avisar("Comentário excluído");
      await carregarComentarios(p.id);
    },
    aoCurtir: async c => {
      if (!exigirCliente(MSG_LOGIN_CURTIR)) return false;
      const on = !Number(c.curtido);
      const mudar = fn =>
        setComentarios(todos => ({
          ...todos,
          [p.id]: todos[p.id].map(x => (x.id_comentario === c.id_comentario ? { ...x, ...fn(x) } : x))
        }));
      mudar(x => ({ curtido: on, total_curtidas: Number(x.total_curtidas) + (on ? 1 : -1) }));
      const r = await curtir(`${ENDPOINTS.postsBlog}/${p.id}/comentarios/${c.id_comentario}/curtir`, on);
      if (!r) {
        mudar(x => ({ curtido: !on, total_curtidas: Number(x.total_curtidas) + (on ? -1 : 1) }));
        return false;
      }
      mudar(() => ({ total_curtidas: r.total_curtidas }));
      return true;
    }
  });

  // filtros
  // Categoria, busca e curtidos já vêm filtrados do backend. Aqui ficam só os
  // tópicos em alta e o ajuste na hora (ex.: descurtir com o filtro de curtidos ligado).
  const chaves = filtro.topic ? filtro.topic.split(",") : null;
  const visiveis = (posts || []).filter(p => {
    const txt = norm(p.title + " " + p.text);
    return (
      (filtro.cat === "all" || p.cat === Number(filtro.cat)) &&
      (!chaves || chaves.some(k => txt.includes(k))) &&
      (!filtro.fav || p.curtido)
    );
  });

  const alternarFavoritos = () => {
    if (!filtro.fav && !exigirCliente(MSG_LOGIN_CURTIR)) return;
    setFiltro(f => ({ ...f, fav: !f.fav }));
  };

  const novoPost = () => {
    if (!podePublicar()) return;
    setModal(true);
  };

  const aoPublicar = async () => {
    setFiltro({ cat: "all", q: "", topic: null, fav: false });
    setModal(false);
    avisar("Post publicado!");
    await carregarPosts();
    lista.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <BlogIcones />
      <Header
        atual="blog"
        busca={{ valor: filtro.q, rotulo: "Buscar posts", aoMudar: v => setFiltro(f => ({ ...f, q: v })) }}
      />

      <main className="wrap hs-container">
        <section className="hero">
          <h1 className="sr">Blog Happy Snouts – tire suas dúvidas, compartilhe experiências e ajude outros tutores</h1>
          <img src="img/bannerblog.jpeg" alt="Banner do Blog Happy Snouts com um cachorro e um gato" />
        </section>

        <div className="bar" aria-label="Ações e filtros do blog">
          <div className="bar-actions">
            <button className="btn btn-sec" type="button" onClick={novoPost}>
              <Icone id="pen" /> Criar post
            </button>{" "}
            <button
              className="btn btn-sec"
              id="favBtn"
              type="button"
              aria-pressed={filtro.fav}
              onClick={alternarFavoritos}
            >
              <Icone id="heart" /> Meus favoritos
            </button>
          </div>
          <span className="bar-sep" aria-hidden="true" />
          <div className="tabs" id="tabs" role="tablist" aria-label="Categorias de posts">
            {[{ id: "all", nome: "Todos" }, ...categorias].map(c => {
              const on = String(filtro.cat) === String(c.id);
              return (
                <button
                  key={c.id}
                  className={"tab" + (on ? " on" : "")}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setFiltro(f => ({ ...f, cat: String(c.id) }))}
                >
                  {c.id === "all" ? (
                    <>
                      <Icone id="grid" />{" "}
                    </>
                  ) : (
                    <span aria-hidden="true">
                      <IconeCategoria icone={c.icone} />
                    </span>
                  )}
                  {c.nome}
                </button>
              );
            })}
          </div>
        </div>

        <div className="cols">
          <section className="panel" aria-label="Posts da comunidade">
            <div id="list" className="list" aria-live="polite" ref={lista}>
              {erroPosts ? (
                <p className="empty">Não foi possível carregar os posts. Tente novamente mais tarde.</p>
              ) : !posts ? null : visiveis.length ? (
                visiveis.map(p => (
                  <Post
                    key={p.id}
                    p={p}
                    aberto={abertos.has(p.id)}
                    comentarios={comentarios[p.id]}
                    aoAlternarComentarios={() => alternarComentarios(p.id)}
                    aoCurtir={() => curtirPost(p)}
                    aoExcluir={() => excluirPost(p)}
                    acoesComentario={acoesComentario(p)}
                  />
                ))
              ) : (
                <p className="empty">
                  {filtro.fav
                    ? "Você ainda não favoritou nenhum post."
                    : "Nenhum post encontrado. Que tal criar o primeiro?"}
                </p>
              )}
            </div>
          </section>

          <aside className="side">
            <div className="card">
              <h2>
                <Icone id="paw" /> Tópicos populares
              </h2>
              <ul className="topics">
                {TOPICOS.map(([chaves, nome, total], i) => (
                  <li key={chaves}>
                    <button
                      type="button"
                      className={filtro.topic === chaves ? "on" : undefined}
                      onClick={() => setFiltro(f => ({ ...f, topic: f.topic === chaves ? null : chaves }))}
                    >
                      <b>{i + 1}</b>{" "}
                      <span>
                        {nome}
                        <small>({total} posts)</small>
                      </span>{" "}
                      <Icone id="chev" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>

      <Footer />

      <NovoPost aberto={modal} categorias={categorias} aoFechar={() => setModal(false)} aoPublicar={aoPublicar} />
      <div id="toast" role="status" aria-live="polite" className={toast.on ? "show" : undefined}>
        {toast.texto}
      </div>
    </>
  );
}
