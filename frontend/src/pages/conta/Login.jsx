// Login único: cliente e funcionário entram pelo mesmo formulário.
// O backend (/auth/login) descobre quem é pelo e-mail e devolve o "tipo".
import { useRef, useState } from "react";
import { Link } from "react-router";
import {
  AuthSprite,
  AuthHero,
  AuthCard,
  Campo,
  InputSenha,
  BotaoPrimario,
  IconeUsuario,
  IconeCadeado
} from "../../components/auth/AuthLogin.jsx";
import { API_URL, ENDPOINTS, PAGINAS, dadosDoToken, destinoAposLogin } from "../../lib/api.js";
import { navegar } from "../../lib/navegar.js";

function validar(email, senha) {
  const erros = {};
  const u = email.trim();
  if (!u) erros.user = "Informe seu e-mail.";
  else if (u.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(u))
    erros.user = "Esse e-mail parece incompleto. Confira e tente de novo.";
  if (!senha) erros.password = "Informe sua senha.";
  else if (senha.length < 6) erros.password = "A senha tem no mínimo 6 caracteres.";
  return erros;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erros, setErros] = useState({});
  const [msg, setMsg] = useState({ texto: "", tipo: "" });
  const [enviando, setEnviando] = useState(false);
  const refEmail = useRef(null);
  const refSenha = useRef(null);

  const aoDigitar = (setter, campo) => e => {
    setter(e.target.value);
    if (erros[campo]) {
      const novos = validar(campo === "user" ? e.target.value : email, campo === "password" ? e.target.value : senha);
      setErros(novos);
    }
    setMsg({ texto: "", tipo: "" });
  };

  const entrar = async e => {
    e.preventDefault();
    setMsg({ texto: "", tipo: "" });
    const novos = validar(email, senha);
    setErros(novos);
    if (novos.user) {
      refEmail.current.focus();
      return;
    }
    if (novos.password) {
      refSenha.current.focus();
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(`${API_URL}${ENDPOINTS.login}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), senha })
      });
      const dados = await res.json().catch(() => ({}));
      // 404 (e-mail sem conta) e 401 (senha errada) dão a mesma mensagem, como no app:
      // assim a tela não revela quem tem conta. 403 e 400 mostram o aviso do backend.
      if (res.status === 404 || res.status === 401) throw new Error("E-mail ou senha incorretos.");
      if (!res.ok) throw new Error(dados.mensagem || "E-mail ou senha incorretos.");

      localStorage.setItem("token", dados.token);
      const info = dadosDoToken();
      if (info?.nome) localStorage.setItem("usuarioNome", info.nome); // blog/perfil usam este nome
      const ehFuncionario = (dados.tipo || info?.tipo) === "funcionario";

      setMsg({
        texto: ehFuncionario ? "Olá, funcionário! Abrindo o painel..." : "Login realizado! Redirecionando...",
        tipo: "ok"
      });
      setTimeout(() => {
        navegar(ehFuncionario ? PAGINAS.painelFuncionario : destinoAposLogin(), { replace: true });
      }, 600);
    } catch (err) {
      const semServidor = err instanceof TypeError; // fetch falhou: backend desligado / CORS
      setMsg({
        texto: semServidor ? "Não consegui falar com o servidor. O backend está rodando?" : err.message,
        tipo: "bad"
      });
    } finally {
      setEnviando(false);
    }
  };

  // "Esqueci minha senha": leva o e-mail já digitado para a outra tela
  // (pelo sessionStorage, para o e-mail não aparecer na URL)
  const lembrarEmail = () => {
    try {
      sessionStorage.setItem("emailRecuperacao", email.trim());
    } catch {}
  };

  return (
    <>
      <AuthSprite />
      <main className="page">
        <AuthHero />
        <AuthCard titulo="Login do Usuário">
          <form id="loginForm" noValidate onSubmit={entrar}>
            <Campo id="user" rotulo="E-mail" icone={<IconeUsuario />} erro={erros.user}>
              <input
                ref={refEmail}
                id="user"
                name="user"
                type="text"
                placeholder="Digite seu e-mail"
                autoComplete="username"
                required
                aria-invalid={erros.user ? "true" : "false"}
                value={email}
                onChange={aoDigitar(setEmail, "user")}
              />
            </Campo>

            <Campo id="password" erroId="passError" rotulo="Senha" icone={<IconeCadeado />} erro={erros.password}>
              <InputSenha
                inputRef={refSenha}
                id="password"
                name="password"
                botaoId="togglePass"
                placeholder="Digite sua senha"
                autoComplete="current-password"
                required
                aria-invalid={erros.password ? "true" : "false"}
                value={senha}
                onChange={aoDigitar(setSenha, "password")}
                aoAlternar={() => refSenha.current?.focus()}
              />
            </Campo>

            <Link className="forgot" to="/esqueci-senha" id="forgotLink" onClick={lembrarEmail}>
              Esqueci minha senha
            </Link>

            <BotaoPrimario id="submitBtn" texto={enviando ? "ENTRANDO..." : "ENTRAR"} disabled={enviando} />
            <p className={"form-msg" + (msg.tipo ? " " + msg.tipo : "")} id="formMsg" role="status">
              {msg.texto}
            </p>
          </form>

          <p className="signup">
            Ainda não possui uma conta? <Link to="/cadastro">Cadastre-se</Link>
          </p>
        </AuthCard>
      </main>
    </>
  );
}
