// O DELETE do backend só desativa o produto.

import { useEffect, useRef, useState } from "react";
import Dialogo from "../../components/Dialogo.jsx";
import {
  ENDPOINTS,
  avisar,
  enviarImagem,
  formatarPreco,
  reduzirImagem,
  urlImagem,
  pedir,
  semServidor,
  json
} from "../../lib/api.js";
import { confirmar } from "../../lib/ui.js";
import { BotaoSalvar, Cabecalho, Estado, Foto, Icone, IconeCategoria, Selo, emoji, inteiro, norm } from "./comum.jsx";

export default function Produtos({ produtos, categorias, erro, recarregar, semCategorias }) {
  const [filtro, setFiltro] = useState({ q: "", cat: "", status: "" });
  const [modal, setModal] = useState({ aberto: false, produto: null });

  const cats = categorias || [];
  const lista = produtos || [];
  const categoria = id => cats.find(c => c.id_categoria === Number(id));
  const filtroCat = cats.some(c => String(c.id_categoria) === filtro.cat) ? filtro.cat : "";

  const q = norm(filtro.q.trim());
  const visiveis = lista
    .filter(
      p =>
        (!q || norm(p.nome).includes(q) || String(p.id) === q) &&
        (!filtroCat || String(p.idCategoria) === filtroCat) &&
        (!filtro.status || String(Number(p.ativo)) === filtro.status)
    )
    .sort((a, b) => Number(b.ativo) - Number(a.ativo) || b.id - a.id);

  const abrir = p => {
    if (!cats.length) {
      avisar("Cadastre uma categoria antes do primeiro produto.", "erro");
      semCategorias();
      return;
    }
    setModal({ aberto: true, produto: p || null });
  };

  return (
    <>
      <Cabecalho titulo="Produtos" subtitulo="Catálogo completo da loja, incluindo os produtos desativados.">
        <button type="button" className="btn" onClick={() => abrir()}>
          <Icone id="plus" />
          Novo produto
        </button>
      </Cabecalho>

      <div className="metricas metricas-4">
        {[
          ["Produtos", lista.length],
          ["Ativos na loja", lista.filter(p => p.ativo).length],
          ["Desativados", lista.filter(p => !p.ativo).length],
          ["Em promoção", lista.filter(p => p.ativo && p.de).length]
        ].map(([rotulo, n]) => (
          <div className="metrica simples" key={rotulo}>
            <div>
              <b>{inteiro(n)}</b>
              <span>{rotulo}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="painel-card">
        <div className="barra">
          <label className="busca">
            <Icone id="search" />
            <input
              type="search"
              placeholder="Buscar pelo nome ou número"
              aria-label="Buscar produto"
              value={filtro.q}
              onChange={e => setFiltro({ ...filtro, q: e.target.value })}
            />
          </label>
          <select
            aria-label="Filtrar por categoria"
            value={filtroCat}
            onChange={e => setFiltro({ ...filtro, cat: e.target.value })}
          >
            <option value="">Todas as categorias</option>
            {cats.map(c => (
              <option key={c.id_categoria} value={c.id_categoria}>{`${emoji(c.icone)} ${c.nome}`}</option>
            ))}
          </select>
          <select
            aria-label="Filtrar por situação"
            value={filtro.status}
            onChange={e => setFiltro({ ...filtro, status: e.target.value })}
          >
            <option value="">Ativos e desativados</option>
            <option value="1">Só ativos</option>
            <option value="0">Só desativados</option>
          </select>
        </div>

        <Estado
          erro={erro}
          carregando={!produtos}
          aoTentar={recarregar}
          vazio={
            !visiveis.length &&
            (lista.length ? (
              "Nenhum produto com esses filtros."
            ) : (
              <>
                Nenhum produto cadastrado ainda. Clique em <b>Novo produto</b> para começar.
              </>
            ))
          }
        >
          <div className="tabela tabela-produtos" role="table" aria-label="Produtos">
            <div className="cab" role="row">
              <span role="columnheader" />
              <span role="columnheader">Produto</span>
              <span role="columnheader">Categoria</span>
              <span role="columnheader">Preço</span>
              <span role="columnheader">Situação</span>
            </div>
            {visiveis.map(p => {
              const c = categoria(p.idCategoria);
              return (
                <button
                  type="button"
                  role="row"
                  key={p.id}
                  className={"linha" + (p.ativo ? "" : " off")}
                  onClick={() => abrir(p)}
                >
                  <span role="cell" className="foto">
                    <Foto src={p.imagem} />
                  </span>
                  <span role="cell" className="c-prod">
                    <b>{p.nome}</b>
                    <small>#{p.id}</small>
                  </span>
                  <span role="cell" className="c-cat">
                    {c && <IconeCategoria icone={c.icone} className="mini" />}
                    {p.categoria || c?.nome || "Sem categoria"}
                  </span>
                  <span role="cell" className="c-preco">
                    {p.de && <s>{formatarPreco(p.de)}</s>}
                    <b>{formatarPreco(p.preco)}</b>
                  </span>
                  <span role="cell" className="c-st">
                    <Selo tom={p.ativo ? "verde" : "cinza"}>{p.ativo ? "Ativo" : "Desativado"}</Selo>
                  </span>
                </button>
              );
            })}
          </div>
        </Estado>
      </div>

      <ModalProduto
        aberto={modal.aberto}
        produto={modal.produto}
        categorias={cats}
        aoFechar={() => setModal(m => ({ ...m, aberto: false }))}
        aoSalvo={recarregar}
      />
    </>
  );
}

const PRODUTO_VAZIO = { nome: "", descricao: "", preco: "", preco_promocional: "", id_categoria: "" };

function ModalProduto({ aberto, produto, categorias, aoFechar, aoSalvo }) {
  const [f, setF] = useState(PRODUTO_VAZIO);
  const [imagemNova, setImagemNova] = useState(null);
  const [previa, setPrevia] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [desativando, setDesativando] = useState(false);
  const form = useRef(null);
  const arquivo = useRef(null);
  const botaoFoto = useRef(null);
  const imagemAtual = produto?.bruto.imagem_url || "";

  useEffect(() => {
    if (!aberto) return;
    const b = produto?.bruto;
    setF(
      b
        ? {
            nome: b.nome,
            descricao: b.descricao || "",
            preco: Number(b.preco),
            preco_promocional: b.preco_promocional != null ? Number(b.preco_promocional) : "",
            id_categoria: b.id_categoria ?? ""
          }
        : PRODUTO_VAZIO
    );
    setImagemNova(null);
    setPrevia(urlImagem(b?.imagem_url || ""));
    setErro("");
  }, [aberto, produto]);

  const falha = (msg, campo) => {
    setErro(msg);
    (typeof campo === "string" ? form.current.elements[campo] : campo?.current)?.focus();
  };

  const escolherImagem = async e => {
    const escolhido = e.target.files[0];
    e.target.value = "";
    if (!escolhido) return;
    try {
      const reduzida = await reduzirImagem(escolhido, { lado: 900 });
      setImagemNova(reduzida);
      setPrevia(URL.createObjectURL(reduzida));
      setErro("");
    } catch (err) {
      falha(err.message);
    }
  };

  const salvar = async e => {
    e.preventDefault();
    const nome = f.nome.trim(),
      descricao = f.descricao.trim();
    const preco = Number(f.preco);
    const promo = f.preco_promocional === "" ? null : Number(f.preco_promocional);
    const idCategoria = Number(f.id_categoria);

    if (!imagemNova && !imagemAtual) return falha("Escolha uma imagem para o produto.", botaoFoto);
    if (nome.length < 3) return falha("Digite o nome do produto.", "nome");
    if (descricao.length < 10) return falha("Escreva uma descrição (pelo menos 10 letras).", "descricao");
    if (!(preco > 0)) return falha("Informe um preço maior que zero.", "preco");
    // o carrinho cobra o preço promocional sempre que ele existe, então ele precisa ser menor
    if (promo != null && !(promo > 0 && promo < preco)) {
      return falha(
        "O preço promocional precisa ser menor que o preço normal (ou deixe em branco).",
        "preco_promocional"
      );
    }
    if (!idCategoria) return falha("Escolha a categoria.", "id_categoria");

    setSalvando(true);
    try {
      const imagem_url = imagemNova ? await enviarImagem(imagemNova) : imagemAtual;
      const dados = {
        nome,
        descricao,
        preco: Number(preco.toFixed(2)),
        preco_promocional: promo != null ? Number(promo.toFixed(2)) : null,
        id_categoria: idCategoria,
        imagem_url
      };
      if (produto)
        await pedir(`${ENDPOINTS.produtos}/${produto.id}`, json("PUT", dados), "Não foi possível salvar o produto.");
      else await pedir(ENDPOINTS.produtos, json("POST", dados), "Não foi possível cadastrar o produto.");
      aoFechar();
      avisar(produto ? "Produto atualizado!" : "Produto cadastrado! Já aparece na loja.");
      await aoSalvo();
    } catch (err) {
      falha(semServidor(err));
    } finally {
      setSalvando(false);
    }
  };

  const desativar = async () => {
    const p = produto;
    if (!p) return;
    const ok = await confirmar({
      titulo: `Desativar "${p.nome}"?`,
      mensagem: "Ele some da loja e não pode mais ser comprado. Hoje o sistema não tem como reativar pelo painel.",
      botao: "Desativar",
      tipo: "perigo"
    });
    if (!ok) return;
    setDesativando(true);
    try {
      await pedir(`${ENDPOINTS.produtos}/${p.id}`, { method: "DELETE" }, "Não foi possível desativar o produto.");
      aoFechar();
      avisar("Produto desativado.");
      await aoSalvo();
    } catch (err) {
      falha(semServidor(err));
    } finally {
      setDesativando(false);
    }
  };

  const mudar = nome => e => setF({ ...f, [nome]: e.target.value });

  return (
    <Dialogo
      id="produtoModal"
      aria-labelledby="produtoTitulo"
      aberto={aberto}
      aoFechar={aoFechar}
      aoAbrir={d => d.querySelector('[name="nome"]').focus()}
    >
      <form className="mform" noValidate ref={form} onSubmit={salvar}>
        <header>
          <h2 id="produtoTitulo">{produto ? "Editar produto" : "Novo produto"}</h2>
          <button type="button" className="x" data-close aria-label="Fechar">
            <Icone id="x" />
          </button>
        </header>

        <div className="foto-campo">
          <div className="foto grande">
            <Foto src={previa} />
          </div>
          <div>
            <button type="button" className="ghost borda" ref={botaoFoto} onClick={() => arquivo.current.click()}>
              <Icone id="camera" />
              Escolher imagem
            </button>
            <small>Obrigatória. JPG, PNG ou WEBP. Fundo claro fica melhor na loja.</small>
          </div>
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden ref={arquivo} onChange={escolherImagem} />
        </div>

        <label className="f">
          Nome do produto
          <input
            name="nome"
            maxLength="150"
            required
            placeholder="Ex.: Ração Premium Cães Adultos 10kg"
            value={f.nome}
            onChange={mudar("nome")}
          />
        </label>
        <label className="f">
          Descrição
          <textarea
            name="descricao"
            rows="4"
            required
            placeholder="O que é, para qual pet, tamanho, material..."
            value={f.descricao}
            onChange={mudar("descricao")}
          />
        </label>
        <div className="dupla">
          <label className="f">
            Preço (R$)
            <input
              name="preco"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              required
              placeholder="0,00"
              value={f.preco}
              onChange={mudar("preco")}
            />
          </label>
          <label className="f">
            Preço promocional (R$)
            <input
              name="preco_promocional"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              placeholder="Opcional"
              value={f.preco_promocional}
              onChange={mudar("preco_promocional")}
            />
          </label>
        </div>
        <label className="f">
          Categoria
          <select name="id_categoria" required value={f.id_categoria} onChange={mudar("id_categoria")}>
            <option value="">Escolha a categoria</option>
            {categorias.map(c => (
              <option key={c.id_categoria} value={c.id_categoria}>{`${emoji(c.icone)} ${c.nome}`}</option>
            ))}
          </select>
        </label>
        {produto && !produto.ativo && (
          <p className="nota">Este produto está desativado: não aparece na loja e não pode ir para o carrinho.</p>
        )}
        <p className="err" role="alert">
          {erro}
        </p>
        <div className="act2">
          <button
            type="button"
            className="ghost perigo"
            hidden={!produto || !produto.ativo}
            disabled={desativando}
            onClick={desativar}
          >
            <Icone id="off" />
            Desativar
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
