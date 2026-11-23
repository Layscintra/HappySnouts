import { conexao } from "../config/db.js";

export async function listarPetsPorUsuario(Id_usuario) {
    const [resultado] = await conexao.query(
        `SELECT id_pet, Id_usuario, nome_pet, raca, idade_pet, id_coleira, id_alimentador, peso_atual, foto_url
        FROM pets WHERE Id_usuario = ?`, 
        [Id_usuario]
    );
    return resultado;
}

export async function buscarPetDoUsuario(id_pet, id_usuario) {
    const [resultado] = await conexao.query(
        `SELECT id_pet, Id_usuario, nome_pet, raca, idade_pet, id_coleira, id_alimentador, peso_atual, foto_url
        FROM pets WHERE id_pet = ? AND id_usuario = ?`,
        [id_pet, id_usuario]
    );
    return resultado[0];
}

export async function buscarPetPorId(id_pet) {
    const [resultado] = await conexao.query(
        `SELECT id_pet, Id_usuario, nome_pet, raca, idade_pet, id_coleira, id_alimentador, peso_atual, foto_url
        FROM pets WHERE Id_pet = ? `, 
        [id_pet]
    );
    return resultado[0];
}

export async function criarPet({ id_usuario, nome_pet, raca, idade_pet, id_coleira, id_alimentador, peso_atual, foto_url }) {
    const [resultado] = await conexao.query(
        `INSERT INTO pets (id_usuario, nome_pet, raca, idade_pet, id_coleira, id_alimentador, peso_atual, foto_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id_usuario, nome_pet, raca, idade_pet, id_coleira, id_alimentador, peso_atual, foto_url ?? null]
    );
    return resultado.insertId;
}

export async function atualizarPet(id_pet, { nome_pet, raca, idade_pet, id_coleira, id_alimentador, peso_atual, foto_url }) {
    const [resultado] = await conexao.query(
        `UPDATE pets 
         SET nome_pet = ?, raca = ?, idade_pet = ?, id_coleira = ?, id_alimentador = ?, peso_atual = ?, foto_url = ?
         WHERE Id_pet = ?`,
        [nome_pet, raca, idade_pet, id_coleira, id_alimentador, peso_atual, foto_url ?? null, id_pet]
    );
    return resultado.affectedRows > 0;
}

export async function deletarPet(id_pet) {
    const [resultado] = await conexao.query(
        "DELETE FROM pets WHERE Id_pet = ?",
        [id_pet]
    );
    return resultado.affectedRows > 0;
}
export async function atualizarPesoAtual(id_pet, peso_atual) {
    const [resultado] = await conexao.query(
        "UPDATE pets SET peso_atual = ? WHERE Id_pet = ?",
        [peso_atual, id_pet]
    );
    return resultado.affectedRows > 0;
}
