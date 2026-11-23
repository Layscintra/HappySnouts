import { Link } from "react-router";
import Carrossel from "../components/Carrossel.jsx";
import Footer from "../components/layout/Footer.jsx";
import Header from "../components/layout/Header.jsx";

function Icones() {
  return (
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
      <symbol id="paw" viewBox="0 0 40 40">
        <path d="M20 19c5.5 0 10.5 6.4 10.5 11 0 3.2-2.6 4.6-5.3 4.6-2.4 0-3.4-1.2-5.2-1.2s-2.8 1.2-5.2 1.2c-2.7 0-5.3-1.4-5.3-4.6C9.5 25.4 14.5 19 20 19Z" />
        <ellipse cx="8" cy="17" rx="3.6" ry="4.6" transform="rotate(-20 8 17)" />
        <ellipse cx="15" cy="9" rx="3.6" ry="4.8" transform="rotate(-6 15 9)" />
        <ellipse cx="25" cy="9" rx="3.6" ry="4.8" transform="rotate(6 25 9)" />
        <ellipse cx="32" cy="17" rx="3.6" ry="4.6" transform="rotate(20 32 17)" />
      </symbol>
      <symbol id="spark" viewBox="0 0 40 40">
        <path
          d="M6 26h11M8 13l10 7M19 4l3 11"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.6"
          strokeLinecap="round"
        />
      </symbol>
      <symbol id="heart" viewBox="0 0 24 24">
        <path
          d="M12 20s-7-4.4-9.3-8.8C1.2 8 2.7 4.8 6 4.2c2-.4 3.7.5 6 2.9 2.3-2.4 4-3.3 6-2.9 3.3.6 4.8 3.8 3.3 7C19 15.6 12 20 12 20Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      </symbol>
      <symbol id="arrow" viewBox="0 0 24 24">
        <path
          d="M5 12h14M13 6l6 6-6 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </symbol>
    </svg>
  );
}

export default function Inicio() {
  return (
    <>
      <a className="skip-link" href="#conteudo-principal">
        Pular para o conteúdo
      </a>
      <Icones />
      <Header />
      <main id="conteudo-principal">
        <section className="hero">
          <div className="hero__blob" aria-hidden="true" />
          <div className="hero__blob hero__blob--soft" aria-hidden="true" />
          <svg
            className="deco deco-paw"
            style={{ top: "16%", left: "2.5%", width: "44px", transform: "rotate(-18deg)" }}
            aria-hidden="true"
          >
            <use href="#paw" />
          </svg>{" "}
          <svg
            className="deco deco-paw"
            style={{ top: "58%", left: "5%", width: "30px", transform: "rotate(14deg)" }}
            aria-hidden="true"
          >
            <use href="#paw" />
          </svg>{" "}
          <svg
            className="deco deco-paw"
            style={{ top: "8%", left: "49%", width: "34px", transform: "rotate(10deg)" }}
            aria-hidden="true"
          >
            <use href="#paw" />
          </svg>{" "}
          <svg
            className="deco deco-paw deco-paw--light"
            style={{ top: "58%", right: "3%", width: "38px", transform: "rotate(18deg)" }}
            aria-hidden="true"
          >
            <use href="#paw" />
          </svg>{" "}
          <svg
            className="deco deco-paw deco-paw--light"
            style={{ top: "72%", right: "8%", width: "52px", transform: "rotate(-12deg)" }}
            aria-hidden="true"
          >
            <use href="#paw" />
          </svg>
          <div className="container hs-container hero__grid">
            <div className="hero__content">
              <svg className="deco deco-spark hero__spark" aria-hidden="true">
                <use href="#spark" />
              </svg>
              <h1 className="hero__title">
                Seu <span className="text-orange">Pet</span>{" "}
                <svg className="hero__heart" aria-hidden="true">
                  <use href="#heart" />
                </svg>
                <br />
                sua prioridade
              </h1>
              <p className="hero__subtitle">
                Tudo o que o seu companheiro precisa para viver com mais saúde, carinho e alegria, em um só lugar.
              </p>
              <div className="hero__cta">
                <Link to="/produtos" className="btn btn--primary">
                  Comprar agora{" "}
                  <svg className="i-arrow" aria-hidden="true">
                    <use href="#arrow" />
                  </svg>
                </Link>{" "}
                <Link to="/ajuda#fale-conosco" className="btn btn--outline">
                  Saiba mais
                </Link>
              </div>
            </div>
            <div className="hero__media">
              <svg className="deco deco-spark hero__spark--img" aria-hidden="true">
                <use href="#spark" />
              </svg>{" "}
              <svg className="hero__heart hero__heart--img" aria-hidden="true">
                <use href="#heart" />
              </svg>{" "}
              <img
                src="img/footerdog.png"
                alt="Cachorro e gato felizes, os melhores amigos do Happy Snouts"
                className="hero__img"
              />
            </div>
          </div>
          <ul className="perks container">
            <li className="perks__item">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M2 7h11v8H2zM13 10h4l3 3v2h-7z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <circle cx="6.5" cy="17.3" r="1.7" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="16.5" cy="17.3" r="1.7" stroke="currentColor" strokeWidth="1.6" />
              </svg>{" "}
              Entrega em até 2 dias úteis
            </li>
            <li className="perks__item">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 7.5v9l8 4.5 8-4.5v-9M12 12v9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>{" "}
              Entregamos em todo o Brasil
            </li>
            <li className="perks__item">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="5.5" width="18" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M3 10h18M7 15h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>{" "}
              Até 3x sem juros
            </li>
          </ul>
          <svg className="hero__wave" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0,70 C 240,10 470,120 760,78 C 1030,40 1220,110 1440,52 L1440,120 L0,120 Z" />
          </svg>
        </section>
        <section className="section produtos" aria-labelledby="produtos-titulo">
          <svg
            className="deco deco-paw"
            style={{ bottom: "4%", left: "3%", width: "42px", transform: "rotate(-14deg)" }}
            aria-hidden="true"
          >
            <use href="#paw" />
          </svg>{" "}
          <svg
            className="deco deco-paw"
            style={{ bottom: "2%", right: "3%", width: "44px", transform: "rotate(16deg)" }}
            aria-hidden="true"
          >
            <use href="#paw" />
          </svg>
          <div className="container hs-container">
            <div className="section__head">
              <h2 id="produtos-titulo" className="section__title">
                <svg className="title-paw" aria-hidden="true">
                  <use href="#paw" />
                </svg>{" "}
                Produtos{" "}
                <svg className="title-paw title-paw--r" aria-hidden="true">
                  <use href="#paw" />
                </svg>
              </h2>
              <Link to="/produtos" className="section__link">
                Ver todos{" "}
                <svg className="i-arrow" aria-hidden="true">
                  <use href="#arrow" />
                </svg>
              </Link>
            </div>
            <Carrossel />
          </div>
        </section>
        <section className="section" aria-labelledby="programa-titulo">
          <div className="container hs-container">
            <h2 id="programa-titulo" className="section__title section__title--center">
              <svg className="title-paw" aria-hidden="true">
                <use href="#paw" />
              </svg>{" "}
              Programa <span className="text-orange">Amigo Snouts</span>{" "}
              <svg className="title-paw title-paw--r" aria-hidden="true">
                <use href="#paw" />
              </svg>
            </h2>
            <div className="programa">
              <svg className="deco deco-spark" style={{ top: "30px", left: "28px", width: "34px" }} aria-hidden="true">
                <use href="#spark" />
              </svg>{" "}
              <svg
                className="deco deco-paw"
                style={{ bottom: "24px", left: "36%", width: "32px", transform: "rotate(12deg)" }}
                aria-hidden="true"
              >
                <use href="#paw" />
              </svg>{" "}
              <svg
                className="deco deco-paw"
                style={{ top: "18px", right: "7%", width: "32px", transform: "rotate(-10deg)" }}
                aria-hidden="true"
              >
                <use href="#paw" />
              </svg>{" "}
              <svg
                className="deco deco-paw"
                style={{ bottom: "22px", right: "5%", width: "38px", transform: "rotate(16deg)" }}
                aria-hidden="true"
              >
                <use href="#paw" />
              </svg>
              <div className="programa__card programa__card--desconto">
                <img
                  src="img/cachorrocupom.png"
                  alt="Cachorro feliz representando o desconto de boas-vindas"
                  className="programa__img"
                />
                <div>
                  <strong className="programa__destaque">20% OFF</strong>
                  <p>na sua próxima compra ao completar o cadastro.</p>
                </div>
              </div>
              <div className="programa__card programa__card--pontos">
                <svg className="programa__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 2.8 14.6 5l3.4-.2.7 3.3 2.8 1.9-1.4 3.1 1.4 3.1-2.8 1.9-.7 3.3-3.4-.2L12 21.2 9.4 19l-3.4.2-.7-3.3-2.8-1.9L3.9 12 2.5 8.9l2.8-1.9.7-3.3 3.4.2L12 2.8Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m12 8.4 1.1 2.2 2.4.3-1.8 1.7.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.7 2.4-.3L12 8.4Z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="programa__pontos-label">Você tem:</p>
                <strong className="programa__pontos-valor">0 pontos</strong>
                <p className="programa__texto">
                  Comece a pontuar a partir da sua próxima compra e troque por recompensas.
                </p>
                <span className="btn btn--primary btn--small btn--estatico">Em Breve</span>
              </div>
              <div className="programa__card programa__card--whats">
                <img src="img/gatocupom.png" alt="Gato curioso representando o atendimento" className="programa__img" />
                <div>
                  <p className="programa__duvida">
                    Tem alguma dúvida?
                    <br />
                    <span className="programa__duvida-sub">Pergunte à nossa comunidade</span>
                  </p>
                  <Link to="/blog" className="btn btn--small btn--marinho programa__blog">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M21 11.5a8.5 8.5 0 0 1-12.9 7.3L3 20l1.2-4.1A8.5 8.5 0 1 1 21 11.5Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>{" "}
                    Ir para o Blog{" "}
                    <svg className="i-arrow" aria-hidden="true">
                      <use href="#arrow" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="section" aria-labelledby="ofertas-titulo">
          <div className="container hs-container">
            <h2 id="ofertas-titulo" className="section__title section__title--center">
              <svg className="title-paw" aria-hidden="true">
                <use href="#paw" />
              </svg>{" "}
              Super Ofertas{" "}
              <svg className="title-paw title-paw--r" aria-hidden="true">
                <use href="#paw" />
              </svg>
            </h2>
            <div className="ofertas">
              {/* os 2 cards são recortes da mesma imagem (img/superofertas.webp); o card inteiro é o link */}
              <Link to="/produtos?ver=alimentador" className="oferta-banner oferta-banner--alimentador">
                <img
                  src="img/superofertas.webp"
                  width="2000"
                  height="745"
                  alt="Alimentador Automático: praticidade na hora de alimentar o seu pet! Ver oferta"
                />
              </Link>
              <Link to="/produtos?ver=coleira" className="oferta-banner oferta-banner--coleira">
                <img
                  src="img/superofertas.webp"
                  width="2000"
                  height="745"
                  alt="Coleira Rastreadora: segurança e localização em tempo real. Ver oferta"
                />
              </Link>
            </div>
          </div>
        </section>
        <section className="section section--blog" aria-labelledby="blog-titulo">
          <div className="container hs-container">
            <div className="blog">
              <svg className="deco deco-spark blog__spark" aria-hidden="true">
                <use href="#spark" />
              </svg>{" "}
              <svg className="hero__heart blog__heart" aria-hidden="true">
                <use href="#heart" />
              </svg>{" "}
              <svg
                className="deco deco-paw"
                style={{ top: "22px", right: "28px", width: "40px", transform: "rotate(14deg)" }}
                aria-hidden="true"
              >
                <use href="#paw" />
              </svg>{" "}
              <svg
                className="deco deco-paw"
                style={{ bottom: "16px", right: "12px", width: "26px", transform: "rotate(-10deg)" }}
                aria-hidden="true"
              >
                <use href="#paw" />
              </svg>{" "}
              <img src="img/sobrenos.png" alt="Pet confortável representando o BlogSnouts" className="blog__img" />
              <div className="blog__texto">
                <h2 id="blog-titulo" className="blog__title">
                  Venha conhecer o <span className="text-orange">BlogSnouts</span>
                </h2>
                <p>Dicas, novidades e histórias para você e seu pet viverem cada dia melhor juntos.</p>
              </div>
              <Link to="/blog" className="btn btn--marinho blog__btn">
                Acessar blog{" "}
                <svg className="i-arrow" aria-hidden="true">
                  <use href="#arrow" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
