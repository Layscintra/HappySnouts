import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import Dialogo, { focarPrimeiroCampo } from "../../components/Dialogo.jsx";
import Icone from "../../components/Icone.jsx";
import Footer from "../../components/layout/Footer.jsx";
import Header from "../../components/layout/Header.jsx";
import {
  api,
  API_URL,
  ENDPOINTS,
  clienteLogado,
  dadosDoToken,
  lerErro,
  urlImagem,
  enviarImagem,
  reduzirImagem,
  buscarFavoritos,
  alternarFavorito,
  formatarPreco,
  erroEmail,
  erroNomeCompleto,
  erroNomeUsuario,
  USUARIO_MAX,
  erroTelefone,
  avisar,
  sair,
  semServidor
} from "../../lib/api.js";
import { confirmar } from "../../lib/ui.js";
import { SecaoEnderecos, SecaoPagamentos, buscarEnderecos } from "./EnderecosPagamentos.jsx";

function PerfilIcones() {
  return (
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
      <symbol id="box" viewBox="0 0 24 24">
        <path d="M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8" />
      </symbol>
      <symbol id="chart" viewBox="0 0 24 24">
        <path d="M3 3v18h18" />
        <path d="m8 14 4-4 4 4 5-7" />
      </symbol>
      <symbol id="agenda" viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </symbol>
      <symbol id="barras" viewBox="0 0 24 24">
        <path d="M5 21V10M12 21V4M19 21v-8" />
      </symbol>
      <symbol id="user" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </symbol>
      <symbol id="doc" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h8" />
      </symbol>
      <symbol id="heart" viewBox="0 0 24 24">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
      </symbol>
      <symbol id="help" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" />
      </symbol>
      <symbol id="camera" viewBox="0 0 24 24">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </symbol>
      <symbol id="pin" viewBox="0 0 24 24">
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </symbol>
      <symbol id="card" viewBox="0 0 24 24">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20M6 15h4" />
      </symbol>
      <symbol id="check" viewBox="0 0 24 24">
        <path d="M20 6 9 17l-5-5" />
      </symbol>
      <symbol id="pen" viewBox="0 0 24 24">
        <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
      </symbol>
      <symbol id="x" viewBox="0 0 24 24">
        <path d="M18 6L6 18M6 6l12 12" />
      </symbol>
      <symbol id="mail" viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </symbol>
      <symbol id="phone" viewBox="0 0 24 24">
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
      </symbol>
      <symbol id="cake" viewBox="0 0 24 24">
        <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8M4 16c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5M2 21h20M12 11V7M12 4h.01" />
      </symbol>
      <symbol id="lock" viewBox="0 0 24 24">
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </symbol>
      <symbol id="out" viewBox="0 0 24 24">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
      </symbol>
      <symbol id="plus" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" />
      </symbol>
      <symbol id="trash" viewBox="0 0 24 24">
        <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
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
  );
}

async function getJson(caminho, padrao) {
  const resp = await api(caminho);
  if (!resp.ok) throw new Error(await lerErro(resp, padrao));
  return resp.json();
}

async function enviar(caminho, metodo, corpo, padrao) {
  const resp = await api(caminho, { method: metodo, body: corpo ? JSON.stringify(corpo) : undefined });
  if (!resp.ok) throw new Error(await lerErro(resp, padrao));
  return resp.json().catch(() => ({}));
}

const soDigitos = s => String(s || "").replace(/\D/g, "");
const dataIso = d => (d ? String(d).slice(0, 10) : ""); // "2000-05-20T03:00:00.000Z" -> "2000-05-20"
const dataBr = d => {
  const [a, m, dd] = dataIso(d).split("-");
  return a ? `${dd}/${m}/${a}` : "";
};
const mesAno = d => {
  const dt = d ? new Date(d) : null;
  if (!dt || isNaN(dt)) return "";
  const t = dt.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
function telefoneBr(v) {
  const d = soDigitos(v);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return v || "";
}
const mascaraTelefone = v =>
  soDigitos(v)
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
// data mais recente permitida (quem nasceu depois disso tem menos de 16 anos)
function dataLimite16() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 16);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const anos = n => (Number(n) === 1 ? "1 ano" : `${n} anos`);
const peso = p => `${Number(p).toLocaleString("pt-BR", { maximumFractionDigits: 3 })} kg`;

// Foto com a patinha por baixo: se a imagem falhar, some e fica a patinha
function FotoComPatinha({ src, alt = "", loading }) {
  const [erro, setErro] = useState(false);
  useEffect(() => setErro(false), [src]);
  return (
    <>
      <Icone id="paw" />
      {src && !erro && <img src={src} alt={alt} loading={loading} onError={() => setErro(true)} />}
    </>
  );
}

const BotaoSalvar = ({ salvando, children }) => (
  <button className="btn" disabled={salvando}>
    {salvando ? "Salvando..." : children}
  </button>
);

function ModalPerfil({ aba, cliente, idCliente, aoTrocarAba, aoFechar, aoSalvarDados }) {
  const [f, setF] = useState({});
  const [s, setS] = useState({ senha_atual: "", nova_senha: "", confirmar: "" });
  const [erro, setErro] = useState({ dados: "", senha: "" });
  const [salvando, setSalvando] = useState(false);
  const formDados = useRef(null);
  const formSenha = useRef(null);

  useEffect(() => {
    if (!aba || !cliente) return;
    setF({
      nome_completo: cliente.nome_completo || "",
      nome_usuario: cliente.nome_usuario || "",
      email: cliente.email || "",
      telefone: telefoneBr(cliente.telefone),
      data_nascimento: dataIso(cliente.data_nascimento)
    });
    setS({ senha_atual: "", nova_senha: "", confirmar: "" });
    setErro({ dados: "", senha: "" });
  }, [Boolean(aba)]); // eslint-disable-line react-hooks/exhaustive-deps

  const senha = aba === "senha";
  const falha = (qual, msg, form, campo) => {
    setErro(e => ({ ...e, [qual]: msg }));
    form.current.elements[campo]?.focus();
  };

  async function comSalvando(qual, tarefa) {
    setSalvando(true);
    try {
      await tarefa();
    } catch (err) {
      setErro(e => ({ ...e, [qual]: semServidor(err) }));
    } finally {
      setSalvando(false);
    }
  }

  const salvarDados = e => {
    e.preventDefault();
    const el = formDados.current.elements;
    const dados = {
      nome_completo: f.nome_completo.trim(),
      nome_usuario: f.nome_usuario.trim(),
      email: f.email.trim(),
      telefone: soDigitos(f.telefone) || null,
      data_nascimento: f.data_nascimento || null
    };
    if (erroNomeCompleto(dados.nome_completo))
      return falha("dados", erroNomeCompleto(dados.nome_completo), formDados, "nome_completo");
    if (erroNomeUsuario(dados.nome_usuario))
      return falha("dados", erroNomeUsuario(dados.nome_usuario), formDados, "nome_usuario");
    if (!dados.email || !el.email.checkValidity()) return falha("dados", "Confira o e-mail.", formDados, "email");
    if (erroEmail(dados.email)) return falha("dados", erroEmail(dados.email), formDados, "email");
    if (!dados.telefone) return falha("dados", "Digite seu telefone.", formDados, "telefone");
    if (erroTelefone(dados.telefone)) return falha("dados", erroTelefone(dados.telefone), formDados, "telefone");
    if (dados.data_nascimento && dados.data_nascimento > dataLimite16())
      return falha("dados", "É preciso ter pelo menos 16 anos.", formDados, "data_nascimento");

    comSalvando("dados", async () => {
      await enviar(`${ENDPOINTS.cliente}/${idCliente}`, "PUT", dados, "Não foi possível salvar seu perfil.");
      aoSalvarDados(dados);
      aoFechar();
      avisar("Perfil atualizado!");
    });
  };

  const salvarSenha = e => {
    e.preventDefault();
    if (!s.senha_atual) return falha("senha", "Digite sua senha atual.", formSenha, "senha_atual");
    if (s.nova_senha.length < 6)
      return falha("senha", "A nova senha precisa ter pelo menos 6 caracteres.", formSenha, "nova_senha");
    if (s.nova_senha !== s.confirmar) return falha("senha", "As senhas não coincidem.", formSenha, "confirmar");

    comSalvando("senha", async () => {
      // senha atual errada responde 401; aqui não pode cair no "sessão expirada" do api()
      const resp = await fetch(`${API_URL}${ENDPOINTS.cliente}/${idCliente}/senha`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ senha_atual: s.senha_atual, nova_senha: s.nova_senha })
      });
      if (!resp.ok) throw new Error(await lerErro(resp, "Não foi possível alterar a senha."));
      aoFechar();
      avisar("Senha alterada!");
    });
  };

  const campoDados = (nome, icone, props) => (
    <span className="ic">
      <Icone id={icone} />
      <input name={nome} value={f[nome] ?? ""} onChange={e => setF({ ...f, [nome]: e.target.value })} {...props} />
    </span>
  );
  const campoSenha = (nome, props) => (
    <span className="ic">
      <Icone id="lock" />
      <input
        name={nome}
        type="password"
        value={s[nome]}
        onChange={e => setS({ ...s, [nome]: e.target.value })}
        {...props}
      />
    </span>
  );
  const trocar = qual => {
    aoTrocarAba(qual);
    setTimeout(() => focarPrimeiroCampo(document.getElementById("perfilModal")));
  };

  return (
    <Dialogo
      id="perfilModal"
      className="pmodal"
      aria-labelledby="perfilTitulo"
      aberto={Boolean(aba)}
      aoFechar={aoFechar}
      aoAbrir={focarPrimeiroCampo}
    >
      <div className="ptopo">
        <div className="pav" id="perfilAv">
          <FotoComPatinha src={urlImagem(cliente?.foto_url)} />
        </div>
        <div>
          <h2 id="perfilTitulo">{senha ? "Alterar senha" : "Editar perfil"}</h2>
          <p id="perfilSub">{cliente ? `${cliente.nome_completo} · @${cliente.nome_usuario}` : ""}</p>
        </div>
        <button type="button" className="x" data-close aria-label="Fechar">
          <Icone id="x" />
        </button>
      </div>
      <div className="abas" role="tablist" aria-label="O que você quer editar">
        <button
          type="button"
          role="tab"
          id="abaDados"
          aria-controls="perfilForm"
          aria-selected={!senha}
          onClick={() => trocar("dados")}
        >
          <Icone id="user" />
          Dados pessoais
        </button>
        <button
          type="button"
          role="tab"
          id="abaSenha"
          aria-controls="senhaForm"
          aria-selected={senha}
          onClick={() => trocar("senha")}
        >
          <Icone id="lock" />
          Senha
        </button>
      </div>

      <form
        id="perfilForm"
        className="mform"
        role="tabpanel"
        aria-labelledby="abaDados"
        noValidate
        hidden={senha}
        ref={formDados}
        onSubmit={salvarDados}
      >
        <label className="f">
          Nome completo{campoDados("nome_completo", "user", { maxLength: 100, autoComplete: "name", required: true })}
        </label>
        <div className="dupla">
          <label className="f">
            Nome de usuário
            {campoDados("nome_usuario", "paw", { maxLength: USUARIO_MAX, autoComplete: "username", required: true })}
          </label>
          <label className="f">
            E-mail
            {campoDados("email", "mail", { type: "email", maxLength: 100, autoComplete: "email", required: true })}
          </label>
        </div>
        <div className="dupla">
          <label className="f">
            Telefone
            <span className="ic">
              <Icone id="phone" />
              <input
                name="telefone"
                inputMode="tel"
                maxLength="15"
                autoComplete="tel"
                required
                placeholder="(11) 91234-5678"
                value={f.telefone ?? ""}
                onChange={e => setF({ ...f, telefone: mascaraTelefone(e.target.value) })}
              />
            </span>
          </label>
          <label className="f">
            Data de nascimento{campoDados("data_nascimento", "cake", { type: "date", max: dataLimite16() })}
          </label>
        </div>
        <p className="err" role="alert">
          {erro.dados}
        </p>
        <div className="act2">
          <button type="button" className="ghost" data-close>
            Cancelar
          </button>
          <BotaoSalvar salvando={salvando}>Salvar alterações</BotaoSalvar>
        </div>
      </form>

      <form
        id="senhaForm"
        className="mform"
        role="tabpanel"
        aria-labelledby="abaSenha"
        hidden={!senha}
        noValidate
        ref={formSenha}
        onSubmit={salvarSenha}
      >
        <p className="dica">
          <Icone id="lock" />
          Use pelo menos 6 caracteres. Misturar letras e números deixa sua conta mais segura.
        </p>
        <label className="f">
          Senha atual{campoSenha("senha_atual", { autoComplete: "current-password", required: true })}
        </label>
        <div className="dupla">
          <label className="f">
            Nova senha{campoSenha("nova_senha", { minLength: 6, autoComplete: "new-password", required: true })}
          </label>
          <label className="f">
            Confirmar nova senha
            {campoSenha("confirmar", { minLength: 6, autoComplete: "new-password", required: true })}
          </label>
        </div>
        <p className="err" role="alert">
          {erro.senha}
        </p>
        <div className="act2">
          <button type="button" className="ghost" data-close>
            Cancelar
          </button>
          <BotaoSalvar salvando={salvando}>Salvar senha</BotaoSalvar>
        </div>
      </form>
    </Dialogo>
  );
}

const PET_VAZIO = { nome_pet: "", raca: "", idade_pet: "", peso_atual: "" };

function ModalPet({ aberto, pet, aoFechar, aoSalvo }) {
  const [f, setF] = useState(PET_VAZIO);
  const [fotoNova, setFotoNova] = useState(null);
  const [previa, setPrevia] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const form = useRef(null);
  const arquivo = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    setF(
      pet
        ? {
            nome_pet: pet.nome_pet,
            raca: pet.raca,
            idade_pet: pet.idade_pet ?? "",
            peso_atual: pet.peso_atual != null ? Number(pet.peso_atual) : ""
          }
        : PET_VAZIO
    );
    setFotoNova(null);
    setPrevia(pet?.foto_url ? urlImagem(pet.foto_url) : "");
    setErro("");
  }, [aberto, pet]);

  const falha = (msg, campo) => {
    setErro(msg);
    if (campo) form.current.elements[campo].focus();
  };

  const escolherFoto = async e => {
    const escolhido = e.target.files[0];
    e.target.value = "";
    if (!escolhido) return;
    try {
      const reduzida = await reduzirImagem(escolhido, { lado: 800 });
      setFotoNova(reduzida);
      setPrevia(URL.createObjectURL(reduzida));
      setErro("");
    } catch (err) {
      falha(err.message);
    }
  };

  const salvar = async e => {
    e.preventDefault();
    const nome = String(f.nome_pet).trim(),
      raca = String(f.raca).trim();
    const idade = f.idade_pet === "" ? null : Number(f.idade_pet);
    const kg = f.peso_atual === "" ? null : Number(f.peso_atual);
    if (!nome) return falha("Qual é o nome do seu pet?", "nome_pet");
    if (!raca) return falha('Informe a raça (pode ser "SRD" se não tiver).', "raca");
    if (idade != null && (!Number.isInteger(idade) || idade < 0 || idade > 40))
      return falha("Idade em anos inteiros, de 0 a 40.", "idade_pet");
    if (kg != null && (!(kg > 0) || kg > 200)) return falha("Peso em kg, maior que 0.", "peso_atual");

    setSalvando(true);
    try {
      const dados = { nome_pet: nome, raca, idade_pet: idade, peso_atual: kg };
      if (fotoNova) dados.foto_url = await enviarImagem(fotoNova);
      if (pet) await enviar(`${ENDPOINTS.pets}/${pet.id_pet}`, "PUT", dados, "Não foi possível salvar o pet.");
      else await enviar(ENDPOINTS.pets, "POST", dados, "Não foi possível cadastrar o pet.");
      aoFechar();
      avisar(pet ? `${nome} foi atualizado!` : `${nome} foi cadastrado! 🐾`);
      await aoSalvo();
    } catch (err) {
      falha(semServidor(err));
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async () => {
    if (!pet) return;
    const ok = await confirmar({
      titulo: `Excluir ${pet.nome_pet}?`,
      mensagem: "Os dados desse pet são apagados. Essa ação não pode ser desfeita.",
      botao: "Excluir pet",
      tipo: "perigo"
    });
    if (!ok) return;
    setExcluindo(true);
    try {
      await enviar(`${ENDPOINTS.pets}/${pet.id_pet}`, "DELETE", null, "Não foi possível excluir o pet.");
      aoFechar();
      avisar(`${pet.nome_pet} foi removido.`);
      await aoSalvo();
    } catch (err) {
      falha(semServidor(err));
    } finally {
      setExcluindo(false);
    }
  };

  const campo = (nome, icone, props) => (
    <span className="ic">
      <Icone id={icone} />
      <input name={nome} value={f[nome]} onChange={e => setF({ ...f, [nome]: e.target.value })} {...props} />
    </span>
  );

  return (
    <Dialogo id="petModal" aria-labelledby="petTitulo" aberto={aberto} aoFechar={aoFechar} aoAbrir={focarPrimeiroCampo}>
      <form id="petForm" className="mform" noValidate ref={form} onSubmit={salvar}>
        <header>
          <h2 id="petTitulo">{pet ? `Editar ${pet.nome_pet}` : "Novo pet"}</h2>
          <button type="button" className="x" data-close aria-label="Fechar">
            <Icone id="x" />
          </button>
        </header>
        <div className="petfoto">
          <div className="pfoto" id="petPreview">
            <FotoComPatinha src={previa} />
          </div>
          <div>
            <button type="button" className="ghost" id="petFotoBtn" onClick={() => arquivo.current.click()}>
              <Icone id="camera" />
              Escolher foto
            </button>
            <small>JPG, PNG ou WEBP.</small>
          </div>
          <input
            type="file"
            id="petFile"
            accept="image/jpeg,image/png,image/webp"
            hidden
            ref={arquivo}
            onChange={escolherFoto}
          />
        </div>
        <label className="f">
          Nome do pet{campo("nome_pet", "heart", { maxLength: 50, required: true, placeholder: "Ex.: Lily" })}
        </label>
        <label className="f">
          Raça{campo("raca", "paw", { maxLength: 100, required: true, placeholder: "Ex.: Golden Retriever, SRD..." })}
        </label>
        <div className="dupla">
          <label className="f">
            Idade (anos)
            {campo("idade_pet", "cake", {
              type: "number",
              min: 0,
              max: 40,
              step: 1,
              inputMode: "numeric",
              placeholder: "Ex.: 3"
            })}
          </label>
          <label className="f">
            Peso (kg)
            {campo("peso_atual", "barras", {
              type: "number",
              min: 0,
              max: 200,
              step: 0.001,
              inputMode: "decimal",
              placeholder: "Ex.: 4,1"
            })}
          </label>
        </div>
        <p className="err" role="alert">
          {erro}
        </p>
        <div className="act2">
          <button
            type="button"
            className="ghost perigo"
            id="petExcluir"
            hidden={!pet}
            disabled={excluindo}
            onClick={excluir}
          >
            <Icone id="trash" />
            Excluir
          </button>
          <button type="button" className="ghost" data-close>
            Cancelar
          </button>
          <BotaoSalvar salvando={salvando}>Salvar</BotaoSalvar>
        </div>
      </form>
    </Dialogo>
  );
}

function CartaoFavorito({ produto: p, aoRemover }) {
  const [ocupado, setOcupado] = useState(false);
  return (
    <div className="pcw" data-fav-id={p.id}>
      <Link className="pc" to={`/produtos?q=${encodeURIComponent(p.nome)}`}>
        <div className="pimg">
          <FotoComPatinha src={p.imagem} loading="lazy" />
        </div>
        <h3>{p.nome}</h3>
        <div className="pm">
          <b>{formatarPreco(p.preco)}</b>
          <span>Ver produto</span>
        </div>
      </Link>
      <button
        type="button"
        className="pfav"
        aria-pressed="true"
        aria-label={`Remover dos favoritos: ${p.nome}`}
        disabled={ocupado}
        onClick={async () => {
          setOcupado(true);
          await aoRemover(p);
          setOcupado(false);
        }}
      >
        <svg className="i" aria-hidden="true">
          <use href="#heart" />
        </svg>
      </button>
    </div>
  );
}

const PAINEIS = ["enderecos", "pagamentos"];

export default function Perfil() {
  const logado = clienteLogado();
  const idCliente = dadosDoToken()?.id;
  const [cliente, setCliente] = useState(null);
  const [erroCliente, setErroCliente] = useState("");
  const [pets, setPets] = useState(null);
  const [erroPets, setErroPets] = useState("");
  const [favoritos, setFavoritos] = useState(null);
  const [erroFavoritos, setErroFavoritos] = useState("");
  const [avatarTemp, setAvatarTemp] = useState("");
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [abaPerfil, setAbaPerfil] = useState(null); // null = pop-up fechado | "dados" | "senha"
  const [petModal, setPetModal] = useState({ aberto: false, pet: null });
  const [enderecos, setEnderecos] = useState(null);
  const [erroEnderecos, setErroEnderecos] = useState("");
  const [secao, setSecao] = useState("");
  // Endereços e Formas de pagamento abrem no lugar do perfil, só pelo menu lateral
  // (perfil#enderecos e perfil#pagamentos também abrem direto)
  const [painel, setPainel] = useState(() =>
    PAINEIS.includes(location.hash.slice(1)) ? location.hash.slice(1) : null
  );
  const arquivo = useRef(null);

  const carregarPets = useCallback(async () => {
    try {
      setPets(await getJson(ENDPOINTS.pets, "Não foi possível carregar seus pets."));
      setErroPets("");
    } catch (err) {
      setErroPets(semServidor(err));
    }
  }, []);

  const carregarEnderecos = useCallback(async () => {
    try {
      setEnderecos(await buscarEnderecos(idCliente));
      setErroEnderecos("");
    } catch (err) {
      setErroEnderecos(semServidor(err));
    }
  }, [idCliente]);

  useEffect(() => {
    if (!logado) return; // a navegação já mostra o aviso de login
    (async () => {
      try {
        const dados = await getJson(`${ENDPOINTS.cliente}/${idCliente}`, "Não foi possível carregar seus dados.");
        localStorage.setItem("usuarioNome", dados.nome_completo);
        setCliente(dados);
      } catch (err) {
        setErroCliente(semServidor(err));
      }
    })();
    carregarEnderecos();
    carregarPets();
    buscarFavoritos()
      .then(setFavoritos)
      .catch(err => setErroFavoritos(semServidor(err)));
  }, [logado, idCliente, carregarPets, carregarEnderecos]);

  useEffect(() => {
    if (cliente) document.title = `${cliente.nome_completo} | Happy Snouts`;
  }, [cliente]);

  useEffect(() => {
    const io = new IntersectionObserver(
      es =>
        es.forEach(en => {
          if (en.isIntersecting) setSecao(en.target.id);
        }),
      { rootMargin: "-25% 0px -65% 0px" }
    );
    ["sobre", "pets", "favoritos"].forEach(id => io.observe(document.getElementById(id)));
    return () => io.disconnect();
  }, []);

  const trocarFoto = async e => {
    const escolhido = e.target.files[0];
    e.target.value = "";
    if (!escolhido || !cliente) return;
    setEnviandoFoto(true);
    try {
      const foto = await reduzirImagem(escolhido, { lado: 480, quadrada: true });
      setAvatarTemp(URL.createObjectURL(foto));
      const caminho = await enviarImagem(foto);
      await enviar(
        `${ENDPOINTS.cliente}/${idCliente}`,
        "PUT",
        { foto_url: caminho },
        "Não foi possível salvar a foto."
      );
      setCliente(c => ({ ...c, foto_url: caminho }));
      avisar("Foto de perfil atualizada!");
    } catch (err) {
      avisar(semServidor(err), "erro");
    } finally {
      setAvatarTemp("");
      setEnviandoFoto(false);
    }
  };

  const desfavoritar = async p => {
    try {
      if (!(await alternarFavorito(p.id, false))) return;
      setFavoritos(fs => fs.filter(x => x.id !== p.id));
      avisar(`${p.nome} saiu dos favoritos`);
    } catch (err) {
      avisar(semServidor(err), "erro");
    }
  };

  const endAtual = enderecos?.find(e => e.padrao) || enderecos?.[0];
  const cidade = endAtual ? `${endAtual.cidade} - ${endAtual.estado}` : "";
  const fotoPerfil = avatarTemp || urlImagem(cliente?.foto_url);
  const nomes = (pets || []).map(p => p.nome_pet);
  const resumoPets = !pets
    ? ""
    : !nomes.length
      ? "Cadastre seu pet para acompanhar tudo por aqui 🐾"
      : nomes.length === 1
        ? `Tutor(a) de ${nomes[0]} 💛`
        : `Tutor(a) de ${nomes.slice(0, -1).join(", ")} e ${nomes.at(-1)} 💛`;

  const linha = (icone, rotulo, valor) => (
    <li key={rotulo}>
      <Icone id={icone} />
      <span>
        <small>{rotulo}</small>
        {valor || <em>Não informado</em>}
      </span>
    </li>
  );
  const abrirPet = pet => setPetModal({ aberto: true, pet: pet || null });
  const atual = id =>
    painel ? String(painel === id) : PAINEIS.includes(id) ? undefined : secao ? String(secao === id) : undefined;

  const topoDaPagina = () => document.querySelector(".cols")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const abrirPainel = (e, qual) => {
    e.preventDefault();
    setPainel(qual);
    history.replaceState(history.state, "", `#${qual}`);
    topoDaPagina();
  };
  const irParaSecao = (e, id) => {
    if (!painel) return; // o link #id já rola sozinho
    e.preventDefault();
    setPainel(null);
    history.replaceState(history.state, "", id ? `#${id}` : location.pathname);
    setTimeout(() => (id ? document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }) : topoDaPagina()));
  };

  return (
    <>
      <PerfilIcones />
      <Header atual="perfil" />

      <main className="wrap hs-container">
        <section className="hero" aria-label="Cabeçalho do perfil">
          <svg className="orn o1">
            <use href="#paw" />
          </svg>
          <svg className="orn o2">
            <use href="#heart" />
          </svg>
          <svg className="orn o3">
            <use href="#paw" />
          </svg>
          <svg className="orn o4">
            <use href="#heart" />
          </svg>
          <div className="avwrap">
            <div className="avatar" id="avatar">
              {fotoPerfil ? <FotoAvatar src={fotoPerfil} nome={cliente?.nome_completo} /> : <Icone id="paw" />}
            </div>
            <button
              type="button"
              className="cam"
              id="camBtn"
              aria-label="Alterar foto de perfil"
              disabled={enviandoFoto}
              onClick={() => arquivo.current.click()}
            >
              <Icone id="camera" />
            </button>
            <input
              type="file"
              id="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              ref={arquivo}
              onChange={trocarFoto}
            />
          </div>
          <div className="who">
            <h1>
              <span id="nome">
                {cliente
                  ? cliente.nome_completo
                  : erroCliente
                    ? localStorage.getItem("usuarioNome") || "Meu perfil"
                    : "Carregando..."}
              </span>
              <Icone id="paw" />
            </h1>
            <p className="apres" id="usuario">
              {cliente ? "@" + cliente.nome_usuario : ""}
            </p>
            <p className="frase" id="resumoPets">
              {resumoPets}
            </p>
          </div>
        </section>

        <div className="cols">
          <aside className="side">
            <nav className="menu" aria-label="Seções do perfil">
              <a href="#sobre" data-t="sobre" aria-current={atual("sobre")} onClick={e => irParaSecao(e, "sobre")}>
                <Icone id="user" />
                Meus dados
              </a>
              <a
                href="#enderecos"
                data-t="enderecos"
                aria-current={atual("enderecos")}
                onClick={e => abrirPainel(e, "enderecos")}
              >
                <Icone id="pin" />
                Endereços
              </a>
              <a
                href="#pagamentos"
                data-t="pagamentos"
                aria-current={atual("pagamentos")}
                onClick={e => abrirPainel(e, "pagamentos")}
              >
                <Icone id="card" />
                Formas de pagamento
              </a>
              <a href="#pets" data-t="pets" aria-current={atual("pets")} onClick={e => irParaSecao(e, "pets")}>
                <Icone id="paw" />
                Meus pets
              </a>
              <a
                href="#favoritos"
                data-t="favoritos"
                aria-current={atual("favoritos")}
                onClick={e => irParaSecao(e, "favoritos")}
              >
                <Icone id="heart" />
                Favoritos
              </a>
              <Link to="/pedidos">
                <Icone id="box" />
                Meus pedidos
              </Link>
              <Link to="/calendario">
                <Icone id="agenda" />
                Agenda do pet
              </Link>
              <Link to="/carrinho">
                <Icone id="cart" />
                Meu carrinho
              </Link>
              <button
                type="button"
                className="sair"
                id="sairBtn"
                onClick={async () => {
                  const ok = await confirmar({
                    titulo: "Sair da sua conta?",
                    mensagem: "Seus dados e seus pets ficam salvos. Para voltar, é só entrar de novo.",
                    botao: "Sair",
                    tipo: "sair"
                  });
                  if (ok) sair();
                }}
              >
                <Icone id="out" />
                Sair da conta
              </button>
            </nav>
          </aside>

          {painel && (
            <div className="main">
              <button type="button" className="voltar-perfil" onClick={e => irParaSecao(e, null)}>
                <span aria-hidden="true">‹</span> Voltar ao perfil
              </button>
              {painel === "enderecos" ? (
                <SecaoEnderecos enderecos={enderecos} erro={erroEnderecos} aoRecarregar={carregarEnderecos} />
              ) : (
                <SecaoPagamentos ativo={logado} />
              )}
            </div>
          )}

          <div className="main" hidden={Boolean(painel)}>
            <section id="sobre" className="box">
              <div className="sh">
                <h2>
                  <Icone id="user" />
                  Meus dados
                </h2>
                <button type="button" className="lk" id="editBtn" onClick={() => cliente && setAbaPerfil("dados")}>
                  <Icone id="pen" />
                  Editar perfil
                </button>
              </div>
              <ul className="dados" id="dados" aria-live="polite">
                {cliente ? (
                  [
                    linha("mail", "E-mail", cliente.email),
                    linha("phone", "Telefone", telefoneBr(cliente.telefone)),
                    linha("cake", "Data de nascimento", dataBr(cliente.data_nascimento)),
                    linha("pin", "Cidade", cidade),
                    linha("paw", "Membro desde", mesAno(cliente.data_cadastro))
                  ]
                ) : (
                  <li className="empty">{erroCliente || "Carregando seus dados..."}</li>
                )}
              </ul>
            </section>

            <section id="pets" className="box">
              <div className="sh">
                <h2>
                  <Icone id="paw" />
                  Meus pets
                </h2>
              </div>
              <div id="petsGrid" className="petgrid" aria-live="polite">
                {erroPets ? (
                  <p className="empty">{erroPets}</p>
                ) : !pets ? (
                  <p className="empty">Carregando seus pets...</p>
                ) : pets.length ? (
                  <>
                    {pets.map(p => (
                      <article className="pet" data-id={p.id_pet} key={p.id_pet}>
                        <div className="pfoto">
                          <FotoComPatinha
                            src={p.foto_url ? urlImagem(p.foto_url) : ""}
                            alt={`Foto de ${p.nome_pet}`}
                            loading="lazy"
                          />
                        </div>
                        <div className="pinfo">
                          <h3>{p.nome_pet}</h3>
                          <p>
                            {[
                              p.raca,
                              p.idade_pet != null ? anos(p.idade_pet) : "",
                              p.peso_atual != null ? peso(p.peso_atual) : ""
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="lk"
                          aria-label={`Editar ${p.nome_pet}`}
                          onClick={() => abrirPet(p)}
                        >
                          <Icone id="pen" />
                          Editar
                        </button>
                      </article>
                    ))}
                    <button type="button" className="pet novo" onClick={() => abrirPet()}>
                      <Icone id="plus" />
                      Adicionar pet
                    </button>
                  </>
                ) : (
                  <div className="empty">
                    Você ainda não cadastrou nenhum pet. 🐾
                    <br />
                    <button type="button" className="btn sm" onClick={() => abrirPet()}>
                      <Icone id="plus" />
                      Cadastrar meu primeiro pet
                    </button>
                  </div>
                )}
              </div>
            </section>

            <section id="favoritos" className="box">
              <div className="sh">
                <h2>
                  <Icone id="heart" />
                  Produtos favoritos
                </h2>
                <Link to="/favoritos">Ver todos ›</Link>
              </div>
              <div id="favProds" className="pgrid">
                {erroFavoritos ? (
                  <p className="empty">{erroFavoritos}</p>
                ) : !favoritos ? (
                  <p className="empty">Carregando...</p>
                ) : favoritos.length ? (
                  favoritos.slice(0, 4).map(p => <CartaoFavorito key={p.id} produto={p} aoRemover={desfavoritar} />)
                ) : (
                  <p className="empty">
                    Nenhum produto favoritado ainda. <Link to="/produtos">Ver produtos</Link>
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />

      <ModalPerfil
        aba={abaPerfil}
        cliente={cliente}
        idCliente={idCliente}
        aoTrocarAba={setAbaPerfil}
        aoFechar={() => setAbaPerfil(null)}
        aoSalvarDados={dados => {
          setCliente(c => ({ ...c, ...dados }));
          localStorage.setItem("usuarioNome", dados.nome_completo);
        }}
      />
      <ModalPet
        aberto={petModal.aberto}
        pet={petModal.pet}
        aoFechar={() => setPetModal(m => ({ ...m, aberto: false }))}
        aoSalvo={carregarPets}
      />
    </>
  );
}

function FotoAvatar({ src, nome }) {
  const [erro, setErro] = useState(false);
  useEffect(() => setErro(false), [src]);
  return erro ? (
    <Icone id="paw" />
  ) : (
    <img src={src} alt={`Foto de perfil de ${nome || ""}`} onError={() => setErro(true)} />
  );
}
