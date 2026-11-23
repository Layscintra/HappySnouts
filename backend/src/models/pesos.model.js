import { conexao } from "../config/db.js";

const CRIAR_TABELA = `
    CREATE TABLE IF NOT EXISTS historico_peso (
        id_peso       INT AUTO_INCREMENT PRIMARY KEY,
        id_pet        INT NOT NULL,
        peso          DECIMAL(6,3) NOT NULL,
        data_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_historico_peso_pet (id_pet, data_registro),
        FOREIGN KEY (id_pet) REFERENCES pets(id_pet) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
`;

let tabelaPronta = null;
function garantirTabela() {
    if (!tabelaPronta) {
        tabelaPronta = conexao.query(CRIAR_TABELA).catch(erro => {
            tabelaPronta = null;
            throw erro;
        });
    }
    return tabelaPronta;
}

export async function listarPorPet(id_pet) {
    await garantirTabela();
    const [resultado] = await conexao.query(
        `SELECT id_peso, id_pet, peso, data_registro
         FROM historico_peso
         WHERE id_pet = ?
         ORDER BY data_registro ASC, id_peso ASC`,
        [id_pet]
    );
    return resultado;
}

export async function registrar(id_pet, peso, data_registro = null) {
    await garantirTabela();
    const [resultado] = await conexao.query(
        data_registro
            ? "INSERT INTO historico_peso (id_pet, peso, data_registro) VALUES (?, ?, ?)"
            : "INSERT INTO historico_peso (id_pet, peso) VALUES (?, ?)",
        data_registro ? [id_pet, peso, data_registro] : [id_pet, peso]
    );
    return resultado.insertId;
}

export async function deletar(id_peso, id_pet) {
    await garantirTabela();
    const [resultado] = await conexao.query(
        "DELETE FROM historico_peso WHERE id_peso = ? AND id_pet = ?",
        [id_peso, id_pet]
    );
    return resultado.affectedRows > 0;
}

export async function ultimo(id_pet) {
    await garantirTabela();
    const [resultado] = await conexao.query(
        `SELECT peso FROM historico_peso
         WHERE id_pet = ?
         ORDER BY data_registro DESC, id_peso DESC
         LIMIT 1`,
        [id_pet]
    );
    return resultado[0] ? resultado[0].peso : null;
}
