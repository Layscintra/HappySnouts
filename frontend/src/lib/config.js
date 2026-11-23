// Para usar outro backend, crie frontend/.env com VITE_API_URL=https://...

export const API_URL = import.meta.env.VITE_API_URL || "https://gracious-lightseagreen-gnat-00.hostingersite.com";

export const ENDPOINTS = {
  login: "/auth/login",
  esqueciSenha: "/auth/esqueci-senha",
  verificarCodigo: "/auth/verificar-codigo",
  redefinirSenha: "/auth/redefinir-senha",
  codigoCadastro: "/auth/cliente/codigo-cadastro",
  registrarCliente: "/auth/cliente/registrar",
  cep: "/cep",

  cliente: "/cliente",
  pets: "/pets",
  produtos: "/produtos",
  categoriasProduto: "/categoriaProduto",
  favoritos: "/favoritos",
  carrinho: "/carrinho",
  enderecos: "/endereco",
  pedidos: "/pedidos",
  contato: "/contato",
  postsBlog: "/postBlog",
  categoriasBlog: "/categoriaBlog",
  pagamento: "/pagamento",
  formasPagamento: "/formas-pagamento",
  lembretes: "/lembretes",
  upload: "/upload"
};

export const PAGINAS = {
  inicio: "/",
  login: "/login",
  cadastro: "/cadastro",
  perfil: "/perfil",
  painelFuncionario: "/painel-funcionario"
};
