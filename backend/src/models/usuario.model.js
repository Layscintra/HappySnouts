import { conexao } from "../config/db.js";


export async function listarClientes() {
    const [resultado] = await conexao.query(
        `SELECT Id_usuario, nome_completo, nome_usuario, email, telefone, foto_url, data_nascimento, tipo_login, data_cadastro
        FROM clientes`
    );
    return resultado;
}

export async function buscarClientePorId(id) {
    const [resultado] = await conexao.query(
        `SELECT Id_usuario, nome_completo, nome_usuario, email, telefone,foto_url, data_nascimento, tipo_login, data_cadastro 
         FROM clientes WHERE Id_usuario = ?`,
        [id]
    );
    return resultado[0];
}


export async function buscarClientePorEmail(email) {
    const [resultado] = await conexao.query(
        "SELECT * FROM clientes WHERE email = ?",
        [email]
    );
    return resultado[0];
}

export async function criarCliente({ nome_completo, nome_usuario, email, cpf, telefone, data_nascimento, senha_hash, foto_url, id_google, tipo_login }) {
    const [resultado] = await conexao.query(
        `INSERT INTO clientes 
            (nome_completo, nome_usuario, email, cpf, telefone, data_nascimento, senha_hash,foto_url, Id_google, tipo_login) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nome_completo, nome_usuario, email, cpf, telefone, data_nascimento, senha_hash, foto_url ?? null, id_google ?? null, tipo_login || "local"]
    );
    return resultado.insertId;
}

export async function atualizarCliente(id, dadosAtualizados) {
    const camposPermitidos = ["nome_completo", "nome_usuario", "foto_url", "email", "telefone", "data_nascimento"];

    const campos = [];
    const valores = [];

    for (const campo of camposPermitidos) {
        if (dadosAtualizados[campo] !== undefined) {
            campos.push(`${campo} = ?`);
            valores.push(dadosAtualizados[campo]);
        }
    }

    if (campos.length === 0) {
        return false;
    }

    valores.push(id);

    const [resultado] = await conexao.query(
        `UPDATE clientes SET ${campos.join(", ")} WHERE Id_usuario = ?`,
        valores
    );

    return resultado.affectedRows > 0;
}

export async function buscarSenhaHashPorId(id) {
    const [resultado] = await conexao.query(
        "SELECT senha_hash FROM clientes WHERE Id_usuario = ?",
        [id]
    );
    return resultado[0]?.senha_hash;
}

export async function atualizarSenhaCliente(id, novoHash) {
    const [resultado] = await conexao.query(
        "UPDATE clientes SET senha_hash = ? WHERE Id_usuario = ?",
        [novoHash, id]
    );

    return resultado.affectedRows > 0;
}

export async function deletarCliente(id) {
    const [resultado] = await conexao.query(
        "DELETE FROM clientes WHERE Id_usuario = ?",
        [id]
    );
    return resultado.affectedRows > 0;
}

export async function nomeUsuarioExiste(nome_usuario) {
    const [resultado] = await conexao.query("SELECT 1 FROM clientes WHERE nome_usuario = ?", [nome_usuario]);
    return resultado.length > 0;
}
