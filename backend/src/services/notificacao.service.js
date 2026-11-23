import * as notificacaoModel from "../models/notificacao.model.js";
import * as clientesModel from "../models/usuario.model.js";
import { enviarEmail } from "./email.service.js";

export async function notificarCliente(id_usuario, { titulo, mensagem, tipo, referencia_id, email }) {
    try {
        await notificacaoModel.criarNotificacao({ id_usuario, titulo, mensagem, tipo, referencia_id });
    } catch (error) {
        console.error("Falha ao gravar notificação:", error.message);
    }

    if (!email) return;
    try {
        const cliente = await clientesModel.buscarClientePorId(id_usuario);
        if (!cliente?.email) return;
        const primeiroNome = String(cliente.nome_completo || "").split(" ")[0];
        await enviarEmail({
            para: cliente.email,
            assunto: email.assunto || titulo,
            titulo: email.titulo || titulo,
            paragrafos: [primeiroNome ? `Olá, ${primeiroNome}!` : "Olá!", ...(email.paragrafos || [mensagem])],
            destaque: email.destaque
        });
    } catch (error) {
        console.error("Falha ao enviar e-mail de notificação:", error.message);
    }
}
