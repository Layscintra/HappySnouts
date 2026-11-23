import { Link } from "react-router";

export default function Footer() {
  const imgPet = <img src="img/footerdog.png" alt="Cão e gato Happy Snouts" className="footer-pet" />;
  return (
    <footer className="site-footer">
      <svg className="footer-wave" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M0,40 C 220,90 380,0 620,35 C 860,70 1000,10 1260,45 C 1350,58 1400,50 1440,40 L1440,90 L0,90 Z"
          style={{ fill: "var(--hs-laranja-claro)" }}
        />
        <path
          d="M0,60 C 240,20 420,85 680,55 C 900,30 1060,80 1300,55 C 1370,47 1410,50 1440,58 L1440,90 L0,90 Z"
          fill="#387a71"
        />
      </svg>
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="img/logo-topo.png" alt="Happy Snouts" className="footer-logo" />
          <p>Mais do que produtos, é amor em forma de cuidado</p>
        </div>
        <div className="footer-col">
          {imgPet}
          <h3>
            <span className="paw">🐾</span> Sobre nós
          </h3>
          <Link to="/ajuda#fale-conosco">Fale conosco</Link> <Link to="/ajuda#missao">Nossa missão</Link>{" "}
          <Link to="/ajuda#trabalhe-conosco">Trabalhe conosco</Link>
        </div>
        <div className="footer-col">
          <h3>
            <span className="paw">🐾</span> Dúvidas
          </h3>
          <Link to="/ajuda#trocas">Trocas e devoluções</Link> <Link to="/ajuda#pagamento">Formas de pagamento</Link>{" "}
          <Link to="/ajuda#entregas">Entregas e prazos</Link>
        </div>
        <div className="footer-col footer-contact">
          <h3>
            <span className="paw">📞</span> Contato
          </h3>
          {/* sem telefone: o atendimento é pelo Fale conosco (o mesmo suporte do app) */}
          <Link to="/ajuda#fale-conosco">
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M20 11.5a8 8 0 01-11.7 7L4 20l1.6-4.2A8 8 0 1120 11.5z" />
            </svg>{" "}
            Suporte (Fale conosco)
          </Link>{" "}
          <a href="mailto:snoutshappy@gmail.com">
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </svg>{" "}
            snoutshappy@gmail.com
          </a>{" "}
          <span>
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M12 21s7-6.5 7-11.5A7 7 0 105 9.5C5 14.5 12 21 12 21z" />
              <circle cx="12" cy="9.5" r="2.3" />
            </svg>{" "}
            Osasco-SP
          </span>
        </div>
        <div className="footer-app">
          <h3>Baixe nosso aplicativo</h3>
          <div className="app-badges">
            <a href="#" aria-label="App Store" className="badge">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                <path d="M16.5 12.3c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.6-1.3-.1-2.5.8-3.1.8-.6 0-1.6-.7-2.7-.7-1.4 0-2.6.8-3.3 2-1.4 2.5-.4 6.1 1 8.1.7 1 1.5 2.1 2.6 2 1-.04 1.4-.7 2.7-.7 1.2 0 1.6.7 2.7.7 1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.2 1.1-2.3-.1 0-2.1-.8-2.3-3.1zM14.3 5.9c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 .1 1.9-.5 2.5-1.2z" />
              </svg>
            </a>{" "}
            <a href="#" aria-label="Google Play" className="badge">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                <path d="M4 3.5c-.3.3-.5.7-.5 1.2v14.6c0 .5.2.9.5 1.2l.1.1L13 12 4.1 3.4 4 3.5z" />
                <path d="M16 15l-3-3 3-3 3.5 2c.6.3.6 1 0 1.3L16 15z" opacity=".85" />
                <path d="M13 12l3 3-11 6.5c-.4.2-.8.2-1.1 0L13 12z" opacity=".7" />
                <path d="M13 12L4 5.4l.1-.1c.3-.2.7-.2 1.1 0L16 9l-3 3z" opacity=".7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      <p className="footer-copy">Happy Snouts © 2026 - Todos os direitos reservados</p>
    </footer>
  );
}
