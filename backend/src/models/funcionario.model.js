import { conexao } from "../config/db.js";

export async function contarFuncionarios() {
    const [resultado] = await conexao.query("SELECT COUNT(*) AS total FROM funcionarios");
    return Number(resultado[0].total);
}

export async function listarFuncionarios() {
    const [resultado] = await conexao.query(
        `SELECT id_funcionario, nome, cargo, email, telefone, ativo 
         FROM funcionarios`
    );
    return resultado;
}

export async function buscarFuncionarioPorId(id) {
    const [resultado] = await conexao.query(
        `SELECT id_funcionario, nome, cargo, email, telefone, ativo 
         FROM funcionarios WHERE id_funcionario = ?`,
        [id]
    );
    return resultado[0];
}

export async function buscarFuncionarioPorEmail(email) {
    const [resultado] = await conexao.query(
        "SELECT * FROM funcionarios WHERE email = ?",
        [email]
    );
    return resultado[0];
}


export async function criarFuncionario({ nome, cargo, email, telefone, senha_hash }) {
    const [resultado] = await conexao.query(
        `INSERT INTO funcionarios (nome, cargo, email, telefone, senha_hash) 
         VALUES (?, ?, ?, ?, ?)`,
        [nome, cargo, email, telefone, senha_hash]
    );
    return resultado.insertId;
}

export async function atualizarFuncionario(id, { nome, cargo, email, telefone, senha_hash }) {
    const [resultado] = await conexao.query(
        `UPDATE funcionarios 
         SET nome = ?, cargo = ?, email = ?, telefone = ?, senha_hash = ? 
         WHERE id_funcionario = ?`,
        [nome, cargo, email, telefone, senha_hash, id]
    );
    return resultado.affectedRows > 0;
}

export async function desativarFuncionario(id) {
    const [resultado] = await conexao.query(
        "UPDATE funcionarios SET ativo = FALSE WHERE id_funcionario = ?",
        [id]
    );
    return resultado.affectedRows > 0;
}

export async function deletarFuncionario(id) {
    const [resultado] = await conexao.query(
        "DELETE FROM funcionarios WHERE id_funcionario = ?",
        [id]
    );
    return resultado.affectedRows > 0;
}