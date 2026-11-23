import { conexao } from "../config/db.js";

const CAMPOS = `
    l.id_lembrete,
    l.id_pet,
    p.nome_pet,
    p.raca,
    l.titulo,
    l.tipo,
    l.cor,
    l.descricao,
    l.data_hora,
    l.recorrente,
    l.concluido
`;

export async function listarPorMes(id_usuario, ano, mes) {
    const [resultado] = await conexao.query(
        `SELECT ${CAMPOS}
         FROM lembretes l
         JOIN pets p ON p.id_pet = l.id_pet
         WHERE p.id_usuario = ?
           AND YEAR(l.data_hora) = ?
           AND MONTH(l.data_hora) = ?
         ORDER BY l.data_hora ASC`,
        [id_usuario, ano, mes]
    );
    return resultado;
}

export async function listarProximos(id_usuario, limite = 5) {
    const [resultado] = await conexao.query(
        `SELECT ${CAMPOS}
         FROM lembretes l
         JOIN pets p ON p.id_pet = l.id_pet
         WHERE p.id_usuario = ?
           AND l.concluido = FALSE
           AND l.data_hora >= NOW()
         ORDER BY l.data_hora ASC
         LIMIT ?`,
        [id_usuario, limite]
    );
    return resultado;
}

export async function buscarPorId(id_lembrete, id_usuario) {
    const [resultado] = await conexao.query(
        `SELECT ${CAMPOS}
         FROM lembretes l
         JOIN pets p ON p.id_pet = l.id_pet
         WHERE l.id_lembrete = ? AND p.id_usuario = ?`,
        [id_lembrete, id_usuario]
    );
    return resultado[0];
}

export async function buscarPetDoUsuario(id_pet, id_usuario) {
    const [resultado] = await conexao.query(
        `SELECT id_pet FROM pets WHERE id_pet = ? AND id_usuario = ?`,
        [id_pet, id_usuario]
    );
    return resultado[0];
}

export async function criarLembrete({ id_pet, titulo, tipo, cor, descricao, data_hora, recorrente }) {
    const [resultado] = await conexao.query(
        `INSERT INTO lembretes (id_pet, titulo, tipo, cor, descricao, data_hora, recorrente)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id_pet, titulo, tipo, cor ?? "#9E9E9E", descricao ?? null, data_hora, recorrente ?? false]
    );
    return resultado.insertId;
}

export async function atualizarLembrete(id_lembrete, id_usuario, dados) {
    const camposPermitidos = ["titulo", "tipo", "cor", "descricao", "data_hora", "recorrente"];
    const campos = [];
    const valores = [];

    for (const campo of camposPermitidos) {
        if (dados[campo] !== undefined) {
            campos.push(`l.${campo} = ?`);
            valores.push(dados[campo]);
        }
    }

    if (campos.length === 0) return false;

    valores.push(id_lembrete, id_usuario);

    const [resultado] = await conexao.query(
        `UPDATE lembretes l
         JOIN pets p ON p.id_pet = l.id_pet
         SET ${campos.join(", ")}
         WHERE l.id_lembrete = ? AND p.id_usuario = ?`,
        valores
    );
    return resultado.affectedRows > 0;
}

export async function concluirLembrete(id_lembrete, id_usuario) {
    const [resultado] = await conexao.query(
        `UPDATE lembretes l
         JOIN pets p ON p.id_pet = l.id_pet
         SET l.concluido = TRUE
         WHERE l.id_lembrete = ? AND p.id_usuario = ?`,
        [id_lembrete, id_usuario]
    );
    return resultado.affectedRows > 0;
}

export async function deletarLembrete(id_lembrete, id_usuario) {
    const [resultado] = await conexao.query(
        `DELETE l FROM lembretes l
         JOIN pets p ON p.id_pet = l.id_pet
         WHERE l.id_lembrete = ? AND p.id_usuario = ?`,
        [id_lembrete, id_usuario]
    );
    return resultado.affectedRows > 0;
}