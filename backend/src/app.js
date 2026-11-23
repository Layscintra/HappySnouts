import express from 'express';
import cors from 'cors';

import authRoutes from "./routes/auth.route.js";
import clienteRoutes from "./routes/cliente.route.js";
import petsRoutes from "./routes/pets.route.js";
import produtosRoutes from "./routes/produtos.route.js";
import enderecoRoutes from "./routes/endereco.route.js";
import favoritosRoutes from "./routes/favoritos.route.js";
import carrinhoRoutes from "./routes/carrinho.route.js";
import categoriaBlogRoutes from "./routes/categoriaBlog.route.js";
import postBlogRoutes from "./routes/postBlog.route.js";
import categoriaProduto from "./routes/categoriaProduto.route.js";
import cartoesRoute from "./routes/cartoes.route.js";
import formasPagamentoRoute from "./routes/formasPagamento.route.js";
import lembretesRoute from "./routes/lembretes.route.js";
import uploadRoutes from "./routes/upload.route.js";
import pedidoRoutes from "./routes/pedido.route.js";
import notificacaoRoutes from "./routes/notificacao.route.js";
import contatoRoutes from "./routes/contato.route.js";
import cepRoutes from "./routes/cep.route.js";

const app = express();
app.use(cors());
app.use(express.json());

app.set("etag", false);
app.use((req, res, next) => {
  if (!req.path.startsWith("/uploads")) res.set("Cache-Control", "no-store");
  next();
});

app.use("/auth", authRoutes);
app.use("/cliente", clienteRoutes);
app.use("/pets", petsRoutes);
app.use("/produtos", produtosRoutes);
app.use("/endereco", enderecoRoutes);
app.use("/favoritos", favoritosRoutes);
app.use("/carrinho", carrinhoRoutes);
app.use("/categoriaBlog", categoriaBlogRoutes);
app.use("/postBlog", postBlogRoutes);
app.use("/categoriaProduto", categoriaProduto);
app.use("/cartoes", cartoesRoute);
app.use("/pagamento", cartoesRoute);
app.use("/formas-pagamento", formasPagamentoRoute);
app.use("/lembretes", lembretesRoute);
app.use("/uploads", express.static("uploads"));
app.use("/upload", uploadRoutes);
app.use("/pedidos", pedidoRoutes);
app.use("/notificacoes", notificacaoRoutes);
app.use("/contato", contatoRoutes);
app.use("/cep", cepRoutes);


export default app;
