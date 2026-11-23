import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/jwt.js";
import * as contatoModel from "../models/contato.model.js";
import * as clientesModel from "../models/usuario.model.js";
import { enviarEmail } from "../services/email.service.js";
import { notificarCliente } from "../services/notificacao.service.js";

const ASSUNTOS = ["Dúvida", "Problema no app", "Pedido", "Sugestão", "Dispositivos", "Outro"];
const EMAIL_LOJA = process.env.EMAIL_LOJA || process.env.SMTP_USER;

function protocolo(id) {
    return `#${String(id).padStart(5, "0")}`;
}

function clienteDoToken(req) {
    const [tipo, token] = String(req.headers.authorization || "").split(" ");
    if (tipo !== "Bearer" || !token) return null;
    try {
        const payload = jwt.verify(token, jwtConfig.secret);
        return payload.tipo === "cliente" ? payload : null;
    } catch {
        return null;
    }
}

export async function enviarMensagem(req, res) {
    try {
        const usuario = clienteDoToken(req);
        let { nome, email } = req.body;
        const assunto = String(req.body.assunto || "").trim();
        const mensagem = String(req.body.mensagem || "").trim();

        if (usuario) {
            const cliente = await clientesModel.buscarClientePorId(usuario.id);
            nome = nome || cliente?.nome_completo;
            email = email || cliente?.email;
        }

        nome = String(nome || "").trim();
        email = String(email || "").trim().toLowerCase();

        if (!nome || !email || !assunto || !mensagem) {
            return res.status(400).json({ msg: "nome, email, assunto e mensagem são obrigatórios" });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ msg: "E-mail inválido" });
        }
        if (!ASSUNTOS.includes(assunto)) {
            return res.status(400).json({ msg: `assunto deve ser um destes: ${ASSUNTOS.join(", ")}` });
        }
        if (mensagem.length < 10 || mensagem.length > 2000) {
            return res.status(400).json({ msg: "A mensagem precisa ter entre 10 e 2000 caracteres" });
        }

        const id = await contatoModel.criarMensagem({ id_usuario: usuario?.id, nome, email, assunto, mensagem });

        enviarEmail({
            para: email,
            assunto: `Recebemos sua mensagem ${protocolo(id)}`,
            titulo: "Recebemos sua mensagem",
            paragrafos: [
                `Olá, ${nome.split(" ")[0]}!`,
                `Sua mensagem sobre "${assunto}" chegou para a equipe Happy Snouts. Protocolo ${protocolo(id)}.`,
                "Respondemos em até 1 dia útil, por e-mail e no app (Perfil > Configuração > Fale conosco).",
                `Sua mensagem:\n${mensagem}`
            ]
        });
        if (EMAIL_LOJA) {
            enviarEmail({
                para: EMAIL_LOJA,
                assunto: `[Fale conosco] ${assunto} - ${nome}`,
                titulo: `Nova mensagem ${protocolo(id)}`,
                paragrafos: [`De: ${nome} <${email}>`, `Assunto: ${assunto}`, mensagem, "Responda pelo painel do funcionário no app."],
                rodape: "Aviso automático do Fale conosco."
            });
        }

        return res.status(201).json({ msg: "Mensagem enviada! Responderemos em breve.", id, protocolo: protocolo(id) });
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao enviar mensagem", erro: error.message });
    }
}

export async function listarMinhasMensagens(req, res) {
    try {
        return res.status(200).json(await contatoModel.listarPorUsuario(req.usuario.id));
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao listar mensagens", erro: error.message });
    }
}

export async function listarTodasMensagens(req, res) {
    try {
        const { status } = req.query;
        if (status && !["aberta", "respondida", "fechada"].includes(status)) {
            return res.status(400).json({ msg: "Status inválido" });
        }
        return res.status(200).json(await contatoModel.listarTodas({ status }));
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao listar mensagens", erro: error.message });
    }
}

export async function responderMensagem(req, res) {
    try {
        const resposta = String(req.body.resposta || "").trim();
        if (resposta.length < 2) {
            return res.status(400).json({ msg: "Escreva a resposta" });
        }
        const mensagem = await contatoModel.buscarPorId(req.params.id_mensagem);
        if (!mensagem) {
            return res.status(404).json({ msg: "Mensagem não encontrada" });
        }

        await contatoModel.responder(mensagem.id_mensagem, { resposta, id_funcionario: req.usuario.id });

        const titulo = `Respondemos sua mensagem ${protocolo(mensagem.id_mensagem)}`;
        if (mensagem.id_usuario) {
            await notificarCliente(mensagem.id_usuario, {
                titulo,
                mensagem: resposta.length > 180 ? `${resposta.slice(0, 177)}...` : resposta,
                tipo: "contato",
                referencia_id: mensagem.id_mensagem
            });
        }
        await enviarEmail({
            para: mensagem.email,
            assunto: `Re: ${mensagem.assunto} ${protocolo(mensagem.id_mensagem)}`,
            titulo,
            paragrafos: [
                `Olá, ${String(mensagem.nome).split(" ")[0]}!`,
                resposta,
                `${req.usuario.nome || "Equipe"} | Happy Snouts`,
                `Sua mensagem original:\n${mensagem.mensagem}`
            ]
        });

        return res.status(200).json(await contatoModel.buscarPorId(mensagem.id_mensagem));
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao responder mensagem", erro: error.message });
    }
}

export async function mudarStatusMensagem(req, res) {
    try {
        const { status } = req.body;
        if (!["aberta", "respondida", "fechada"].includes(status)) {
            return res.status(400).json({ msg: "Status inválido" });
        }
        const ok = await contatoModel.mudarStatus(req.params.id_mensagem, status);
        if (!ok) return res.status(404).json({ msg: "Mensagem não encontrada" });
        return res.status(200).json(await contatoModel.buscarPorId(req.params.id_mensagem));
    } catch (error) {
        return res.status(500).json({ msg: "Erro ao atualizar mensagem", erro: error.message });
    }
}
