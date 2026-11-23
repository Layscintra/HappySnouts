import { useEffect, useRef, useState } from "react";
import { enviarImagem, reduzirImagem } from "../../lib/api.js";
import { Icone, IconeCategoria, ehImagem, emoji } from "./comum.jsx";

export function useEscolhaIcone(aberto, iconeSalvo, padrao = "🐾") {
  const imagemAtual = ehImagem(iconeSalvo) ? iconeSalvo : "";
  const [modo, setModo] = useState("icone");
  const [icone, setIcone] = useState(padrao);
  const [imagemNova, setImagemNova] = useState(null); // arquivo (enviado só ao salvar)
  const [previa, setPrevia] = useState("");

  useEffect(() => {
    if (!aberto) return;
    setModo(imagemAtual ? "imagem" : "icone");
    setIcone(iconeSalvo && !imagemAtual ? emoji(iconeSalvo) : padrao);
    setImagemNova(null);
    setPrevia("");
  }, [aberto, iconeSalvo]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    modo,
    setModo,
    icone,
    setIcone,
    imagemAtual,
    previa,
    mostrar: modo === "imagem" ? previa || imagemAtual : icone,
    escolherArquivo: async arquivo => {
      const reduzida = await reduzirImagem(arquivo, { lado: 256, quadrada: true });
      setImagemNova(reduzida);
      setPrevia(URL.createObjectURL(reduzida));
    },
    validar: () =>
      modo === "imagem" && !imagemNova && !imagemAtual ? "Escolha uma imagem ou volte para um ícone da lista." : "",
    resolver: async () => (modo === "imagem" ? (imagemNova ? await enviarImagem(imagemNova) : imagemAtual) : icone)
  };
}

export function PreviaIcone({ escolha, className = "grande", estilo }) {
  if (escolha.modo === "imagem" && escolha.previa) {
    return (
      <span className={`cat-ico ${className}`} style={estilo} aria-hidden="true">
        <img src={escolha.previa} alt="" />
      </span>
    );
  }
  return <IconeCategoria icone={escolha.mostrar} className={className} estilo={estilo} />;
}

export function EscolhaIcone({ escolha, grupos, nome, aoErro }) {
  const [digitado, setDigitado] = useState("");
  const arquivo = useRef(null);
  const { modo, setModo, icone, setIcone } = escolha;
  const emojiFora = !Object.values(grupos).some(g => g.includes(icone));

  const usarDigitado = () => {
    const t = digitado.trim();
    if (!t) return;
    // primeiro "caractere visível" (um emoji pode ter vários códigos)
    const primeiro = [...new Intl.Segmenter("pt-BR", { granularity: "grapheme" }).segment(t)][0]?.segment;
    if (!primeiro || /[\w./]/.test(primeiro)) {
      aoErro("Digite ou cole um emoji (letras e números não valem como ícone).");
      return;
    }
    setIcone(primeiro);
    setDigitado("");
    aoErro("");
  };

  const escolherImagem = async e => {
    const escolhido = e.target.files[0];
    e.target.value = "";
    if (!escolhido) return;
    try {
      await escolha.escolherArquivo(escolhido);
      aoErro("");
    } catch (err) {
      aoErro(err.message);
    }
  };

  return (
    <>
      <div className="seg" role="radiogroup" aria-label="Tipo de ícone">
        <button type="button" role="radio" aria-checked={modo === "icone"} onClick={() => setModo("icone")}>
          <Icone id="tag" />
          Ícone da lista
        </button>
        <button type="button" role="radio" aria-checked={modo === "imagem"} onClick={() => setModo("imagem")}>
          <Icone id="image" />
          Imagem própria
        </button>
      </div>

      {modo === "icone" ? (
        <div className="icones-painel">
          <div className="emoji-livre">
            <input
              value={digitado}
              onChange={e => setDigitado(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  usarDigitado();
                }
              }}
              placeholder="Digite ou cole outro emoji 🙂"
              aria-label="Outro emoji"
            />
            <button type="button" className="ghost borda" onClick={usarDigitado}>
              Usar
            </button>
          </div>
          {emojiFora && (
            <div className="grupo">
              <small>Escolhido</small>
              <div className="icones-grade">
                <span className="ico-sel" aria-label="Ícone escolhido">
                  {icone}
                </span>
              </div>
            </div>
          )}
          {Object.entries(grupos).map(([grupo, lista]) => (
            <fieldset className="grupo" key={grupo}>
              <legend>{grupo}</legend>
              <div className="icones-grade">
                {lista.map(ic => (
                  <label className="ico" key={ic}>
                    <input type="radio" name={nome} value={ic} checked={ic === icone} onChange={() => setIcone(ic)} />
                    <span>{ic}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      ) : (
        <div className="upload-ico">
          <button type="button" className="ghost borda" onClick={() => arquivo.current.click()}>
            <Icone id="image" />
            {escolha.previa || escolha.imagemAtual ? "Trocar imagem" : "Escolher imagem"}
          </button>
          <small>JPG, PNG ou WEBP. A imagem é recortada no centro (quadrada) e reduzida para 256 px.</small>
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden ref={arquivo} onChange={escolherImagem} />
        </div>
      )}
    </>
  );
}
