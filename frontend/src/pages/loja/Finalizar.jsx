import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import Icone from "../../components/Icone.jsx";
import Footer from "../../components/layout/Footer.jsx";
import Header from "../../components/layout/Header.jsx";
import {
  API_URL,
  ENDPOINTS,
  clienteLogado,
  dadosDoToken,
  urlImagem,
  formatarPreco,
  avisar,
  atualizarContadorCarrinho,
  pedir,
  semServidor,
  json
} from "../../lib/api.js";
import { cuponsDisponiveis, descontoDoCupom, validarCupom } from "../../lib/cupons.js";

function FinalizarIcones() {
  return (
    <>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <symbol id="back" viewBox="0 0 24 24">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </symbol>
        <symbol id="plus" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" />
        </symbol>
        <symbol id="truck" viewBox="0 0 24 24">
          <path d="M1 4h14v12H1zM15 9h4l4 4v3h-8z" />
          <circle cx="6" cy="18.5" r="2" />
          <circle cx="18" cy="18.5" r="2" />
        </symbol>
        <symbol id="bolt" viewBox="0 0 24 24">
          <path d="M13 2 3 14h9l-1 8 10-12h-9z" />
        </symbol>
        <symbol id="pix" viewBox="0 0 24 24">
          <path d="M12 2.5 21.5 12 12 21.5 2.5 12z" />
          <path d="M7.5 12 12 7.5l4.5 4.5L12 16.5z" />
        </symbol>
        <symbol id="card" viewBox="0 0 24 24">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20M6 15h4" />
        </symbol>
        <symbol id="doc" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M8 13h8M8 17h8" />
        </symbol>
        <symbol id="lock" viewBox="0 0 24 24">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </symbol>
        <symbol id="tag" viewBox="0 0 24 24">
          <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
          <path d="M7.5 7.5h.01" />
        </symbol>
        <symbol id="check" viewBox="0 0 24 24">
          <path d="M20 6 9 17l-5-5" />
        </symbol>
        <symbol id="pin" viewBox="0 0 24 24">
          <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </symbol>
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

// Mesmos valores do FRETE no carrinho.controller.js (o backend é quem cobra; aqui é só para mostrar)
const FRETES = { normal: 10, rapida: 20 };
const PRAZOS = { normal: 7, rapida: 2 }; // dias úteis
// As formas de pagamento vêm do backend (GET /formas-pagamento), como no app.
// Aqui ficam só o ícone e a frase de cada código conhecido.
const ICONE_FORMA = { pix: "pix", boleto: "doc" };
const DETALHE_FORMA = { pix: "Aprovação na hora", boleto: "Vence em 3 dias úteis" };
const detalheForma = f =>
  DETALHE_FORMA[f.codigo] || (f.usa_cartao ? (f.max_parcelas > 1 ? `Em até ${f.max_parcelas}x sem juros` : "À vista") : "");

function somarDiasUteis(dias) {
  const d = new Date();
  while (dias > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) dias--;
  }
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}
const prazoTexto = tipo => `Chega até ${somarDiasUteis(PRAZOS[tipo])}`;
const textoEndereco = e => `${e.endereco}, ${e.numero}, ${e.bairro}, ${e.cidade} - ${e.estado}, CEP ${e.cep}`;

function Opcao({ nome, valor, marcado, aoMarcar, icone, titulo, detalhe, extra }) {
  return (
    <label className="opcao">
      <input type="radio" name={nome} value={valor} checked={marcado} onChange={() => aoMarcar(String(valor))} />{" "}
      <span className="op-ico" aria-hidden="true">
        <Icone id={icone} />
      </span>{" "}
      <span className="op-txt">
        <b>{titulo}</b>
        <small id={detalhe?.id}>{detalhe?.texto ?? detalhe}</small>
      </span>
      {extra}
    </label>
  );
}

const ENDERECO_VAZIO = { cep: "", endereco: "", numero: "", bairro: "", cidade: "", estado: "", apelido: "" };
const CARTAO_VAZIO = { destinatario: "", ultimos_digitos: "", nome_titular: "" };

function FormEndereco({ primeiro, podeCancelar, aoSalvar, aoCancelar }) {
  const [f, setF] = useState(ENDERECO_VAZIO);
  const [erro, setErro] = useState("");
  const [cepInfo, setCepInfo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const form = useRef(null);
  const campo = nome => form.current.elements[nome];

  useEffect(() => {
    campo("cep").focus();
  }, []);

  const mudar = (nome, valor) => setF(atual => ({ ...atual, [nome]: valor }));

  const mudarCep = async valor => {
    const d = valor.replace(/\D/g, "").slice(0, 8);
    mudar("cep", d.replace(/^(\d{5})(\d)/, "$1-$2"));
    setCepInfo("");
    if (d.length !== 8) return;
    setCepInfo("Buscando endereço...");
    try {
      const r = await fetch(`${API_URL}${ENDPOINTS.cep}/${d}`);
      const v = await r.json().catch(() => ({}));
      if (!r.ok) {
        setCepInfo(
          r.status === 404 ? "CEP não encontrado. Preencha à mão." : "Não deu para buscar o CEP. Preencha à mão."
        );
        return;
      }
      setF(a => ({
        ...a,
        endereco: v.rua || a.endereco,
        bairro: v.bairro || a.bairro,
        cidade: v.cidade || a.cidade,
        estado: v.estado || a.estado
      }));
      setCepInfo("");
      setTimeout(() => campo(v.rua ? "numero" : "endereco").focus());
    } catch {
      setCepInfo("Não deu para buscar o CEP. Preencha à mão.");
    }
  };

  const salvar = async e => {
    e.preventDefault();
    const dados = {
      cep: f.cep.trim(),
      endereco: f.endereco.trim(),
      numero: f.numero.trim(),
      bairro: f.bairro.trim(),
      cidade: f.cidade.trim(),
      estado: f.estado.trim().toUpperCase(),
      apelido: f.apelido.trim() || null,
      padrao: primeiro
    };
    const falha = (msg, nome) => {
      setErro(msg);
      campo(nome).focus();
    };
    if (!/^\d{5}-\d{3}$/.test(dados.cep)) return falha("Digite o CEP completo.", "cep");
    if (!dados.endereco) return falha("Digite a rua.", "endereco");
    if (!dados.numero) return falha("Digite o número (ou S/N).", "numero");
    if (!dados.bairro) return falha("Digite o bairro.", "bairro");
    if (!dados.cidade) return falha("Digite a cidade.", "cidade");
    if (!/^[A-Z]{2}$/.test(dados.estado)) return falha("UF com 2 letras, ex.: SP.", "estado");

    setSalvando(true);
    try {
      await aoSalvar(dados);
    } catch (err) {
      setErro(semServidor(err));
      setSalvando(false);
    }
  };

  const input = (nome, props) => (
    <input name={nome} value={f[nome]} onChange={e => mudar(nome, e.target.value)} {...props} />
  );

  return (
    <form className="co-form" id="enderecoForm" noValidate ref={form} onSubmit={salvar}>
      <div className="grade">
        <label className="f c2">
          CEP{" "}
          <input
            name="cep"
            inputMode="numeric"
            maxLength="9"
            autoComplete="postal-code"
            placeholder="00000-000"
            required
            value={f.cep}
            onChange={e => mudarCep(e.target.value)}
          />{" "}
          <small id="cepInfo">{cepInfo}</small>
        </label>
        <label className="f c4">
          Endereço
          {input("endereco", {
            maxLength: 150,
            autoComplete: "address-line1",
            placeholder: "Rua, avenida...",
            required: true
          })}
        </label>
        <label className="f c2">
          Número{input("numero", { maxLength: 10, placeholder: "Ex.: 120 ou S/N", required: true })}
        </label>
        <label className="f c4">Bairro{input("bairro", { maxLength: 100, required: true })}</label>
        <label className="f c4">
          Cidade{input("cidade", { maxLength: 100, autoComplete: "address-level2", required: true })}
        </label>
        <label className="f c2">
          UF
          <input
            name="estado"
            maxLength="2"
            autoComplete="address-level1"
            placeholder="SP"
            required
            value={f.estado}
            onChange={e => mudar("estado", e.target.value.replace(/[^a-z]/gi, "").toUpperCase())}
          />
        </label>
        <label className="f c6">
          Apelido (opcional){input("apelido", { maxLength: 50, placeholder: "Ex.: Casa, Trabalho" })}
        </label>
      </div>
      <p className="err" role="alert">
        {erro}
      </p>
      <div className="co-form-btns">
        <button type="button" className="ghost" onClick={() => podeCancelar && aoCancelar()}>
          Cancelar
        </button>{" "}
        <button className="btn-sec" disabled={salvando}>
          Salvar endereço
        </button>
      </div>
    </form>
  );
}

function FormCartao({ primeiro, aoSalvar, aoCancelar }) {
  const [f, setF] = useState(CARTAO_VAZIO);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const form = useRef(null);
  const campo = nome => form.current.elements[nome];

  useEffect(() => {
    campo("destinatario").focus();
  }, []);

  const salvar = async e => {
    e.preventDefault();
    const dados = {
      destinatario: f.destinatario,
      ultimos_digitos: f.ultimos_digitos,
      nome_titular: f.nome_titular.trim(),
      icone: f.destinatario.toLowerCase().replace(/\s+/g, "-").slice(0, 20),
      padrao: primeiro
    };
    const falha = (msg, nome) => {
      setErro(msg);
      campo(nome).focus();
    };
    if (!dados.destinatario) return falha("Escolha a bandeira.", "destinatario");
    if (!/^\d{4}$/.test(dados.ultimos_digitos))
      return falha("Digite os 4 últimos dígitos do cartão.", "ultimos_digitos");
    if (dados.nome_titular.length < 3) return falha("Digite o nome como está no cartão.", "nome_titular");

    setSalvando(true);
    try {
      await aoSalvar(dados);
    } catch (err) {
      setErro(semServidor(err));
      setSalvando(false);
    }
  };

  return (
    <form className="co-form" id="cartaoForm" noValidate ref={form} onSubmit={salvar}>
      <p className="aviso-seguro">
        <Icone id="lock" />
        Por segurança, guardamos só a bandeira, o nome e os 4 últimos dígitos. Nunca pedimos o número completo nem o CVV
        aqui.
      </p>
      <div className="grade">
        <label className="f c3">
          Bandeira{" "}
          <select
            name="destinatario"
            required
            value={f.destinatario}
            onChange={e => setF({ ...f, destinatario: e.target.value })}
          >
            <option value="">Escolha</option>
            {["Visa", "Mastercard", "Elo", "American Express", "Hipercard"].map(b => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </label>
        <label className="f c3">
          4 últimos dígitos
          <input
            name="ultimos_digitos"
            inputMode="numeric"
            maxLength="4"
            placeholder="1234"
            autoComplete="off"
            required
            value={f.ultimos_digitos}
            onChange={e => setF({ ...f, ultimos_digitos: e.target.value.replace(/\D/g, "").slice(0, 4) })}
          />
        </label>
        <label className="f c6">
          Nome impresso no cartão
          <input
            name="nome_titular"
            maxLength="100"
            autoComplete="cc-name"
            required
            value={f.nome_titular}
            onChange={e => setF({ ...f, nome_titular: e.target.value })}
          />
        </label>
      </div>
      <p className="err" role="alert">
        {erro}
      </p>
      <div className="co-form-btns">
        <button type="button" className="ghost" onClick={aoCancelar}>
          Cancelar
        </button>{" "}
        <button className="btn-sec" disabled={salvando}>
          Salvar cartão
        </button>
      </div>
    </form>
  );
}

function ImagemItem({ src }) {
  const [erro, setErro] = useState(false);
  return <img src={src} alt="" style={erro ? { visibility: "hidden" } : undefined} onError={() => setErro(true)} />;
}

export default function Finalizar() {
  const idCliente = dadosDoToken()?.id;
  const [dados, setDados] = useState(null);
  const [erroCarga, setErroCarga] = useState("");
  const [escolha, setEscolha] = useState({ endereco: "", entrega: "", pagamento: "", cartao: "", parcelas: "1" });
  const [formEndereco, setFormEndereco] = useState(false);
  const [formCartao, setFormCartao] = useState(false);
  const [erroConfirmar, setErroConfirmar] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [sucesso, setSucesso] = useState(null);
  // cupom de desconto (mesmos cupons e regras do app: lib/cupons.js)
  const [cupom, setCupom] = useState(null);
  const [codigoCupom, setCodigoCupom] = useState("");
  const [erroCupom, setErroCupom] = useState("");
  const entregaSalva = useRef(""); // "id_endereco|tipo" já gravado no carrinho
  const caixaSucesso = useRef(null);
  const titulos = { endereco: useRef(null), entrega: useRef(null), pagamento: useRef(null), cartoes: useRef(null) };
  const formaDe = codigo => dados?.formas.find(f => f.codigo === codigo);
  const forma = formaDe(escolha.pagamento);

  const carregar = useCallback(async () => {
    if (!clienteLogado()) return; // a navegação já mostra o aviso de login
    setErroCarga("");
    setDados(null);
    try {
      const [carrinho, enderecos, cartoes, formas] = await Promise.all([
        pedir(ENDPOINTS.carrinho, {}, "Não foi possível carregar o carrinho."),
        pedir(`${ENDPOINTS.enderecos}/usuario/${idCliente}`, {}, "Não foi possível carregar seus endereços."),
        pedir(ENDPOINTS.pagamento, {}, "Não foi possível carregar seus cartões.").catch(() => []),
        pedir(ENDPOINTS.formasPagamento, {}, "Não foi possível carregar as formas de pagamento.")
      ]);
      // começa com o que já estava salvo no carrinho, senão o endereço/cartão principal
      const endInicial =
        carrinho.id_endereco || enderecos.find(e => e.padrao)?.id_endereco || enderecos[0]?.id_endereco;
      if (carrinho.tipo_entrega && carrinho.id_endereco)
        entregaSalva.current = `${carrinho.id_endereco}|${carrinho.tipo_entrega}`;
      setEscolha(e => ({
        ...e,
        endereco: endInicial != null ? String(endInicial) : "",
        entrega: carrinho.tipo_entrega || "",
        cartao: String(cartoes.find(c => c.padrao)?.id_cartao ?? cartoes[0]?.id_cartao ?? "")
      }));
      setFormEndereco(!enderecos.length);
      setDados({ carrinho, enderecos, cartoes, formas: (formas || []).filter(f => f.ativo !== false) });
    } catch (err) {
      setErroCarga(semServidor(err));
    }
  }, [idCliente]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // grava endereço + entrega no carrinho assim que os dois estiverem escolhidos
  async function salvarEntrega(e = escolha) {
    if (!e.endereco || !e.entrega) return false;
    const chave = `${e.endereco}|${e.entrega}`;
    if (chave === entregaSalva.current) return true;
    await pedir(
      `${ENDPOINTS.carrinho}/entrega`,
      json("PUT", { id_endereco: Number(e.endereco), tipo_entrega: e.entrega }),
      "Não foi possível salvar a entrega."
    );
    entregaSalva.current = chave;
    return true;
  }

  const escolher = (campo, valor) => {
    const nova = { ...escolha, [campo]: valor, ...(campo === "pagamento" ? { parcelas: "1" } : {}) };
    setEscolha(nova);
    setErroConfirmar("");
    if (campo === "endereco" || campo === "entrega") salvarEntrega(nova).catch(err => avisar(semServidor(err), "erro"));
    if (campo === "pagamento" && formaDe(valor)?.usa_cartao && !dados.cartoes.length) setFormCartao(true);
  };

  const salvarEndereco = async corpo => {
    const { id } = await pedir(ENDPOINTS.enderecos, json("POST", corpo), "Não foi possível salvar o endereço.");
    const enderecos = await pedir(`${ENDPOINTS.enderecos}/usuario/${idCliente}`, {}, "");
    setDados(d => ({ ...d, enderecos }));
    setFormEndereco(false);
    avisar("Endereço salvo!");
    escolher("endereco", String(id));
  };

  const salvarCartao = async corpo => {
    const { id } = await pedir(ENDPOINTS.pagamento, json("POST", corpo), "Não foi possível salvar o cartão.");
    const cartoes = await pedir(ENDPOINTS.pagamento, {}, "");
    setDados(d => ({ ...d, cartoes }));
    setFormCartao(false);
    setEscolha(e => ({ ...e, cartao: String(id) }));
    avisar("Cartão salvo!");
  };

  const aplicarCupom = (codigo = codigoCupom) => {
    const { cupom: valido, erro } = validarCupom(codigo, dados?.carrinho.subtotal || 0);
    if (erro) {
      setErroCupom(erro);
      return;
    }
    setCupom(valido);
    setCodigoCupom("");
    setErroCupom("");
    avisar(`Cupom ${valido.codigo} aplicado`);
  };
  const removerCupom = () => {
    setCupom(null);
    setErroCupom("");
  };

  const confirmar = async () => {
    const erro = (msg, alvo) => {
      setErroConfirmar(msg);
      alvo?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    if (!escolha.endereco) return erro("Escolha o endereço de entrega.", titulos.endereco);
    if (!escolha.entrega) return erro("Escolha o tipo de entrega.", titulos.entrega);
    if (!escolha.pagamento) return erro("Escolha a forma de pagamento.", titulos.pagamento);
    if (forma?.usa_cartao && !escolha.cartao) return erro("Escolha ou adicione um cartão.", titulos.cartoes);

    setConfirmando(true);
    try {
      await salvarEntrega();
      // cupom: mesmo formato que o app manda (o backend limita o desconto ao subtotal)
      const corpoCupom = cupom
        ? {
            cupom: cupom.codigo,
            ...(desconto > 0 ? { desconto } : {}),
            ...(cupom.freteGratis ? { frete_gratis: true } : {})
          }
        : {};
      const corpoPagamento = {
        forma_pagamento: escolha.pagamento,
        ...(ehCartao ? { id_cartao: Number(escolha.cartao) } : {}),
        parcelas: ehCartao ? Math.min(Number(escolha.parcelas || 1), maxParcelas) : 1
      };
      const { resumo, id_pedido } = await pedir(
        `${ENDPOINTS.carrinho}/finalizar`,
        json("POST", { ...corpoCupom, ...corpoPagamento }),
        "Não foi possível finalizar a compra."
      );
      mostrarSucesso(resumo, id_pedido);
    } catch (err) {
      erro(semServidor(err));
    } finally {
      setConfirmando(false);
    }
  };

  function mostrarSucesso(resumo, idPedido) {
    const { carrinho, enderecos, cartoes } = dados;
    const end = enderecos.find(e => String(e.id_endereco) === escolha.endereco);
    const cartao = cartoes.find(c => String(c.id_cartao) === escolha.cartao);
    const parcelas = ehCartao ? Math.min(Number(escolha.parcelas || 1), maxParcelas) : 1;
    const totalPedido = resumo?.total ?? total;
    const qtd = (resumo?.itens || carrinho.itens).reduce((s, i) => s + i.quantidade, 0);
    setSucesso({
      idPedido,
      texto: `Recebemos seu pedido de ${qtd} ${qtd === 1 ? "item" : "itens"} no total de ${formatarPreco(totalPedido)}.`,
      entrega: `${escolha.entrega === "rapida" ? "Rápida" : "Normal"} · ${prazoTexto(escolha.entrega)}`,
      endereco: end ? textoEndereco(end) : "",
      pagamento: ehCartao
        ? `${forma.nome}: ${cartao?.destinatario || "Cartão"} •••• ${cartao?.ultimos_digitos || ""}, ${parcelas}x de ${formatarPreco(totalPedido / parcelas)}`
        : forma?.nome || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    atualizarContadorCarrinho([]);
  }

  useEffect(() => {
    if (sucesso) caixaSucesso.current?.focus();
  }, [sucesso]);

  let estado = null;
  if (erroCarga)
    estado = (
      <>
        {erroCarga}
        <br />
        <button type="button" id="tentarDeNovo" onClick={carregar}>
          Tentar de novo
        </button>
      </>
    );
  else if (!dados) estado = "Carregando seu pedido... 🐾";
  else if (!dados.carrinho.itens.length)
    estado = (
      <>
        Seu carrinho está vazio. 🐾
        <br />
        <Link to="/produtos">Ver produtos</Link>
      </>
    );
  else if (dados.carrinho.itens.some(i => !i.ativo))
    estado = (
      <>
        Alguns produtos do seu carrinho não estão mais disponíveis.
        <br />
        <Link to="/carrinho">Revisar carrinho</Link>
      </>
    );

  const carrinho = dados?.carrinho;
  const subtotal = carrinho?.subtotal || 0;
  const freteCheio = escolha.entrega ? FRETES[escolha.entrega] : 0;
  const frete = cupom?.freteGratis ? 0 : freteCheio;
  const desconto = Math.min(descontoDoCupom(cupom, subtotal), subtotal);
  const total = Math.max(subtotal + frete - desconto, 0);
  const ehCartao = Boolean(forma?.usa_cartao);
  const maxParcelas = ehCartao ? Math.max(1, Number(forma.max_parcelas) || 1) : 1;
  const parcelas = Math.min(Number(escolha.parcelas || 1), maxParcelas);
  const maiorParcelamento = Math.max(1, ...(dados?.formas || []).map(f => Number(f.max_parcelas) || 1));
  const totalInfo =
    ehCartao && parcelas > 1
      ? `${parcelas}x de ${formatarPreco(total / parcelas)} sem juros`
      : forma
        ? `Pagamento via ${forma.nome}`
        : maiorParcelamento > 1
          ? `em até ${maiorParcelamento}x sem juros no cartão`
          : "";

  const ok = {
    endereco: Boolean(escolha.endereco),
    entrega: Boolean(escolha.entrega),
    pagamento: Boolean(escolha.pagamento) && (!ehCartao || Boolean(escolha.cartao))
  };

  return (
    <>
      <FinalizarIcones />
      <Header atual="carrinho" semAriaCurrent />

      <main className="checkout hs-container">
        <Link className="voltar" to="/carrinho" hidden={Boolean(sucesso)}>
          <Icone id="back" /> Voltar ao carrinho
        </Link>
        <h1 className="page-title" hidden={Boolean(sucesso)}>
          Finalizar compra
        </h1>

        <div className="co-estado hs-estado" id="coEstado" hidden={!estado}>
          {estado}
        </div>

        {dados && !estado && (
          <div className="co-layout" id="coLayout" hidden={Boolean(sucesso)}>
            <div className="co-passos">
              <section className={"co-card" + (ok.endereco ? " ok" : "")} aria-labelledby="tEndereco">
                <h2 id="tEndereco" ref={titulos.endereco}>
                  <span className="num">1</span> Endereço de entrega
                </h2>
                <div className="opcoes" id="listaEnderecos" role="radiogroup" aria-labelledby="tEndereco">
                  {dados.enderecos.length ? (
                    dados.enderecos.map(e => (
                      <Opcao
                        key={e.id_endereco}
                        nome="endereco"
                        valor={e.id_endereco}
                        icone="pin"
                        marcado={String(e.id_endereco) === escolha.endereco}
                        aoMarcar={v => escolher("endereco", v)}
                        titulo={
                          <>
                            {e.apelido || "Endereço"}
                            {e.padrao ? <span className="op-tag">Principal</span> : null}
                          </>
                        }
                        detalhe={textoEndereco(e)}
                      />
                    ))
                  ) : (
                    <p className="vazio-op">
                      Você ainda não tem endereço cadastrado. Adicione um para receber o pedido.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="co-add"
                  id="addEndereco"
                  hidden={formEndereco}
                  onClick={() => setFormEndereco(true)}
                >
                  <Icone id="plus" /> Adicionar novo endereço
                </button>
                {formEndereco && (
                  <FormEndereco
                    primeiro={!dados.enderecos.length}
                    podeCancelar={dados.enderecos.length > 0}
                    aoSalvar={salvarEndereco}
                    aoCancelar={() => setFormEndereco(false)}
                  />
                )}
              </section>

              <section className={"co-card" + (ok.entrega ? " ok" : "")} aria-labelledby="tEntrega">
                <h2 id="tEntrega" ref={titulos.entrega}>
                  <span className="num">2</span> Entrega
                </h2>
                <div className="opcoes" role="radiogroup" aria-labelledby="tEntrega">
                  {[
                    ["normal", "Entrega normal", "truck", "prazoNormal", "valNormal"],
                    ["rapida", "Entrega rápida", "bolt", "prazoRapida", "valRapida"]
                  ].map(([tipo, titulo, icone, idPrazo, idValor]) => (
                    <Opcao
                      key={tipo}
                      nome="entrega"
                      valor={tipo}
                      icone={icone}
                      titulo={titulo}
                      marcado={escolha.entrega === tipo}
                      aoMarcar={v => escolher("entrega", v)}
                      detalhe={{ id: idPrazo, texto: prazoTexto(tipo) }}
                      extra={
                        <>
                          {" "}
                          <span className="op-val" id={idValor}>
                            {formatarPreco(FRETES[tipo])}
                          </span>
                        </>
                      }
                    />
                  ))}
                </div>
              </section>

              <section className={"co-card" + (ok.pagamento ? " ok" : "")} aria-labelledby="tPagamento">
                <h2 id="tPagamento" ref={titulos.pagamento}>
                  <span className="num">3</span> Pagamento
                </h2>
                <div className="opcoes" role="radiogroup" aria-labelledby="tPagamento">
                  {dados.formas.length ? (
                    dados.formas.map(f => (
                      <Opcao
                        key={f.codigo}
                        nome="pagamento"
                        valor={f.codigo}
                        icone={ICONE_FORMA[f.codigo] || (f.usa_cartao ? "card" : "doc")}
                        titulo={f.nome}
                        detalhe={detalheForma(f)}
                        marcado={escolha.pagamento === f.codigo}
                        aoMarcar={v => escolher("pagamento", v)}
                      />
                    ))
                  ) : (
                    <p className="vazio-op">Nenhuma forma de pagamento disponível no momento.</p>
                  )}
                </div>

                <div className="cartoes" id="cartoesBox" hidden={!ehCartao} ref={titulos.cartoes}>
                  <h3>Seus cartões</h3>
                  <div className="opcoes" id="listaCartoes" role="radiogroup" aria-label="Cartões salvos">
                    {dados.cartoes.length ? (
                      dados.cartoes.map(c => (
                        <Opcao
                          key={c.id_cartao}
                          nome="cartao"
                          valor={c.id_cartao}
                          icone="card"
                          marcado={String(c.id_cartao) === escolha.cartao}
                          aoMarcar={v => escolher("cartao", v)}
                          titulo={
                            <>
                              {c.destinatario} •••• {c.ultimos_digitos}
                              {c.padrao ? <span className="op-tag">Principal</span> : null}
                            </>
                          }
                          detalhe={c.nome_titular || ""}
                        />
                      ))
                    ) : (
                      <p className="vazio-op">Nenhum cartão salvo ainda.</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="co-add"
                    id="addCartao"
                    hidden={formCartao}
                    onClick={() => setFormCartao(true)}
                  >
                    <Icone id="plus" /> Adicionar cartão
                  </button>
                  {formCartao && (
                    <FormCartao
                      primeiro={!dados.cartoes.length}
                      aoSalvar={salvarCartao}
                      aoCancelar={() => setFormCartao(false)}
                    />
                  )}
                </div>

                <div className="parcelas" id="parcelasBox" hidden={!ehCartao || maxParcelas < 2}>
                  <label className="f">
                    Parcelas
                    <select id="parcelas" value={String(parcelas)} onChange={e => escolher("parcelas", e.target.value)}>
                      {Array.from({ length: maxParcelas }, (_, i) => i + 1).map(n => (
                        <option
                          key={n}
                          value={n}
                        >{`${n}x de ${formatarPreco(total / n)}${n > 1 ? " sem juros" : " (à vista)"}`}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>
            </div>

            <aside className="co-resumo">
              <div className="summary-card">
                <h2>Resumo do pedido</h2>
                <ul className="co-itens" id="resumoItens">
                  {carrinho.itens.map(i => (
                    <li key={i.id_produto}>
                      {i.imagem_url ? (
                        <ImagemItem src={urlImagem(i.imagem_url)} />
                      ) : (
                        <span className="sem-foto">🐾</span>
                      )}
                      <span className="nome">
                        {i.nome}
                        <small>
                          {i.quantidade}× {formatarPreco(i.preco_unico)}
                        </small>
                      </span>
                      <b>{formatarPreco(i.subtotal)}</b>
                    </li>
                  ))}
                </ul>
                <div className="summary-row">
                  <span>
                    Subtotal (<span id="qtdItens">{carrinho.itens.reduce((s, i) => s + i.quantidade, 0)}</span> itens)
                  </span>
                  <span id="subtotal">{formatarPreco(carrinho.subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Frete</span>
                  <span id="frete">
                    {cupom?.freteGratis ? (
                      <>
                        {escolha.entrega && <s className="co-riscado">{formatarPreco(freteCheio)}</s>}{" "}
                        <b className="co-gratis">Grátis</b>
                      </>
                    ) : escolha.entrega ? (
                      formatarPreco(frete)
                    ) : (
                      "escolha a entrega"
                    )}
                  </span>
                </div>
                {desconto > 0 && (
                  <div className="summary-row co-desconto">
                    <span>Desconto ({cupom.codigo})</span>
                    <span>− {formatarPreco(desconto)}</span>
                  </div>
                )}

                <div className="co-cupom">
                  {cupom ? (
                    <div className="co-cupom-ok">
                      <span className="co-cupom-ico" aria-hidden="true">
                        <Icone id="tag" />
                      </span>
                      <span className="co-cupom-txt">
                        <b>{cupom.codigo}</b>
                        <small>{cupom.titulo} aplicado</small>
                      </span>
                      <button
                        type="button"
                        className="co-cupom-x"
                        aria-label="Remover cupom"
                        title="Remover cupom"
                        onClick={removerCupom}
                      >
                        <Icone id="x" />
                      </button>
                    </div>
                  ) : (
                    <form
                      className="co-cupom-form"
                      noValidate
                      onSubmit={e => {
                        e.preventDefault();
                        aplicarCupom();
                      }}
                    >
                      <label htmlFor="codigoCupom">
                        <Icone id="tag" /> Cupom de desconto
                      </label>
                      <div className="co-cupom-linha">
                        <input
                          id="codigoCupom"
                          placeholder="Código do cupom"
                          autoComplete="off"
                          spellCheck="false"
                          maxLength={30}
                          value={codigoCupom}
                          aria-invalid={Boolean(erroCupom)}
                          aria-describedby="erroCupom"
                          onChange={e => {
                            setCodigoCupom(e.target.value.toUpperCase());
                            setErroCupom("");
                          }}
                        />
                        <button type="submit" className="co-cupom-btn">
                          Aplicar
                        </button>
                      </div>
                      <p className="err" id="erroCupom" role="alert">
                        {erroCupom}
                      </p>
                      {cuponsDisponiveis().length > 0 && (
                        <div className="co-cupom-sugestoes">
                          <small>Cupons disponíveis:</small>
                          {cuponsDisponiveis().map(c => (
                            <button
                              key={c.codigo}
                              type="button"
                              title={c.descricao}
                              onClick={() => aplicarCupom(c.codigo)}
                            >
                              {c.codigo}
                            </button>
                          ))}
                        </div>
                      )}
                    </form>
                  )}
                </div>
                <hr />
                <div className="summary-total">
                  <span>Total</span>
                  <span id="total">{formatarPreco(total)}</span>
                </div>
                <p className="parcelamento" id="totalInfo">
                  {totalInfo}
                </p>
                <p className="err co-erro" id="confirmarErro" role="alert">
                  {erroConfirmar}
                </p>
                <button
                  type="button"
                  className="btn-finalizar"
                  id="confirmar"
                  disabled={confirmando}
                  onClick={confirmar}
                >
                  <Icone id="lock" /> {confirmando ? "Confirmando..." : "Finalizar compra"}
                </button>
                <p className="co-nota">Este site ainda não faz cobrança real.</p>
              </div>
            </aside>
          </div>
        )}

        <section
          className="co-sucesso"
          id="sucesso"
          hidden={!sucesso}
          tabIndex="-1"
          aria-labelledby="tSucesso"
          ref={caixaSucesso}
        >
          <div className="ok-ico" aria-hidden="true">
            <Icone id="check" />
          </div>
          <h2 id="tSucesso">Pedido confirmado! 🐾</h2>
          <p id="sucessoTexto">{sucesso?.texto}</p>
          <div className="ok-detalhes" id="sucessoDetalhes">
            {sucesso && (
              <>
                <div>
                  <small>Entrega</small>
                  {sucesso.entrega}
                </div>
                <div>
                  <small>Endereço</small>
                  {sucesso.endereco}
                </div>
                <div>
                  <small>Pagamento</small>
                  {sucesso.pagamento}
                </div>
              </>
            )}
          </div>
          <div className="ok-btns">
            <Link className="btn-finalizar" to={sucesso?.idPedido ? `/pedidos?pedido=${sucesso.idPedido}` : "/pedidos"}>
              Acompanhar meu pedido
            </Link>{" "}
            <Link className="ghost" to="/produtos">
              Continuar comprando
            </Link>{" "}
            <Link className="ghost" to="/">
              Voltar ao início
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
