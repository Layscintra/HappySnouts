import { useCallback, useEffect, useState } from "react";
import Footer from "../components/layout/Footer.jsx";
import Header from "../components/layout/Header.jsx";
import IconesTopo from "../components/layout/IconesTopo.jsx";
import { ENDPOINTS, clienteLogado, dadosDoToken, pedir, semServidor } from "../lib/api.js";

export const EMAIL_CONTATO = "snoutshappy@gmail.com";

// mesmos assuntos do app (o backend só aceita estes)
const ASSUNTOS = ["Dúvida", "Pedido", "Problema no app", "Dispositivos", "Sugestão", "Outro"];
const STATUS = {
  aberta: { texto: "Aguardando resposta", cor: "laranja" },
  respondida: { texto: "Respondida", cor: "verde" },
  fechada: { texto: "Encerrada", cor: "cinza" }
};
const SECOES = [
  ["fale-conosco", "Fale conosco"],
  ["missao", "Nossa missão"],
  ["trabalhe-conosco", "Trabalhe conosco"],
  ["trocas", "Trocas e devoluções"],
  ["pagamento", "Formas de pagamento"],
  ["entregas", "Entregas e prazos"]
];
const emailValido = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const dataHora = d =>
  d
    ? new Date(d).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "";
const protocolo = id => `#${String(id).padStart(5, "0")}`;

const Icone = ({ children }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);
const IconeSuporte = () => (
  <Icone>
    <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
    <rect x="3" y="13" width="4" height="6" rx="2" />
    <rect x="17" y="13" width="4" height="6" rx="2" />
    <path d="M19 19c0 1.5-2 2.5-5 2.5" />
  </Icone>
);
const IconeEmail = () => (
  <Icone>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m3.8 7 8.2 6 8.2-6" />
  </Icone>
);
const IconeLocal = () => (
  <Icone>
    <path d="M12 21s7-6.4 7-11.4a7 7 0 1 0-14 0C5 14.6 12 21 12 21Z" />
    <circle cx="12" cy="9.6" r="2.4" />
  </Icone>
);

function FaleConosco() {
  const logado = clienteLogado();
  const conta = logado ? dadosDoToken() : null;
  const [f, setF] = useState({ nome: "", email: "", assunto: ASSUNTOS[0], mensagem: "" });
  const [erros, setErros] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState("");
  const [erroEnvio, setErroEnvio] = useState("");
  const [mensagens, setMensagens] = useState(null);
  const [erroLista, setErroLista] = useState("");

  const carregar = useCallback(async () => {
    if (!logado) return;
    try {
      setMensagens(await pedir(`${ENDPOINTS.contato}/minhas`, {}, "Não foi possível carregar suas mensagens."));
      setErroLista("");
    } catch (err) {
      setMensagens([]);
      setErroLista(semServidor(err));
    }
  }, [logado]);
  useEffect(() => {
    carregar();
  }, [carregar]);

  const mudar = (campo, valor) => {
    setF(v => ({ ...v, [campo]: valor }));
    setErros(e => ({ ...e, [campo]: "" }));
  };

  const enviar = async e => {
    e.preventDefault();
    if (enviando) return;
    const novos = {};
    if (!logado) {
      if (f.nome.trim().length < 2) novos.nome = "Informe seu nome.";
      if (!emailValido(f.email.trim())) novos.email = "Informe um e-mail válido para receber a resposta.";
    }
    if (f.mensagem.trim().length < 10) novos.mensagem = "Escreva pelo menos 10 caracteres.";
    setErros(novos);
    if (Object.keys(novos).length) {
      document.getElementById(`fc-${Object.keys(novos)[0]}`)?.focus();
      return;
    }
    setEnviando(true);
    setErroEnvio("");
    try {
      const corpo = { assunto: f.assunto, mensagem: f.mensagem.trim() };
      if (!logado) Object.assign(corpo, { nome: f.nome.trim(), email: f.email.trim().toLowerCase() });
      const resp = await pedir(
        ENDPOINTS.contato,
        { method: "POST", body: JSON.stringify(corpo) },
        "Não foi possível enviar sua mensagem."
      );
      setEnviada(resp.protocolo || (resp.id ? protocolo(resp.id) : ""));
      setF(v => ({ ...v, mensagem: "" }));
      carregar();
    } catch (err) {
      setErroEnvio(semServidor(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="aj-card aj-fale" id="fale-conosco" aria-labelledby="faleTitulo">
      <div className="aj-fale__topo">
        <span className="aj-icone aj-icone--laranja">
          <IconeSuporte />
        </span>
        <div>
          <h2 id="faleTitulo">Fale conosco</h2>
          <p>Como podemos ajudar? Respondemos em até 1 dia útil, por e-mail{logado ? " e aqui na sua conta" : ""}.</p>
        </div>
      </div>

      {enviada ? (
        <div className="aj-enviada" role="status">
          <strong>Mensagem enviada!</strong>
          <p>
            Protocolo <b>{enviada}</b>. Enviamos uma confirmação para o seu e-mail e respondemos em até 1 dia útil.
          </p>
          <button type="button" className="aj-btn aj-btn--claro" onClick={() => setEnviada("")}>
            Enviar outra mensagem
          </button>
        </div>
      ) : (
        <form className="aj-form" noValidate onSubmit={enviar}>
          {logado ? (
            <p className="aj-form__conta">
              Enviando como <b>{conta?.nome || "você"}</b>
              {conta?.email ? ` (${conta.email})` : ""}.
            </p>
          ) : (
            <div className="aj-form__linha">
              <label className="aj-campo">
                <span>Nome</span>
                <input
                  id="fc-nome"
                  autoComplete="name"
                  value={f.nome}
                  onChange={e => mudar("nome", e.target.value)}
                  aria-invalid={erros.nome ? "true" : "false"}
                />
                {erros.nome && <small className="aj-erro">{erros.nome}</small>}
              </label>
              <label className="aj-campo">
                <span>E-mail</span>
                <input
                  id="fc-email"
                  type="email"
                  autoComplete="email"
                  value={f.email}
                  onChange={e => mudar("email", e.target.value)}
                  aria-invalid={erros.email ? "true" : "false"}
                />
                {erros.email && <small className="aj-erro">{erros.email}</small>}
              </label>
            </div>
          )}

          <fieldset className="aj-assuntos">
            <legend>Assunto</legend>
            {ASSUNTOS.map(a => (
              <label key={a} className={"aj-chip" + (f.assunto === a ? " on" : "")}>
                <input
                  type="radio"
                  name="assunto"
                  value={a}
                  checked={f.assunto === a}
                  onChange={() => mudar("assunto", a)}
                />
                {a}
              </label>
            ))}
          </fieldset>

          <label className="aj-campo">
            <span>Mensagem</span>
            <textarea
              id="fc-mensagem"
              rows="5"
              maxLength={2000}
              placeholder="Conte com detalhes o que aconteceu ou o que você precisa"
              value={f.mensagem}
              onChange={e => mudar("mensagem", e.target.value)}
              aria-invalid={erros.mensagem ? "true" : "false"}
            />
            <span className="aj-campo__rodape">
              {erros.mensagem ? <small className="aj-erro">{erros.mensagem}</small> : <span />}
              <small>{f.mensagem.length}/2000</small>
            </span>
          </label>

          {erroEnvio && (
            <p className="aj-erro aj-erro--caixa" role="alert">
              {erroEnvio}
            </p>
          )}
          <button type="submit" className="aj-btn" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar mensagem"}
          </button>
        </form>
      )}

      <div className="aj-canais">
        <a href={`mailto:${EMAIL_CONTATO}`}>
          <IconeEmail /> {EMAIL_CONTATO}
        </a>
        <span>
          <IconeLocal /> Osasco-SP
        </span>
      </div>

      {logado && (
        <div className="aj-minhas">
          <h3>Minhas mensagens</h3>
          {mensagens === null ? (
            <p className="aj-vazio">Carregando...</p>
          ) : erroLista ? (
            <p className="aj-erro aj-erro--caixa">{erroLista}</p>
          ) : !mensagens.length ? (
            <p className="aj-vazio">Suas conversas com a equipe Happy Snouts aparecem aqui.</p>
          ) : (
            <ul>
              {mensagens.map(m => {
                const st = STATUS[m.status] || STATUS.aberta;
                return (
                  <li key={m.id_mensagem} className="aj-msg">
                    <div className="aj-msg__topo">
                      <strong>
                        {m.assunto} {protocolo(m.id_mensagem)}
                      </strong>
                      <span className={`aj-status aj-status--${st.cor}`}>{st.texto}</span>
                    </div>
                    <small>Enviada em {dataHora(m.data_envio)}</small>
                    <p>{m.mensagem}</p>
                    {m.resposta && (
                      <div className="aj-msg__resposta">
                        <b>
                          Resposta{m.funcionario ? ` de ${m.funcionario}` : ""}
                          {m.data_resposta ? ` • ${dataHora(m.data_resposta)}` : ""}
                        </b>
                        <p>{m.resposta}</p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function Secao({ id, titulo, children }) {
  return (
    <section className="aj-card aj-secao" id={id} aria-labelledby={`${id}-titulo`}>
      <h2 id={`${id}-titulo`}>{titulo}</h2>
      {children}
    </section>
  );
}

export default function Ajuda() {
  // abre já na seção do link (#trocas, #entregas...) depois que a página monta
  useEffect(() => {
    const alvo = location.hash && document.getElementById(location.hash.slice(1));
    if (alvo) setTimeout(() => alvo.scrollIntoView({ block: "start" }), 50);
  }, []);

  return (
    <>
      <IconesTopo />
      <Header />
      <main className="aj hs-container">
        {/* Banner: a imagem pronta; as 6 pílulas desenhadas nela viram links de verdade para cada seção */}
        <header className="aj-banner">
          <h1 className="aj-banner__titulo">Como podemos ajudar?</h1>
          <img
            className="aj-banner__img"
            src="img/bannerajuda.webp"
            width="2000"
            height="689"
            alt="Atendimento: fale com a nossa equipe e veja tudo sobre trocas, pagamento e entregas da Happy Snouts."
          />
          <nav className="aj-banner__links" aria-label="Seções do atendimento">
            {SECOES.map(([id, texto]) => (
              <a key={id} href={`#${id}`} className={`aj-banner__link aj-banner__link--${id}`}>
                {texto}
              </a>
            ))}
          </nav>
        </header>
        {/* celular: a imagem fica pequena, então os atalhos aparecem também como botões normais */}
        <nav className="aj-atalhos" aria-label="Atalhos do atendimento">
          {SECOES.map(([id, texto]) => (
            <a key={id} href={`#${id}`}>
              {texto}
            </a>
          ))}
        </nav>

        <FaleConosco />

        <div className="aj-grade">
          <Secao id="missao" titulo="Nossa missão">
            <p>
              Na Happy Snouts, acreditamos que cuidar de um pet é um ato de amor. Nossa missão é facilitar esse cuidado
              no dia a dia: reunir produtos de qualidade, tecnologia que ajuda de verdade, como a coleira com GPS e o
              comedouro automático, e ferramentas para acompanhar a saúde, as vacinas e a rotina do seu pet, tudo em um
              só lugar.
            </p>
            <p className="aj-destaque">Mais do que produtos, é amor em forma de cuidado. 🧡</p>
          </Secao>

          <Secao id="trabalhe-conosco" titulo="Trabalhe conosco">
            <p>Quer fazer parte da equipe Happy Snouts? Adoraríamos conhecer você!</p>
            <p>
              Envie seu currículo para{" "}
              <a href={`mailto:${EMAIL_CONTATO}?subject=Trabalhe%20conosco`}>{EMAIL_CONTATO}</a> com o assunto{" "}
              <b>“Trabalhe conosco”</b> e conte um pouco sobre você e a área em que gostaria de atuar.
            </p>
          </Secao>

          <Secao id="trocas" titulo="Trocas e devoluções">
            <ul className="aj-lista">
              <li>
                <b>Se arrependeu da compra?</b> Pelo Código de Defesa do Consumidor, compras feitas pela internet podem
                ser devolvidas em até 7 dias corridos a partir do recebimento.
              </li>
              <li>
                <b>Produto com defeito ou diferente do pedido?</b> Fale com a gente informando o número do pedido e, se
                possível, mande fotos do produto.
              </li>
              <li>
                <b>Como pedir:</b> use o <a href="#fale-conosco">Fale conosco</a> com o assunto <b>“Pedido”</b>.
                Respondemos em até 1 dia útil e explicamos o passo a passo.
              </li>
              <li>
                <b>Cancelar um pedido:</b> pelo app, enquanto o pedido estiver “Em andamento”, em Perfil &gt; Meus
                Pedidos.
              </li>
            </ul>
          </Secao>

          <Secao id="pagamento" titulo="Formas de pagamento">
            <ul className="aj-opcoes">
              <li>
                <b>Pix</b>
                <span>Pagamento à vista, direto pelo app do seu banco.</span>
              </li>
              <li>
                <b>Cartão de crédito</b>
                <span>Em até 3x sem juros.</span>
              </li>
              <li>
                <b>Boleto</b>
                <span>Vence em 3 dias úteis.</span>
              </li>
            </ul>
            <p className="aj-nota">
              Seus dados ficam protegidos: do cartão guardamos só os 4 últimos dígitos, a bandeira e a validade. O
              número completo e o CVV não ficam salvos.
            </p>
          </Secao>

          <Secao id="entregas" titulo="Entregas e prazos">
            <p>Entregamos em todo o Brasil. Você escolhe o tipo de entrega ao finalizar a compra:</p>
            <ul className="aj-opcoes">
              <li>
                <b>Entrega normal</b>
                <span>R$ 10,00 • até 7 dias úteis</span>
              </li>
              <li>
                <b>Entrega rápida</b>
                <span>R$ 20,00 • até 2 dias úteis</span>
              </li>
            </ul>
            <p className="aj-nota">Você acompanha seus pedidos pelo app, em Perfil &gt; Meus Pedidos.</p>
          </Secao>
        </div>
      </main>
      <Footer />
    </>
  );
}
