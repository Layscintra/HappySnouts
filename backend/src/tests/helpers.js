import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../app.js";
import { conexao } from "../config/db.js";
import * as clientesModel from "../models/usuario.model.js";
import * as funcionarioModel from "../models/funcionario.model.js";

export const SENHA_TESTE = "senha123";

function cpfAleatorio() {
    return String(Date.now()).slice(-8) + String(Math.floor(Math.random() * 900) + 100);
}

export async function criarClienteTeste() {
    const sufixo = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const email = `teste_${sufixo}@gmail.com`;

    const id = await clientesModel.criarCliente({
        nome_completo: "Cliente Teste",
        nome_usuario: `cliente_teste_${sufixo}`,
        email,
        cpf: cpfAleatorio(),
        telefone: "11991827364",
        data_nascimento: "2000-05-10",
        senha_hash: await bcrypt.hash(SENHA_TESTE, 10)
    });

    const login = await request(app).post("/auth/login").send({ email, senha: SENHA_TESTE });

    return { id, email, token: login.body.token };
}

export async function criarFuncionarioTeste() {
    const email = `func_teste_${Date.now()}${Math.floor(Math.random() * 1000)}@gmail.com`;

    const id = await funcionarioModel.criarFuncionario({
        nome: "Funcionario Teste",
        cargo: "Teste",
        email,
        telefone: "11991827364",
        senha_hash: await bcrypt.hash(SENHA_TESTE, 10)
    });

    const login = await request(app).post("/auth/login").send({ email, senha: SENHA_TESTE });

    return { id, email, token: login.body.token };
}

export async function removerClienteTeste(id) {
    if (!id) return;
    await conexao.query("DELETE FROM lembretes WHERE id_pet IN (SELECT id_pet FROM pets WHERE id_usuario = ?)", [id]);
    await conexao.query("DELETE FROM pets WHERE id_usuario = ?", [id]);
    await conexao.query("DELETE FROM cartoes WHERE id_usuario = ?", [id]);
    await conexao.query("DELETE FROM favoritos WHERE id_usuario = ?", [id]);
    await conexao.query("DELETE FROM itens_carrinho WHERE id_carrinho IN (SELECT id_carrinho FROM carrinho WHERE id_usuario = ?)", [id]);
    await conexao.query("DELETE FROM carrinho WHERE id_usuario = ?", [id]);
    await conexao.query("DELETE FROM pedidos WHERE id_usuario = ?", [id]);
    await conexao.query("DELETE FROM enderecos_usuario WHERE id_usuario = ?", [id]);
    await conexao.query("DELETE FROM clientes WHERE Id_usuario = ?", [id]);
}

export async function removerFuncionarioTeste(id) {
    if (!id) return;
    await conexao.query("DELETE FROM funcionarios WHERE id_funcionario = ?", [id]);
}

export function auth(token) {
    return { Authorization: `Bearer ${token}` };
}
