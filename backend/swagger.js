import swaggerJSDoc from "swagger-jsdoc";
import "dotenv/config";

const port = process.env.PORT || 5000;
const swaggerServerUrl = process.env.SWAGGER_SERVER_URL || `http://localhost:${port}`;

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API do Sistema Happy Snouts",
      version: "1.0.0",
      description:
        "Documentação da API do Happy Snouts."
    },
    tags: [
      { name: "Auth", description: "Login e recuperação de senha" },
      { name: "Auth - Cliente", description: "Cadastro e login de clientes" },
      { name: "Auth - Funcionário", description: "Cadastro e login de funcionários" },
      { name: "Cliente", description: "Conta do cliente" },
      { name: "Endereços", description: "Endereços de entrega" },
      { name: "CEP", description: "Consulta de CEP" },
      { name: "Pets", description: "Pets do usuário" },
      { name: "Lembretes", description: "Agenda de cuidados dos pets (somente cliente)" },
      { name: "Produtos", description: "Catálogo da loja" },
      { name: "Categorias de Produto", description: "Categorias da loja" },
      { name: "Favoritos", description: "Produtos favoritos" },
      { name: "Carrinho", description: "Carrinho e finalização de compra (somente cliente)" },
      { name: "Cartões", description: "Cartões salvos do cliente (tabela cartoes). Também responde em /pagamento, o caminho antigo" },
      { name: "Formas de pagamento", description: "Pix, cartão de crédito, cartão de débito e boleto" },
      { name: "Pedidos", description: "Pedidos e acompanhamento" },
      { name: "Blog", description: "Posts do blog" },
      { name: "Categorias do Blog", description: "Categorias do blog" },
      { name: "Notificações", description: "Notificações do cliente" },
      { name: "Fale conosco", description: "Mensagens de contato" },
      { name: "Upload", description: "Envio de imagens" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        EnderecoInput: {
          type: "object",
          required: ["cep", "estado", "cidade", "bairro", "endereco", "numero"],
          properties: {
            cep: { type: "string", example: "01310-100" },
            estado: { type: "string", example: "SP" },
            cidade: { type: "string", example: "São Paulo" },
            bairro: { type: "string", example: "Bela Vista" },
            endereco: { type: "string", example: "Avenida Paulista" },
            numero: { type: "string", example: "1000" },
            apelido: { type: "string", example: "Casa" },
            padrao: { type: "boolean" }
          }
        },
        ProdutoInput: {
          type: "object",
          required: ["nome", "descricao", "preco", "id_categoria", "imagem_url"],
          properties: {
            nome: { type: "string" },
            descricao: { type: "string" },
            preco: { type: "number", example: 49.9 },
            preco_promocional: { type: "number", nullable: true },
            id_categoria: { type: "integer" },
            imagem_url: { type: "string", description: "Caminho retornado por POST /upload" }
          }
        },
        CategoriaProdutoInput: {
          type: "object",
          required: ["nome", "icone"],
          properties: {
            nome: { type: "string", example: "Rações" },
            icone: { type: "string" }
          }
        },
        CategoriaBlogInput: {
          type: "object",
          required: ["nome", "cor", "icone"],
          properties: {
            nome: { type: "string", example: "Saúde" },
            cor: { type: "string", example: "#E57373" },
            icone: { type: "string" }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    servers: [
      {
        url: swaggerServerUrl
      }
    ]
  },
  apis: ["./src/routes/*.js"]
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
