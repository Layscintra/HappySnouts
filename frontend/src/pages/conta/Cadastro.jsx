import { useRef, useState } from "react";
import { Link } from "react-router";
import {
  TelaAuth,
  Destaque,
  Descricao,
  PilulaEmail,
  BotaoAuth,
  MensagemAuth,
  AcoesCodigo,
  CodigoOTP,
  useContagem
} from "../../components/auth/AuthTela.jsx";
import {
  API_URL,
  ENDPOINTS,
  USUARIO_MAX,
  api,
  destinoAposLogin,
  erroCpf,
  erroEmail,
  erroNomeCompleto,
  erroNomeUsuario,
  erroTelefone
} from "../../lib/api.js";
import { navegar } from "../../lib/navegar.js";

const ESTADOS = [
  ["AC", "Acre"],
  ["AL", "Alagoas"],
  ["AP", "Amapá"],
  ["AM", "Amazonas"],
  ["BA", "Bahia"],
  ["CE", "Ceará"],
  ["DF", "Distrito Federal"],
  ["ES", "Espírito Santo"],
  ["GO", "Goiás"],
  ["MA", "Maranhão"],
  ["MT", "Mato Grosso"],
  ["MS", "Mato Grosso do Sul"],
  ["MG", "Minas Gerais"],
  ["PA", "Pará"],
  ["PB", "Paraíba"],
  ["PR", "Paraná"],
  ["PE", "Pernambuco"],
  ["PI", "Piauí"],
  ["RJ", "Rio de Janeiro"],
  ["RN", "Rio Grande do Norte"],
  ["RS", "Rio Grande do Sul"],
  ["RO", "Rondônia"],
  ["RR", "Roraima"],
  ["SC", "Santa Catarina"],
  ["SP", "São Paulo"],
  ["SE", "Sergipe"],
  ["TO", "Tocantins"]
];

const onlyDigits = str => str.replace(/\D/g, "");
const maskCPF = v =>
  onlyDigits(v)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
const maskTelefone = v =>
  onlyDigits(v)
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
const maskData = v =>
  onlyDigits(v)
    .slice(0, 8)
    .replace(/^(\d{2})(\d)/, "$1/$2")
    .replace(/^(\d{2})\/(\d{2})(\d)/, "$1/$2/$3");
const maskCEP = v =>
  onlyDigits(v)
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, "$1-$2");
const MASCARAS = { cpf: maskCPF, telefone: maskTelefone, nascimento: maskData, cep: maskCEP };

// idade mínima para criar conta (o backend confere de novo)
const IDADE_MINIMA = 16;
// senha mínima: a mesma do backend e do app
const SENHA_MINIMA = 6;
function idade(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  const hoje = new Date();
  let anos = hoje.getFullYear() - a;
  if (hoje.getMonth() + 1 < m || (hoje.getMonth() + 1 === m && hoje.getDate() < d)) anos--;
  return anos;
}

// dd/mm/aaaa -> aaaa-mm-dd (formato DATE do MySQL), ou null se a data não existir
function dataIso(texto) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto || "");
  if (!m) return null;
  const [, dd, mm, aaaa] = m;
  const d = new Date(`${aaaa}-${mm}-${dd}T12:00:00`);
  if (isNaN(d) || d.getDate() !== Number(dd) || d > new Date() || Number(aaaa) < 1900) return null;
  return `${aaaa}-${mm}-${dd}`;
}

const VAZIO = {
  nome: "",
  nome_usuario: "",
  email: "",
  cpf: "",
  telefone: "",
  nascimento: "",
  senha: "",
  confirmar_senha: "",
  cep: "",
  estado: "",
  bairro: "",
  cidade: "",
  endereco: "",
  numero: "",
  complemento: ""
};

const Icone = ({ children }) => (
  <svg className="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
    {children}
  </svg>
);
const IconePessoa = () => (
  <Icone>
    <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
  </Icone>
);
const IconeCadeado = () => (
  <Icone>
    <rect x="5" y="10" width="14" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 018 0v3" />
  </Icone>
);
const Patinha = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
    <circle cx="7" cy="8" r="2" />
    <circle cx="12" cy="5.6" r="1.8" />
    <circle cx="17" cy="8" r="2" />
    <path d="M12 10.6c2.7 0 5.4 1.8 5.4 4.3 0 1.9-1.6 2.9-3.5 2.6-1.1-.2-1.5-.6-1.9-.6s-.8.4-1.9.6c-1.9.3-3.5-.7-3.5-2.6 0-2.5 2.7-4.3 5.4-4.3z" />
  </svg>
);

function BotaoOlho({ mostrando, aoClicar }) {
  return (
    <button
      type="button"
      className="toggle-eye"
      aria-label={mostrando ? "Ocultar senha" : "Mostrar senha"}
      onClick={aoClicar}
    >
      <svg
        className="eye-open"
        viewBox="0 0 24 24"
        width="17"
        height="17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        style={mostrando ? { display: "none" } : undefined}
      >
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <svg
        className="eye-closed"
        viewBox="0 0 24 24"
        width="17"
        height="17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        style={mostrando ? undefined : { display: "none" }}
      >
        <path d="M3 3l18 18M10.6 10.6a3 3 0 004.2 4.2M9.9 5.1A11 11 0 0123 12s-1.5 2.6-4.2 4.6M6.5 6.5C3.9 8.1 1 12 1 12s1.7 3 4.9 5" />
      </svg>
    </button>
  );
}

export default function Cadastro() {
  const [f, setF] = useState(VAZIO);
  const [ver, setVer] = useState({ senha: false, confirmar: false });
  const [semNumero, setSemNumero] = useState(false);
  const [termos, setTermos] = useState(false);
  const [cepInfo, setCepInfo] = useState("");
  const [msg, setMsg] = useState({ texto: "", tipo: "" });
  const [enviando, setEnviando] = useState(false);
  const form = useRef(null);
  const ultimoCep = useRef("");
  const campo = id => form.current.querySelector(`#${id}`);

  const senhasDiferentes = f.confirmar_senha && f.senha !== f.confirmar_senha;

  const mudar = e => {
    const { name, value } = e.target;
    const valor = MASCARAS[name] ? MASCARAS[name](value) : value;
    e.target.setCustomValidity?.("");
    setF(atual => ({ ...atual, [name]: valor }));
    if (name === "cep") buscarCep(valor);
  };

  // CEP: preenche o endereço (o backend consulta o ViaCEP)
  async function buscarCep(valor) {
    const d = onlyDigits(valor);
    if (d.length !== 8) {
      setCepInfo("");
      ultimoCep.current = "";
      return;
    }
    if (d === ultimoCep.current) return;
    ultimoCep.current = d;
    setCepInfo("Buscando endereço...");
    try {
      const r = await fetch(`${API_URL}${ENDPOINTS.cep}/${d}`);
      const v = await r.json().catch(() => ({}));
      if (d !== ultimoCep.current) return; // o CEP mudou enquanto buscava
      if (!r.ok) {
        setCepInfo(
          r.status === 404 ? "CEP não encontrado. Preencha à mão." : "Não deu para buscar o CEP. Preencha à mão."
        );
        return;
      }
      setF(atual => ({
        ...atual,
        endereco: v.rua || atual.endereco,
        bairro: v.bairro || atual.bairro,
        cidade: v.cidade || atual.cidade,
        estado: v.estado || atual.estado
      }));
      setCepInfo("");
      setTimeout(() => campo(v.rua ? "numero" : "endereco")?.focus());
    } catch {
      setCepInfo("Não deu para buscar o CEP. Preencha à mão.");
    }
  }

  const alternarSemNumero = marcado => {
    setSemNumero(marcado);
    setF(atual => ({ ...atual, numero: marcado ? "S/N" : "" }));
    if (!marcado) setTimeout(() => campo("numero")?.focus());
  };

  const avisoObrigatorio = aviso => e => e.target.setCustomValidity(e.target.value.trim() ? "" : aviso);

  const cadastrar = async e => {
    e.preventDefault();
    setMsg({ texto: "", tipo: "" });
    const erro = (texto, id) => {
      setMsg({ texto, tipo: "bad" });
      campo(id)?.focus();
    };

    if (!form.current.checkValidity()) {
      form.current.reportValidity();
      return;
    }
    if (senhasDiferentes) {
      campo("confirmar-senha").focus();
      return;
    }

    const erroNome = erroNomeCompleto(f.nome);
    if (erroNome) return erro(erroNome, "nome");
    const erroUsuario = erroNomeUsuario(f.nome_usuario);
    if (erroUsuario) return erro(erroUsuario, "nome_usuario");
    const erroMail = erroEmail(f.email);
    if (erroMail) return erro(erroMail, "email");
    const erroDoCpf = erroCpf(f.cpf);
    if (erroDoCpf) return erro(erroDoCpf, "cpf");
    if (f.senha.length < SENHA_MINIMA)
      return erro(`A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`, "senha");
    const erroTel = erroTelefone(f.telefone);
    if (erroTel) return erro(erroTel, "telefone");
    const dataNascimento = dataIso(f.nascimento);
    if (!dataNascimento) return erro("Confira a data de nascimento (dd/mm/aaaa).", "nascimento");
    if (idade(dataNascimento) < IDADE_MINIMA)
      return erro(`Você precisa ter pelo menos ${IDADE_MINIMA} anos para se cadastrar.`, "nascimento");
    if (onlyDigits(f.cep).length !== 8) return erro("Digite o CEP completo.", "cep");

    setEnviando(true);
    setConfirmacao(c => ({ ...c, erro: "", aviso: "" }));
    const enviado = await enviarCodigo();
    setEnviando(false);
    if (enviado) setConfirmacao(c => ({ ...c, aberto: true, codigo: "" }));
  };

  const [confirmacao, setConfirmacao] = useState({ aberto: false, codigo: "", erro: "", aviso: "", enviando: false });
  // contagem para poder pedir outro código (o backend aceita 1 por minuto)
  const [espera, contarEspera] = useContagem();

  const voltarParaFormulario = () => {
    setConfirmacao(c => ({ ...c, aberto: false, erro: "", aviso: "" }));
    setTimeout(() => {
      const email = document.getElementById("email");
      email?.scrollIntoView({ block: "center" });
      email?.focus();
    });
  };

  async function enviarCodigo() {
    try {
      const r = await fetch(`${API_URL}${ENDPOINTS.codigoCadastro}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: f.email.trim(), nome: f.nome.trim() })
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        const texto = d.mensagem || "Não foi possível enviar o código.";
        // pediu há menos de 1 minuto: o código anterior ainda vale, então só abre a janela
        if (r.status === 429) {
          setConfirmacao(c => ({ ...c, erro: texto }));
          return true;
        }
        if (confirmacao.aberto) setConfirmacao(c => ({ ...c, erro: texto }));
        else {
          setMsg({ texto, tipo: "bad" });
          if (r.status === 400) campo("email")?.focus();
        }
        return false;
      }
      contarEspera(60);
      return true;
    } catch {
      const texto = "Não consegui falar com o servidor. O backend está rodando?";
      if (confirmacao.aberto) setConfirmacao(c => ({ ...c, erro: texto }));
      else setMsg({ texto, tipo: "bad" });
      return false;
    }
  }

  const reenviarCodigo = async () => {
    setConfirmacao(c => ({ ...c, erro: "", aviso: "", enviando: true }));
    const ok = await enviarCodigo();
    setConfirmacao(c => ({
      ...c,
      codigo: ok && !c.erro ? "" : c.codigo,
      enviando: false,
      aviso: ok && !c.erro ? "Enviamos um novo código. Use o mais recente." : ""
    }));
  };

  const confirmarCodigo = async e => {
    e.preventDefault();
    const codigo = onlyDigits(confirmacao.codigo);
    if (codigo.length !== 6) {
      setConfirmacao(c => ({ ...c, erro: "Digite os 6 números do código." }));
      return;
    }
    setConfirmacao(c => ({ ...c, erro: "", aviso: "", enviando: true }));
    const erroConta = await criarConta(codigo);
    if (erroConta) setConfirmacao(c => ({ ...c, erro: erroConta, enviando: false }));
  };

  const criarConta = async codigo => {
    const dataNascimento = dataIso(f.nascimento);
    try {
      const res = await fetch(`${API_URL}${ENDPOINTS.registrarCliente}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_completo: f.nome.trim(),
          nome_usuario: f.nome_usuario.trim(),
          email: f.email.trim(),
          cpf: onlyDigits(f.cpf),
          telefone: onlyDigits(f.telefone),
          data_nascimento: dataNascimento,
          senha: f.senha,
          codigo_email: codigo
        })
      });
      const dados = await res.json().catch(() => ({}));
      if (!res.ok) return dados.mensagem || dados.msg || "Não foi possível cadastrar.";
      // a tela de confirmação continua aberta mostrando o progresso até redirecionar
      setConfirmacao(c => ({ ...c, aviso: "E-mail confirmado! Criando sua conta... 🐾" }));
      setEnviando(true);

      // 2) loga automaticamente e salva o endereço (se der erro aqui, o cadastro já valeu)
      let enderecoSalvo = false;
      try {
        const login = await fetch(`${API_URL}${ENDPOINTS.login}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: f.email.trim(), senha: f.senha })
        });
        const l = await login.json();
        if (login.ok) {
          localStorage.setItem("token", l.token);
          localStorage.setItem("usuarioNome", f.nome.trim());

          // O banco não tem coluna de complemento: ele vai junto com a rua ("Rua A - Apto 12"),
          // igual ao app e aos outros formulários de endereço do site.
          const numero = (semNumero ? "S/N" : f.numero || "S/N").trim();
          const complemento = f.complemento.trim();
          const endereco = {
            cep: maskCEP(f.cep),
            estado: f.estado,
            cidade: f.cidade.trim(),
            bairro: f.bairro.trim(),
            endereco: complemento ? `${f.endereco.trim()} - ${complemento}` : f.endereco.trim(),
            numero,
            padrao: true
          };
          const resp = await api(ENDPOINTS.enderecos, { method: "POST", body: JSON.stringify(endereco) });
          enderecoSalvo = resp.ok;
        }
      } catch (erroEndereco) {
        console.warn("Cliente criado, mas o endereço não foi salvo:", erroEndereco);
      }

      setConfirmacao(c => ({
        ...c,
        aviso: enderecoSalvo
          ? "Cadastro realizado com sucesso! 🐾 Redirecionando..."
          : "Conta criada! 🐾 Não consegui salvar o endereço agora: você pode adicioná-lo ao finalizar a compra."
      }));
      setMsg({
        texto: enderecoSalvo
          ? "Cadastro realizado com sucesso! 🐾 Redirecionando..."
          : "Conta criada! 🐾 Não consegui salvar o endereço agora: você pode adicioná-lo ao finalizar a compra.",
        tipo: "ok"
      });
      setTimeout(
        () => {
          navegar(destinoAposLogin(), { replace: true });
        },
        enderecoSalvo ? 900 : 2600
      );
      return null;
    } catch (err) {
      return err instanceof TypeError ? "Não consegui falar com o servidor. O backend está rodando?" : err.message;
    }
  };

  const input = (name, props = {}) => (
    <input name={name} id={props.id || name} value={f[name]} onChange={mudar} required {...props} />
  );

  if (confirmacao.aberto) {
    return (
      <TelaAuth
        fundo="login"
        titulo={
          <>
            Confirme seu <Destaque>e-mail</Destaque>
          </>
        }
      >
        <form noValidate onSubmit={confirmarCodigo}>
          <Descricao>
            Falta pouco! Enviamos um código de 6 números para o e-mail abaixo. Confira também a caixa de spam.
          </Descricao>
          <PilulaEmail email={f.email.trim()} />
          <CodigoOTP
            autoFocus
            valor={confirmacao.codigo}
            invalido={Boolean(confirmacao.erro) && confirmacao.codigo.length < 6}
            aoMudar={v => setConfirmacao(c => ({ ...c, codigo: v, erro: "" }))}
          />
          <BotaoAuth carregando={confirmacao.enviando}>
            {confirmacao.enviando ? "Criando sua conta..." : "Confirmar e criar conta"}
          </BotaoAuth>
          <MensagemAuth
            texto={confirmacao.erro || confirmacao.aviso}
            tipo={confirmacao.erro ? "bad" : confirmacao.aviso ? "ok" : ""}
          />
          <AcoesCodigo
            espera={espera}
            ocupado={confirmacao.enviando}
            aoReenviar={reenviarCodigo}
            aoVoltar={voltarParaFormulario}
          />
        </form>
      </TelaAuth>
    );
  }

  return (
    <>
      <div className="paws" aria-hidden="true">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
          <img key={n} src="img/patinhas.png" className={`paw p${n}`} alt="" />
        ))}
      </div>

      <main className="card">
        <header className="card-header">
          <div className="title-block">
            <span className="paw-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                <circle cx="7" cy="8" r="2.4" />
                <circle cx="12.2" cy="5.6" r="2.2" />
                <circle cx="17.4" cy="8" r="2.4" />
                <path d="M12 11c3.2 0 6.4 2.1 6.4 5.1 0 2.2-1.9 3.4-4.1 3.1-1.3-.2-1.8-.7-2.3-.7s-1 .5-2.3.7c-2.2.3-4.1-.9-4.1-3.1C5.6 13.1 8.8 11 12 11z" />
              </svg>
            </span>
            <div>
              <h1>Crie sua conta</h1>
              <p className="subtitle">Preencha todos os dados abaixo para se cadastrar</p>
              <p className="obrigatorio-legenda">
                <b>*</b> Campos obrigatórios
              </p>
            </div>
          </div>
          <img src="img/logo-topo.png" alt="Happy Snouts" className="logo" />
        </header>

        <form id="cadastro-form" noValidate ref={form} onSubmit={cadastrar}>
          <h2 className="secao">Dados pessoais</h2>

          <div className="field full">
            <label htmlFor="nome">Nome completo</label>
            <div className="input-wrap">
              <IconePessoa />
              {input("nome", { type: "text", placeholder: "Digite seu nome completo" })}
            </div>
          </div>

          <div className="field full">
            <label htmlFor="nome_usuario">Nome de usuário</label>
            <div className="input-wrap">
              <IconePessoa />
              {input("nome_usuario", { type: "text", placeholder: "Letras, números, ponto ou _", maxLength: USUARIO_MAX })}
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <div className="input-wrap">
                <Icone>
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </Icone>
                {input("email", { type: "email", placeholder: "Digite seu e-mail" })}
              </div>
            </div>
            <div className="field">
              <label htmlFor="cpf">CPF</label>
              <div className="input-wrap no-icon">
                {input("cpf", { type: "text", placeholder: "000.000.000-00", inputMode: "numeric", maxLength: 14 })}
              </div>
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label htmlFor="telefone">Telefone</label>
              <div className="input-wrap">
                <Icone>
                  <path d="M4 5c0-1 1-2 2-2h2l2 5-2 1a11 11 0 006 6l1-2 5 2v2c0 1-1 2-2 2A15 15 0 014 5z" />
                </Icone>
                {input("telefone", {
                  type: "tel",
                  placeholder: "(11) 99999-9999",
                  inputMode: "numeric",
                  maxLength: 15
                })}
              </div>
            </div>
            <div className="field">
              <label htmlFor="nascimento">Data de nascimento</label>
              <div className="input-wrap">
                <Icone>
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M3 10h18M8 3v4M16 3v4" />
                </Icone>
                {input("nascimento", { type: "text", placeholder: "dd/mm/aaaa", inputMode: "numeric", maxLength: 10 })}
              </div>
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label htmlFor="senha">Senha</label>
              <div className="input-wrap">
                <IconeCadeado />
                {input("senha", { type: ver.senha ? "text" : "password", placeholder: `Mínimo de ${SENHA_MINIMA} caracteres`, minLength: SENHA_MINIMA })}
                <BotaoOlho mostrando={ver.senha} aoClicar={() => setVer(v => ({ ...v, senha: !v.senha }))} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="confirmar-senha">Confirmar senha</label>
              <div className="input-wrap">
                <IconeCadeado />
                {input("confirmar_senha", {
                  id: "confirmar-senha",
                  type: ver.confirmar ? "text" : "password",
                  placeholder: "Confirme sua senha",
                  minLength: SENHA_MINIMA
                })}
                <BotaoOlho
                  mostrando={ver.confirmar}
                  aoClicar={() => setVer(v => ({ ...v, confirmar: !v.confirmar }))}
                />
              </div>
              <span className="error-msg" id="senha-erro">
                {senhasDiferentes ? "As senhas não coincidem" : ""}
              </span>
            </div>
          </div>

          <h2 className="secao">Endereço de entrega</h2>

          <div className="row">
            <div className="field">
              <label htmlFor="cep">CEP</label>
              <div className="input-wrap no-icon">
                {input("cep", {
                  type: "text",
                  placeholder: "Digite seu CEP",
                  inputMode: "numeric",
                  maxLength: 9,
                  autoComplete: "postal-code"
                })}
              </div>
              <span className="dica" id="cep-info" aria-live="polite">
                {cepInfo}
              </span>
            </div>
            <div className="field">
              <label htmlFor="estado">Estado</label>
              <div className="input-wrap no-icon">
                <select id="estado" name="estado" required value={f.estado} onChange={mudar}>
                  <option value="" disabled>
                    selecione seu estado
                  </option>
                  {ESTADOS.map(([sigla, nome]) => (
                    <option key={sigla} value={sigla}>{`${nome} (${sigla})`}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label htmlFor="bairro">Bairro</label>
              <div className="input-wrap no-icon">
                {input("bairro", { type: "text", placeholder: "Digite seu bairro" })}
              </div>
            </div>
            <div className="field">
              <label htmlFor="cidade">Cidade</label>
              <div className="input-wrap no-icon">
                {input("cidade", { type: "text", placeholder: "Digite sua cidade" })}
              </div>
            </div>
          </div>

          <div className="field full">
            <label htmlFor="endereco">Endereço</label>
            <div className="input-wrap">
              <Icone>
                <path d="M12 21s7-6.5 7-11.5A7 7 0 105 9.5C5 14.5 12 21 12 21z" />
                <circle cx="12" cy="9.5" r="2.3" />
              </Icone>
              {input("endereco", { type: "text", placeholder: "Digite seu endereço" })}
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label htmlFor="numero">Número</label>
              <div className="input-wrap no-icon">
                {input("numero", {
                  type: "text",
                  placeholder: "Digite o seu número",
                  inputMode: "numeric",
                  disabled: semNumero,
                  onInvalid: avisoObrigatorio('Digite o número ou marque "Não tem número".')
                })}
              </div>
              <label className="mini-check">
                <input
                  type="checkbox"
                  id="sem-numero"
                  checked={semNumero}
                  onChange={e => alternarSemNumero(e.target.checked)}
                />
                <span>Não tem número</span>
              </label>
            </div>
            <div className="field">
              <label htmlFor="complemento">Complemento (opcional)</label>
              <div className="input-wrap no-icon">
                {input("complemento", {
                  type: "text",
                  placeholder: "Apto, bloco, casa...",
                  required: false
                })}
              </div>
            </div>
          </div>

          <label className="terms">
            <input type="checkbox" id="termos" required checked={termos} onChange={e => setTermos(e.target.checked)} />
            <span>
              Eu aceito os{" "}
              <a href="#" onClick={e => e.preventDefault()}>
                Termos de uso
              </a>{" "}
              e a{" "}
              <a href="#" onClick={e => e.preventDefault()}>
                Política de privacidade
              </a>
            </span>
          </label>

          <p className={"form-msg" + (msg.tipo ? " " + msg.tipo : "")} id="form-msg" role="status" aria-live="polite">
            {msg.texto}
          </p>

          <button type="submit" className="btn-cadastrar" disabled={enviando}>
            <Patinha /> Cadastrar <Patinha />
          </button>

          <p className="login-link">
            Já possui uma conta? <Link to="/login">Faça Login</Link>
          </p>
        </form>
      </main>
    </>
  );
}
