import { useEffect, useRef, useState } from "react";
import Dialogo, { focarPrimeiroCampo } from "../../components/Dialogo.jsx";
import Icone from "../../components/Icone.jsx";
import { api, API_URL, ENDPOINTS, lerErro, avisar, confirmar, semServidor } from "../../lib/api.js";

async function pedir(caminho, metodo = "GET", corpo, padrao = "Algo deu errado. Tente de novo.") {
  const resp = await api(caminho, { method: metodo, body: corpo ? JSON.stringify(corpo) : undefined });
  if (!resp.ok) throw new Error(await lerErro(resp, padrao));
  return resp.json().catch(() => ({}));
}

const BotaoSalvar = ({ salvando, children }) => (
  <button className="btn" disabled={salvando}>
    {salvando ? "Salvando..." : children}
  </button>
);

// endereço atual sempre primeiro (igual ao app)
export const ordenarEnderecos = lista => [...(lista || [])].sort((a, b) => Number(b.padrao) - Number(a.padrao));

export async function buscarEnderecos(idCliente) {
  const lista = await pedir(
    `${ENDPOINTS.enderecos}/usuario/${idCliente}`,
    "GET",
    null,
    "Não foi possível carregar seus endereços."
  );
  return ordenarEnderecos(lista);
}

const linhaRua = e => (e.numero ? `${e.endereco}, ${e.numero}` : e.endereco);
const ENDERECO_VAZIO = { apelido: "", cep: "", endereco: "", numero: "", bairro: "", cidade: "", estado: "" };
const mascaraCep = v =>
  String(v || "")
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, "$1-$2");

function ModalEndereco({ aberto, endereco, enderecos, aoFechar, aoSalvo }) {
  const [f, setF] = useState(ENDERECO_VAZIO);
  const [erro, setErro] = useState("");
  const [cepInfo, setCepInfo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const form = useRef(null);
  const ultimoCep = useRef(""); // não busca de novo o mesmo CEP (nem sobrescreve ao abrir para editar)

  useEffect(() => {
    if (!aberto) return;
    const inicial = endereco
      ? {
          apelido: endereco.apelido || "",
          cep: mascaraCep(endereco.cep),
          endereco: endereco.endereco || "",
          numero: endereco.numero || "",
          bairro: endereco.bairro || "",
          cidade: endereco.cidade || "",
          estado: endereco.estado || ""
        }
      : ENDERECO_VAZIO;
    setF(inicial);
    ultimoCep.current = inicial.cep.replace(/\D/g, "");
    setErro("");
    setCepInfo("");
  }, [aberto, endereco]);

  const mudar = (nome, valor) => setF(a => ({ ...a, [nome]: valor }));
  const focar = nome => form.current?.elements[nome]?.focus();

  const mudarCep = async valor => {
    const cep = mascaraCep(valor);
    mudar("cep", cep);
    const d = cep.replace(/\D/g, "");
    setCepInfo("");
    if (d.length !== 8 || d === ultimoCep.current) return;
    ultimoCep.current = d;
    setCepInfo("Buscando endereço...");
    try {
      const r = await fetch(`${API_URL}${ENDPOINTS.cep}/${d}`);
      const v = await r.json().catch(() => ({}));
      if (!r.ok) {
        setCepInfo("CEP não encontrado. Preencha à mão.");
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
      setTimeout(() => focar(v.rua ? "numero" : "endereco"));
    } catch {
      setCepInfo("Não deu para buscar o CEP. Preencha à mão.");
    }
  };

  const salvar = async e => {
    e.preventDefault();
    const falha = (msg, nome) => {
      setErro(msg);
      focar(nome);
    };
    const outros = (enderecos || []).filter(x => !endereco || x.id_endereco !== endereco.id_endereco);
    const dados = {
      cep: f.cep.trim(),
      estado: f.estado.trim().toUpperCase(),
      cidade: f.cidade.trim(),
      bairro: f.bairro.trim(),
      endereco: f.endereco.trim(),
      numero: f.numero.trim() || "S/N",
      apelido: f.apelido.trim() || null,
      padrao: outros.length === 0
    };
    if (!/^\d{5}-\d{3}$/.test(dados.cep)) return falha("Digite o CEP completo.", "cep");
    if (!dados.endereco) return falha("Digite o endereço.", "endereco");
    if (!f.numero.trim()) return falha("Digite o número (ou S/N).", "numero");
    if (!dados.bairro) return falha("Digite o bairro.", "bairro");
    if (!dados.cidade) return falha("Digite a cidade.", "cidade");
    if (!/^[A-Z]{2}$/.test(dados.estado)) return falha("UF com 2 letras, ex.: SP.", "estado");

    setSalvando(true);
    try {
      if (endereco)
        await pedir(
          `${ENDPOINTS.enderecos}/${endereco.id_endereco}`,
          "PUT",
          dados,
          "Não foi possível salvar o endereço."
        );
      else await pedir(ENDPOINTS.enderecos, "POST", dados, "Não foi possível salvar o endereço.");
      aoFechar();
      avisar("Endereço salvo com sucesso");
      await aoSalvo();
    } catch (err) {
      setErro(semServidor(err));
    } finally {
      setSalvando(false);
    }
  };

  const campo = (nome, props) => (
    <input name={nome} value={f[nome]} onChange={e => mudar(nome, e.target.value)} {...props} />
  );

  return (
    <Dialogo
      id="enderecoModal"
      aria-labelledby="enderecoTitulo"
      aberto={aberto}
      aoFechar={aoFechar}
      aoAbrir={focarPrimeiroCampo}
    >
      <form className="mform" noValidate ref={form} onSubmit={salvar}>
        <header>
          <h2 id="enderecoTitulo">
            <Icone id="pin" />
            {endereco ? "Editar endereço" : "Novo endereço"}
          </h2>
          <button type="button" className="x" data-close aria-label="Fechar">
            <Icone id="x" />
          </button>
        </header>
        <label className="f">
          Apelido (opcional)
          {campo("apelido", { maxLength: 50, placeholder: "Ex.: Casa, Trabalho" })}
        </label>
        <label className="f">
          CEP
          <input
            name="cep"
            inputMode="numeric"
            maxLength="9"
            autoComplete="postal-code"
            placeholder="00000-000"
            required
            value={f.cep}
            onChange={e => mudarCep(e.target.value)}
          />
          <small aria-live="polite">{cepInfo}</small>
        </label>
        <div className="dupla rua">
          <label className="f">
            Endereço
            {campo("endereco", {
              maxLength: 150,
              autoComplete: "address-line1",
              placeholder: "Rua, avenida e complemento",
              required: true
            })}
          </label>
          <label className="f">
            Número{campo("numero", { maxLength: 10, placeholder: "Ex.: 227", required: true })}
          </label>
        </div>
        <label className="f">Bairro{campo("bairro", { maxLength: 100, placeholder: "Bairro", required: true })}</label>
        <div className="dupla rua">
          <label className="f">
            Cidade
            {campo("cidade", { maxLength: 100, autoComplete: "address-level2", placeholder: "Cidade", required: true })}
          </label>
          <label className="f">
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
        </div>
        <p className="err" role="alert">
          {erro}
        </p>
        <div className="act2">
          <button type="button" className="ghost" data-close>
            Cancelar
          </button>
          <BotaoSalvar salvando={salvando}>Salvar</BotaoSalvar>
        </div>
      </form>
    </Dialogo>
  );
}

function CartaoEndereco({ endereco: e, ocupado, aoUsar, aoEditar, aoExcluir }) {
  return (
    <article className={"end" + (e.padrao ? " atual" : "")}>
      <span className="end-ico">
        <Icone id="pin" />
      </span>
      <div className="end-txt">
        {e.apelido && <b className="apelido">{e.apelido}</b>}
        <strong>{linhaRua(e)}</strong>
        <span>
          {e.bairro} - {e.cidade} - {e.estado}
        </span>
        <small>CEP: {mascaraCep(e.cep)}</small>
      </div>
      <div className="end-acoes">
        {!e.padrao && (
          <button type="button" className="lk" disabled={ocupado} onClick={aoUsar}>
            <Icone id="check" />
            Usar para entrega
          </button>
        )}
        <button type="button" className="lk" disabled={ocupado} onClick={aoEditar}>
          <Icone id="pen" />
          Editar
        </button>
        <button type="button" className="lk perigo" disabled={ocupado} onClick={aoExcluir}>
          <Icone id="trash" />
          Excluir
        </button>
      </div>
    </article>
  );
}

export function SecaoEnderecos({ enderecos, erro, aoRecarregar }) {
  const [modal, setModal] = useState({ aberto: false, endereco: null });
  const [ocupado, setOcupado] = useState(false);

  const abrir = endereco => setModal({ aberto: true, endereco: endereco || null });

  async function acao(tarefa, mensagem) {
    setOcupado(true);
    try {
      await tarefa();
      avisar(mensagem);
      await aoRecarregar();
    } catch (err) {
      avisar(semServidor(err), "erro");
    } finally {
      setOcupado(false);
    }
  }

  const usar = e =>
    acao(
      () => pedir(`${ENDPOINTS.enderecos}/${e.id_endereco}/padrao`, "PATCH", {}, "Não foi possível trocar o endereço."),
      "Endereço de entrega atualizado"
    );

  const excluir = async e => {
    const ok = await confirmar({
      titulo: "Excluir endereço",
      mensagem: `Deseja excluir "${linhaRua(e)}"?`,
      botao: "Excluir",
      tipo: "perigo"
    });
    if (!ok) return;
    acao(async () => {
      await pedir(`${ENDPOINTS.enderecos}/${e.id_endereco}`, "DELETE", null, "Não foi possível excluir o endereço.");
      // se o endereço atual foi removido, o próximo da lista assume (igual ao app)
      const restantes = enderecos.filter(x => x.id_endereco !== e.id_endereco);
      if (e.padrao && restantes.length)
        await pedir(`${ENDPOINTS.enderecos}/${restantes[0].id_endereco}/padrao`, "PATCH", {}, "");
    }, "Endereço excluído");
  };

  const atual = (enderecos || []).filter(e => e.padrao);
  const salvos = (enderecos || []).filter(e => !e.padrao);
  const cartao = e => (
    <CartaoEndereco
      key={e.id_endereco}
      endereco={e}
      ocupado={ocupado}
      aoUsar={() => usar(e)}
      aoEditar={() => abrir(e)}
      aoExcluir={() => excluir(e)}
    />
  );

  return (
    <section id="enderecos" className="box">
      <div className="sh">
        <h2>
          <Icone id="pin" />
          Endereços
        </h2>
      </div>
      <div aria-live="polite">
        {erro ? (
          <p className="empty">{erro}</p>
        ) : !enderecos ? (
          <p className="empty">Carregando seus endereços...</p>
        ) : !enderecos.length ? (
          <div className="empty">
            <b>Nenhum endereço cadastrado</b>
            <br />
            Cadastre um endereço para receber seus pedidos.
            <br />
            <button type="button" className="btn sm" onClick={() => abrir()}>
              <Icone id="plus" />
              Adicionar endereço
            </button>
          </div>
        ) : (
          <>
            {atual.length > 0 && (
              <>
                <h3 className="sub2">Endereço atual de entrega</h3>
                <div className="endlista">{atual.map(cartao)}</div>
              </>
            )}
            {salvos.length > 0 && (
              <>
                <h3 className="sub2">Endereços salvos</h3>
                <div className="endlista">{salvos.map(cartao)}</div>
              </>
            )}
            <button type="button" className="novo-item" onClick={() => abrir()}>
              <Icone id="plus" />
              Adicionar novo endereço
            </button>
          </>
        )}
      </div>

      <ModalEndereco
        aberto={modal.aberto}
        endereco={modal.endereco}
        enderecos={enderecos}
        aoFechar={() => setModal(m => ({ ...m, aberto: false }))}
        aoSalvo={aoRecarregar}
      />
    </section>
  );
}

const BANDEIRAS = ["Visa", "Mastercard", "Elo", "American Express", "Hipercard"];
const CARTAO_VAZIO = { destinatario: "", ultimos_digitos: "", nome_titular: "" };
const AVISO_SEGURO =
  "Por segurança, guardamos só a bandeira, o nome e os 4 últimos dígitos. Nunca pedimos o número completo nem o CVV.";

function ModalCartao({ aberto, cartoes, aoFechar, aoSalvo }) {
  const [f, setF] = useState(CARTAO_VAZIO);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const form = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    setF(CARTAO_VAZIO);
    setErro("");
  }, [aberto]);

  const salvar = async e => {
    e.preventDefault();
    const falha = (msg, nome) => {
      setErro(msg);
      form.current?.elements[nome]?.focus();
    };
    const nome = f.nome_titular.trim().toUpperCase();
    if (!f.destinatario) return falha("Escolha a bandeira.", "destinatario");
    if (!/^\d{4}$/.test(f.ultimos_digitos)) return falha("Digite os 4 últimos dígitos do cartão.", "ultimos_digitos");
    if (nome.length < 3) return falha("Digite o nome como está no cartão.", "nome_titular");
    if ((cartoes || []).some(c => c.ultimos_digitos === f.ultimos_digitos && c.destinatario === f.destinatario))
      return falha("Este cartão já está cadastrado.", "ultimos_digitos");

    setSalvando(true);
    try {
      await pedir(
        ENDPOINTS.pagamento,
        "POST",
        {
          destinatario: f.destinatario,
          ultimos_digitos: f.ultimos_digitos,
          nome_titular: nome,
          icone: f.destinatario.toLowerCase().replace(/\s+/g, "-")
        },
        "Não foi possível salvar o cartão."
      );
      aoFechar();
      avisar("Cartão adicionado com sucesso");
      await aoSalvo();
    } catch (err) {
      setErro(semServidor(err));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialogo
      id="cartaoModal"
      aria-labelledby="cartaoTitulo"
      aberto={aberto}
      aoFechar={aoFechar}
      aoAbrir={focarPrimeiroCampo}
    >
      <form className="mform" noValidate ref={form} onSubmit={salvar}>
        <header>
          <h2 id="cartaoTitulo">
            <Icone id="card" />
            Novo cartão
          </h2>
          <button type="button" className="x" data-close aria-label="Fechar">
            <Icone id="x" />
          </button>
        </header>
        <p className="dica">
          <Icone id="lock" />
          {AVISO_SEGURO}
        </p>
        <label className="f">
          Bandeira
          <select
            name="destinatario"
            required
            value={f.destinatario}
            onChange={e => setF({ ...f, destinatario: e.target.value })}
          >
            <option value="">Escolha a bandeira</option>
            {BANDEIRAS.map(b => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </label>
        <label className="f">
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
        <label className="f">
          Nome no cartão
          <input
            name="nome_titular"
            maxLength="100"
            autoComplete="cc-name"
            placeholder="Como está impresso no cartão"
            required
            className="maiusc"
            value={f.nome_titular}
            onChange={e => setF({ ...f, nome_titular: e.target.value.toUpperCase() })}
          />
        </label>
        <p className="err" role="alert">
          {erro}
        </p>
        <div className="act2">
          <button type="button" className="ghost" data-close>
            Cancelar
          </button>
          <BotaoSalvar salvando={salvando}>Salvar cartão</BotaoSalvar>
        </div>
      </form>
    </Dialogo>
  );
}

export function SecaoPagamentos({ ativo }) {
  const [cartoes, setCartoes] = useState(null);
  const [erro, setErro] = useState("");
  const [modal, setModal] = useState(false);
  const [removendo, setRemovendo] = useState(null);

  const carregar = async () => {
    try {
      setCartoes(await pedir(ENDPOINTS.pagamento, "GET", null, "Não foi possível carregar seus cartões."));
      setErro("");
    } catch (err) {
      setErro(semServidor(err));
    }
  };

  useEffect(() => {
    if (ativo) carregar();
  }, [ativo]);

  const remover = async c => {
    const ok = await confirmar({
      titulo: "Remover cartão",
      mensagem: `Deseja remover o cartão ${c.destinatario || "Cartão"} •••• ${c.ultimos_digitos}?`,
      botao: "Remover",
      tipo: "perigo"
    });
    if (!ok) return;
    setRemovendo(c.id_cartao);
    try {
      await pedir(`${ENDPOINTS.pagamento}/${c.id_cartao}`, "DELETE", null, "Não foi possível remover o cartão.");
      avisar("Cartão removido");
      await carregar();
    } catch (err) {
      avisar(semServidor(err), "erro");
    } finally {
      setRemovendo(null);
    }
  };

  return (
    <section id="pagamentos" className="box">
      <div className="sh">
        <h2>
          <Icone id="card" />
          Formas de pagamento
        </h2>
      </div>

      <button type="button" className="add-cartao" onClick={() => setModal(true)}>
        <span className="add-ico">
          <Icone id="card" />
        </span>
        <span>
          <b>Adicionar novo cartão</b>
          <small>Cadastre um novo cartão de crédito ou débito</small>
        </span>
        <span className="seta" aria-hidden="true">
          ›
        </span>
      </button>

      <h3 className="sub2">Meus cartões</h3>
      <div className="cartlista" aria-live="polite">
        {erro ? (
          <p className="empty">{erro}</p>
        ) : !cartoes ? (
          <p className="empty">Carregando seus cartões...</p>
        ) : !cartoes.length ? (
          <p className="empty">Nenhum cartão cadastrado.</p>
        ) : (
          cartoes.map(c => (
            <article className="cart" key={c.id_cartao}>
              <span className="cart-ico">
                <Icone id="card" />
              </span>
              <span className="cart-txt">
                <b>
                  {c.destinatario || "Cartão"} •••• {c.ultimos_digitos}
                  {Boolean(c.padrao) && <em className="selo">Principal</em>}
                </b>
                {c.nome_titular && <small>{c.nome_titular}</small>}
              </span>
              <button
                type="button"
                className="x perigo"
                aria-label={`Remover cartão ${c.destinatario} final ${c.ultimos_digitos}`}
                title="Remover cartão"
                disabled={removendo === c.id_cartao}
                onClick={() => remover(c)}
              >
                <Icone id="trash" />
              </button>
            </article>
          ))
        )}
      </div>
      <p className="seguro">
        <Icone id="lock" />
        Por segurança, guardamos só a bandeira, o nome e os 4 últimos dígitos do cartão.
      </p>

      <ModalCartao aberto={modal} cartoes={cartoes} aoFechar={() => setModal(false)} aoSalvo={carregar} />
    </section>
  );
}
