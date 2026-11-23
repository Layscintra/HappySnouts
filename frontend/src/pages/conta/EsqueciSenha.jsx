import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { InputSenha } from "../../components/auth/AuthLogin.jsx";
import {
  TelaAuth,
  Destaque,
  Descricao,
  PilulaEmail,
  Etapas,
  CampoAuth,
  BotaoAuth,
  MensagemAuth,
  AcoesCodigo,
  CodigoOTP,
  useContagem,
  IconeEnvelope,
  IconeCadeadoAuth,
  IconeSucesso
} from "../../components/auth/AuthTela.jsx";
import { API_URL, ENDPOINTS } from "../../lib/api.js";

const emailValido = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const ESPERA_REENVIO = 60; // o backend aceita 1 código por minuto
const ETAPAS = ["E-mail", "Código", "Nova senha"];
const NUMERO_ETAPA = { email: 0, codigo: 1, senha: 2 };

async function enviar(caminho, corpo) {
  let res;
  try {
    res = await fetch(`${API_URL}${caminho}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo)
    });
  } catch {
    throw new Error("Não consegui falar com o servidor. O backend está rodando?");
  }
  const dados = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(dados.mensagem || "Algo deu errado. Tente de novo.");
  return dados;
}

function emailSalvo() {
  try {
    const salvo = sessionStorage.getItem("emailRecuperacao") || "";
    sessionStorage.removeItem("emailRecuperacao");
    return salvo;
  } catch {
    return "";
  }
}

const TITULOS = {
  email: (
    <>
      Esqueceu sua <Destaque>senha</Destaque>?
    </>
  ),
  codigo: (
    <>
      Confira seu <Destaque>e-mail</Destaque>
    </>
  ),
  senha: (
    <>
      Crie uma nova <Destaque>senha</Destaque>
    </>
  ),
  pronto: (
    <>
      Tudo <Destaque>pronto</Destaque>!
    </>
  )
};

export default function EsqueciSenha() {
  const [passo, setPasso] = useState("email");
  const [email, setEmail] = useState(emailSalvo);
  const [codigo, setCodigo] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const [erros, setErros] = useState({});
  const [msg, setMsg] = useState({ texto: "", tipo: "" });
  const [esperando, setEsperando] = useState("");
  const [espera, setEspera] = useContagem();
  const refEmail = useRef(null);
  const refSenha = useRef(null);

  const erro = (campo, texto) => setErros(e => ({ ...e, [campo]: texto }));
  const emailLimpo = email.trim().toLowerCase();

  useEffect(() => {
    if (passo === "email") refEmail.current?.focus();
    if (passo === "senha") refSenha.current?.focus();
  }, [passo]);

  const irPara = p => {
    setPasso(p);
    setErros({});
    setMsg({ texto: "", tipo: "" });
  };

  async function comBotao(textoEspera, acao) {
    setEsperando(textoEspera);
    try {
      await acao();
    } catch (err) {
      setMsg({ texto: err.message, tipo: "bad" });
    } finally {
      setEsperando("");
    }
  }

  const enviarEmail = e => {
    e.preventDefault();
    const v = email.trim();
    if (!v) return erro("email", "Informe seu e-mail.");
    if (!emailValido(v)) return erro("email", "Esse e-mail parece incompleto. Confira e tente de novo.");
    erro("email", "");
    comBotao("Enviando código...", async () => {
      await enviar(ENDPOINTS.esqueciSenha, { email: v.toLowerCase() });
      setCodigo("");
      setEspera(ESPERA_REENVIO);
      irPara("codigo");
    });
  };

  const conferirCodigo = e => {
    e.preventDefault();
    if (codigo.length !== 6) return erro("codigo", "Digite os 6 números do código.");
    comBotao("Conferindo...", async () => {
      await enviar(ENDPOINTS.verificarCodigo, { email: emailLimpo, codigo });
      setNovaSenha("");
      setConfirmaSenha("");
      irPara("senha");
    });
  };

  const reenviar = async () => {
    setMsg({ texto: "Enviando um novo código...", tipo: "" });
    try {
      await enviar(ENDPOINTS.esqueciSenha, { email: emailLimpo });
      setCodigo("");
      setEspera(ESPERA_REENVIO);
      setMsg({ texto: "Enviamos um novo código. Use o mais recente.", tipo: "ok" });
    } catch (err) {
      setMsg({ texto: err.message, tipo: "bad" });
    }
  };

  const salvarSenha = e => {
    e.preventDefault();
    let ok = true;
    if (novaSenha.length < 6) {
      erro("novaSenha", "A senha precisa ter pelo menos 6 caracteres.");
      ok = false;
    }
    if (confirmaSenha !== novaSenha) {
      erro("confirmaSenha", "As senhas não são iguais.");
      ok = false;
    }
    if (!ok) return;
    comBotao("Salvando...", async () => {
      await enviar(ENDPOINTS.redefinirSenha, { email: emailLimpo, codigo, nova_senha: novaSenha });
      irPara("pronto");
    });
  };

  const inv = campo => (erros[campo] ? "true" : "false");
  const botao = texto => <BotaoAuth carregando={Boolean(esperando)}>{esperando || texto}</BotaoAuth>;

  return (
    <TelaAuth titulo={TITULOS[passo]} fundo="login">
      {passo !== "pronto" && <Etapas nomes={ETAPAS} atual={NUMERO_ETAPA[passo]} />}

      {passo === "email" && (
        <form noValidate onSubmit={enviarEmail}>
          <Descricao>
            Sem problemas! Digite o e-mail da sua conta e enviaremos um <b>código de 6 números</b> para você criar uma
            senha nova.
          </Descricao>
          <CampoAuth id="email" rotulo="E-mail da conta" icone={<IconeEnvelope />} erro={erros.email}>
            <input
              ref={refEmail}
              id="email"
              name="email"
              type="email"
              inputMode="email"
              placeholder="seuemail@exemplo.com"
              autoComplete="email"
              required
              aria-invalid={inv("email")}
              aria-describedby="emailErro"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                erro("email", "");
              }}
            />
          </CampoAuth>
          {botao("Enviar código")}
        </form>
      )}

      {passo === "codigo" && (
        <form noValidate onSubmit={conferirCodigo}>
          <Descricao>Enviamos um código de 6 números para:</Descricao>
          <PilulaEmail email={email.trim()} />
          <CodigoOTP
            autoFocus
            valor={codigo}
            invalido={Boolean(erros.codigo)}
            aoMudar={v => {
              setCodigo(v);
              erro("codigo", "");
            }}
          />
          <p className="at-erro" role="alert" style={{ textAlign: "center", margin: "-8px 0 14px" }}>
            {erros.codigo}
          </p>
          {botao("Confirmar código")}
          <AcoesCodigo
            espera={espera}
            ocupado={Boolean(esperando)}
            aoReenviar={reenviar}
            aoVoltar={() => irPara("email")}
          />
        </form>
      )}

      {passo === "senha" && (
        <form noValidate onSubmit={salvarSenha}>
          <Descricao>Código confirmado! Escolha uma senha nova com pelo menos 6 caracteres.</Descricao>
          <CampoAuth id="novaSenha" rotulo="Nova senha" icone={<IconeCadeadoAuth />} erro={erros.novaSenha}>
            <InputSenha
              inputRef={refSenha}
              id="novaSenha"
              name="novaSenha"
              placeholder="Mínimo de 6 caracteres"
              autoComplete="new-password"
              required
              aria-invalid={inv("novaSenha")}
              aria-describedby="novaSenhaErro"
              value={novaSenha}
              onChange={e => {
                setNovaSenha(e.target.value);
                erro("novaSenha", "");
              }}
            />
          </CampoAuth>
          <CampoAuth
            id="confirmaSenha"
            rotulo="Confirme a nova senha"
            icone={<IconeCadeadoAuth />}
            erro={erros.confirmaSenha}
          >
            <InputSenha
              id="confirmaSenha"
              name="confirmaSenha"
              placeholder="Digite a senha de novo"
              autoComplete="new-password"
              required
              aria-invalid={inv("confirmaSenha")}
              aria-describedby="confirmaSenhaErro"
              value={confirmaSenha}
              onChange={e => {
                setConfirmaSenha(e.target.value);
                erro("confirmaSenha", "");
              }}
            />
          </CampoAuth>
          {botao("Salvar nova senha")}
        </form>
      )}

      {passo === "pronto" && (
        <div>
          <IconeSucesso />
          <Descricao>Sua senha foi alterada com sucesso. Agora é só entrar com a senha nova.</Descricao>
          <Link className="at-btn" to="/login">
            <span>Voltar para o login</span>
          </Link>
        </div>
      )}

      <MensagemAuth texto={msg.texto} tipo={msg.tipo} />

      {passo !== "pronto" && (
        <p className="at-rodape-card">
          Lembrou a senha? <Link to="/login">Entrar</Link>
        </p>
      )}
    </TelaAuth>
  );
}
