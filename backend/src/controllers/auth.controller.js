import crypto from "crypto";
import * as clientesModel from "../models/usuario.model.js";
import * as funcionarioModel from "../models/funcionario.model.js";
import * as recuperacaoModel from "../models/recuperacao.model.js";
import { jwtConfig } from "../config/jwt.js";
import { enviarEmail, emailConfigurado } from "../services/email.service.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { erroDataNascimento } from "../services/idade.service.js";
import { erroTelefone, digitosTelefone } from "../services/telefone.service.js";
import { erroEmail } from "../services/emailValido.service.js";

const MINUTOS_CODIGO = 15;
const MAX_TENTATIVAS = 5;

function normalizarEmail(email) {
    return String(email || "").trim().toLowerCase();
}

function tokenCliente(cliente) {
    return jwt.sign(
        { id: cliente.Id_usuario, nome: cliente.nome_completo, email: cliente.email, tipo: "cliente" },
        jwtConfig.secret,
        { expiresIn: "8h" }
    );
}

function tokenFuncionario(funcionario) {
    return jwt.sign(
        { id: funcionario.id_funcionario, nome: funcionario.nome, email: funcionario.email, tipo: "funcionario", cargo: funcionario.cargo },
        jwtConfig.secret,
        { expiresIn: "8h" }
    );
}

export const registrarCliente = async (req, res) => {
    try {
        const { nome_completo, nome_usuario, cpf, telefone, data_nascimento, senha } = req.body;
        const email = normalizarEmail(req.body.email);

        if (!nome_completo || !nome_usuario || !email || !cpf || !senha) {
            return res.status(400).json({ mensagem: "Nome completo, nome de usuário, email, CPF e senha são obrigatórios" })
        }

        if (String(senha).length < 6) {
            return res.status(400).json({ mensagem: "A senha precisa ter pelo menos 6 caracteres" });
        }

        const erroMail = await erroEmail(email);
        if (erroMail) {
            return res.status(400).json({ mensagem: erroMail });
        }

        const erroNascimento = erroDataNascimento(data_nascimento);
        if (erroNascimento) {
            return res.status(400).json({ mensagem: erroNascimento });
        }

        const erroTel = erroTelefone(telefone);
        if (erroTel) {
            return res.status(400).json({ mensagem: erroTel });
        }

        const clienteExistente = await clientesModel.buscarClientePorEmail(email);
        const funcionarioExistente = await funcionarioModel.buscarFuncionarioPorEmail(email);

        if (clienteExistente || funcionarioExistente) {
            return res.status(400).json({ mensagem: "Email já cadastrado" });
        }

        if (!req.body.codigo_email) {
            return res.status(400).json({ mensagem: "Confirme seu e-mail com o código que enviamos." });
        }
        const registroCodigo = await conferirCodigo(email, req.body.codigo_email, res);
        if (!registroCodigo) return;

        const senha_hash = await bcrypt.hash(senha, 10);

        const id = await clientesModel.criarCliente({
            nome_completo,
            nome_usuario,
            email,
            cpf,
            telefone: digitosTelefone(telefone),
            data_nascimento,
            senha_hash
        });

        await recuperacaoModel.invalidarCodigos(email);

        enviarEmail({
            para: email,
            assunto: "Bem-vindo(a) ao Happy Snouts! 🐾",
            titulo: "Sua conta foi criada",
            paragrafos: [
                `Olá, ${String(nome_completo).split(" ")[0]}!`,
                "Que bom ter você com a gente. No app você cadastra seus pets, agenda vacinas e consultas, acompanha seus pedidos e conecta a coleira e o alimentador inteligentes.",
                "Qualquer dúvida, é só falar com a gente pelo Fale conosco."
            ]
        });

        res.status(201).json({ mensagem: "Cliente cadastrado com sucesso", id });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            const campo = /cpf/i.test(error.message) ? "CPF" : /nome_usuario/i.test(error.message) ? "Nome de usuário" : "Email";
            return res.status(400).json({ mensagem: `${campo} já cadastrado` });
        }
        res.status(500).json({
            mensagem: "Erro ao registrar cliente",
            erro: error.message
        });
    }
}

export const login = async (req, res) => {
    try {
        const email = normalizarEmail(req.body.email);
        const { senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ mensagem: "Email e senha são obrigatórios" });
        }

        const funcionario = await funcionarioModel.buscarFuncionarioPorEmail(email);
        if (funcionario && await bcrypt.compare(senha, funcionario.senha_hash)) {
            if (!funcionario.ativo) {
                return res.status(403).json({ mensagem: "Funcionário inativo, acesso negado" });
            }
            return res.json({ mensagem: "Login realizado com sucesso", tipo: "funcionario", token: tokenFuncionario(funcionario) });
        }

        const cliente = await clientesModel.buscarClientePorEmail(email);
        if (!cliente && !funcionario) {
            return res.status(404).json({ mensagem: "Usuário não encontrado" });
        }
        if (cliente && !cliente.senha_hash) {
            return res.status(400).json({ mensagem: "Essa conta ainda não tem senha. Clique em \"Esqueci minha senha\" para criar uma." });
        }
        if (!cliente || !(await bcrypt.compare(senha, cliente.senha_hash))) {
            return res.status(401).json({ mensagem: "Senha inválida" });
        }

        return res.json({ mensagem: "Login realizado com sucesso", tipo: "cliente", token: tokenCliente(cliente) });
    } catch (error) {
        res.status(500).json({ mensagem: "Erro no login", erro: error.message });
    }
};

export const esqueciSenha = async (req, res) => {
    const resposta = {
        mensagem: "Se este e-mail estiver cadastrado, você vai receber um código para criar uma nova senha."
    };
    try {
        const email = normalizarEmail(req.body.email);
        if (!email) {
            return res.status(400).json({ mensagem: "Informe o e-mail" });
        }

        const funcionario = await funcionarioModel.buscarFuncionarioPorEmail(email);
        const cliente = funcionario ? null : await clientesModel.buscarClientePorEmail(email);
        const conta = funcionario || cliente;

        if (!conta) return res.json(resposta);

        const anterior = await recuperacaoModel.ultimoCodigo(email);
        if (anterior) {
            const { idadeSegundos } = await recuperacaoModel.estaValido(anterior.id_recuperacao);
            if (idadeSegundos < 60) {
                return res.status(429).json({ mensagem: "Aguarde 1 minuto para pedir um novo código." });
            }
        }

        const codigo = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
        await recuperacaoModel.invalidarCodigos(email);
        await recuperacaoModel.criarCodigo({
            email,
            tipo_usuario: funcionario ? "funcionario" : "cliente",
            codigo_hash: await bcrypt.hash(codigo, 10),
            minutos: MINUTOS_CODIGO
        });

        const nome = String(funcionario ? funcionario.nome : cliente.nome_completo).split(" ")[0];
        const enviado = await enviarEmail({
            para: email,
            assunto: `${codigo} é o seu código Happy Snouts`,
            titulo: "Redefinição de senha",
            paragrafos: [
                `Olá, ${nome}!`,
                "Recebemos um pedido para criar uma nova senha na sua conta. Digite o código abaixo no app:"
            ],
            destaque: codigo,
            rodape: `O código vale por ${MINUTOS_CODIGO} minutos. Se não foi você, ignore este e-mail: sua senha continua a mesma.`
        });

        if (!enviado && emailConfigurado) {
            await recuperacaoModel.invalidarCodigos(email);
            return res.status(503).json({ mensagem: "Não conseguimos enviar o e-mail agora. Tente de novo em instantes." });
        }

        return res.json(resposta);
    } catch (error) {
        return res.status(500).json({ mensagem: "Erro ao enviar o código", erro: error.message });
    }
};

export const codigoCadastro = async (req, res) => {
    try {
        const email = normalizarEmail(req.body.email);

        const erroMail = await erroEmail(email);
        if (erroMail) {
            return res.status(400).json({ mensagem: erroMail });
        }

        const jaExiste = (await clientesModel.buscarClientePorEmail(email)) || (await funcionarioModel.buscarFuncionarioPorEmail(email));
        if (jaExiste) {
            return res.status(400).json({ mensagem: "Email já cadastrado. Entre na sua conta ou use \"Esqueceu a senha?\"." });
        }

        const anterior = await recuperacaoModel.ultimoCodigo(email);
        if (anterior) {
            const { idadeSegundos } = await recuperacaoModel.estaValido(anterior.id_recuperacao);
            if (idadeSegundos < 60) {
                return res.status(429).json({ mensagem: "Aguarde 1 minuto para pedir um novo código." });
            }
        }

        const codigo = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
        await recuperacaoModel.invalidarCodigos(email);
        await recuperacaoModel.criarCodigo({
            email,
            tipo_usuario: "cliente",
            codigo_hash: await bcrypt.hash(codigo, 10),
            minutos: MINUTOS_CODIGO
        });

        const nome = String(req.body.nome || "").trim().split(" ")[0];
        const enviado = await enviarEmail({
            para: email,
            assunto: `${codigo} é o seu código Happy Snouts`,
            titulo: "Confirme seu e-mail",
            paragrafos: [
                nome ? `Olá, ${nome}!` : "Olá!",
                "Falta pouco para criar sua conta no Happy Snouts. Digite o código abaixo para confirmar seu e-mail:"
            ],
            destaque: codigo,
            rodape: `O código vale por ${MINUTOS_CODIGO} minutos. Se não foi você que pediu, é só ignorar este e-mail.`
        });

        if (!enviado && emailConfigurado) {
            await recuperacaoModel.invalidarCodigos(email);
            return res.status(503).json({ mensagem: "Não conseguimos enviar o e-mail agora. Tente de novo em instantes." });
        }

        return res.json({ mensagem: `Enviamos um código para ${email}.`, minutos: MINUTOS_CODIGO });
    } catch (error) {
        return res.status(500).json({ mensagem: "Erro ao enviar o código", erro: error.message });
    }
};

async function conferirCodigo(email, codigo, res) {
    if (!email || !codigo) {
        res.status(400).json({ mensagem: "Informe o e-mail e o código" });
        return null;
    }
    const registro = await recuperacaoModel.ultimoCodigo(email);
    if (!registro) {
        res.status(400).json({ mensagem: "Código inválido. Peça um novo código." });
        return null;
    }
    const { valido } = await recuperacaoModel.estaValido(registro.id_recuperacao);
    if (!valido || registro.tentativas >= MAX_TENTATIVAS) {
        await recuperacaoModel.marcarUsado(registro.id_recuperacao);
        res.status(400).json({ mensagem: "Código expirado. Peça um novo código." });
        return null;
    }
    if (!(await bcrypt.compare(String(codigo).trim(), registro.codigo_hash))) {
        await recuperacaoModel.somarTentativa(registro.id_recuperacao);
        const restantes = MAX_TENTATIVAS - registro.tentativas - 1;
        res.status(400).json({
            mensagem: restantes > 0 ? `Código incorreto. Você ainda tem ${restantes} tentativa(s).` : "Código incorreto. Peça um novo código."
        });
        return null;
    }
    return registro;
}

export const verificarCodigo = async (req, res) => {
    try {
        const registro = await conferirCodigo(normalizarEmail(req.body.email), req.body.codigo, res);
        if (!registro) return;
        return res.json({ mensagem: "Código confirmado" });
    } catch (error) {
        return res.status(500).json({ mensagem: "Erro ao conferir o código", erro: error.message });
    }
};

export const redefinirSenha = async (req, res) => {
    try {
        const email = normalizarEmail(req.body.email);
        const { nova_senha } = req.body;

        if (!nova_senha || String(nova_senha).length < 6) {
            return res.status(400).json({ mensagem: "A nova senha precisa ter pelo menos 6 caracteres" });
        }

        const registro = await conferirCodigo(email, req.body.codigo, res);
        if (!registro) return;

        const hash = await bcrypt.hash(nova_senha, 10);
        const atualizado = registro.tipo_usuario === "funcionario"
            ? await recuperacaoModel.atualizarSenhaFuncionario(email, hash)
            : await recuperacaoModel.atualizarSenhaClientePorEmail(email, hash);

        await recuperacaoModel.invalidarCodigos(email);

        if (!atualizado) {
            return res.status(404).json({ mensagem: "Conta não encontrada" });
        }

        enviarEmail({
            para: email,
            assunto: "Sua senha foi alterada",
            titulo: "Senha alterada com sucesso",
            paragrafos: [
                "A senha da sua conta Happy Snouts acabou de ser alterada.",
                "Se não foi você, peça um novo código em \"Esqueceu a senha?\" e fale com a gente pelo Fale conosco."
            ]
        });

        return res.json({ mensagem: "Senha alterada com sucesso. Agora é só entrar com a nova senha." });
    } catch (error) {
        return res.status(500).json({ mensagem: "Erro ao redefinir a senha", erro: error.message });
    }
};

export const LoginCliente = async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ mensagem: "Email e senha são obrigatórios" });
        }

        const cliente = await clientesModel.buscarClientePorEmail(email);

        if (!cliente) {
            return res.status(404).json({ mensagem: "Cliente não encontrado" });
        }

        if (!cliente.senha_hash || !(await bcrypt.compare(senha, cliente.senha_hash))) {
            return res.status(401).json({ mensagem: "Senha inválida" });
        }

        res.json({ mensagem: "Login realizado com sucesso", token: tokenCliente(cliente) });

    } catch (error) {
        res.status(500).json({ mensagem: "Erro no login", erro: error.message });
    }
};

export const registrarFuncionario = async (req, res) => {
    try {
        const { nome, cargo, telefone, senha } = req.body;
        const email = normalizarEmail(req.body.email);

        if (!nome || !email || !senha) {
            return res.status(400).json({ mensagem: "Nome completo, email, e senha são obrigatórios" })
        }

        const erroMail = await erroEmail(email);
        if (erroMail) {
            return res.status(400).json({ mensagem: erroMail });
        }

        const funcionarioExistente = await funcionarioModel.buscarFuncionarioPorEmail(email);

        if (funcionarioExistente) {
            return res.status(400).json({ mensagem: "Email já cadastrado" });
        }

        const senha_hash = await bcrypt.hash(senha, 10);

        const id = await funcionarioModel.criarFuncionario({ nome, cargo, email, telefone, senha_hash });

        res.status(201).json({ mensagem: "Funcionario cadastrado com sucesso", id });

    } catch (error) {
        res.status(500).json({ mensagem: "Erro ao registrar funcionario", erro: error.message });
    }
}

export const LoginFuncionario = async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ mensagem: "Email e senha são obrigatórios" });
        }

        const funcionario = await funcionarioModel.buscarFuncionarioPorEmail(email);

        if (!funcionario) {
            return res.status(404).json({ mensagem: "Funcionario não encontrado" });
        }

        if (!funcionario.ativo) {
            return res.status(403).json({ mensagem: "Funcionário inativo, acesso negado" });
        }

        if (!(await bcrypt.compare(senha, funcionario.senha_hash))) {
            return res.status(401).json({ mensagem: "Senha inválida" });
        }

        res.json({ mensagem: "Login realizado com sucesso", token: tokenFuncionario(funcionario) });

    } catch (error) {
        res.status(500).json({ mensagem: "Erro no login", erro: error.message });
    }
};
