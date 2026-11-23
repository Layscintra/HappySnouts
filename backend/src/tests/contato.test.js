import request from 'supertest';
import app from '../app.js';
import { conexao } from '../config/db.js';
import { criarClienteTeste, criarFuncionarioTeste, removerClienteTeste, removerFuncionarioTeste, auth } from './helpers.js';

describe('Testes da API de Fale Conosco', () => {
    let cliente;
    let funcionario;
    let mensagemId;

    beforeAll(async () => {
        cliente = await criarClienteTeste();
        funcionario = await criarFuncionarioTeste();
    });

    afterAll(async () => {
        await conexao.query('DELETE FROM mensagens_contato WHERE id_mensagem = ?', [mensagemId]);
        await conexao.query('DELETE FROM notificacoes WHERE id_usuario = ?', [cliente.id]);
        await removerClienteTeste(cliente.id);
        await removerFuncionarioTeste(funcionario.id);
    });

    test('POST /contato deve enviar uma mensagem do cliente logado', async () => {
        const response = await request(app)
            .post('/contato')
            .set(auth(cliente.token))
            .send({ assunto: 'Dúvida', mensagem: 'Como cadastro a coleira do meu pet?' });

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('protocolo');

        mensagemId = response.body.id;
    });

    test('POST /contato deve retornar 400 para assunto inválido', async () => {
        const response = await request(app)
            .post('/contato')
            .send({ nome: 'Visitante', email: 'visitante@gmail.com', assunto: 'Qualquer', mensagem: 'Mensagem de teste aqui' });

        expect(response.statusCode).toBe(400);
    });

    test('POST /contato deve retornar 400 para mensagem curta', async () => {
        const response = await request(app)
            .post('/contato')
            .send({ nome: 'Visitante', email: 'visitante@gmail.com', assunto: 'Dúvida', mensagem: 'oi' });

        expect(response.statusCode).toBe(400);
    });

    test('GET /contato/minhas deve listar as mensagens do cliente', async () => {
        const response = await request(app)
            .get('/contato/minhas')
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(1);
    });

    test('GET /contato/admin/todas deve retornar 403 para cliente', async () => {
        const response = await request(app)
            .get('/contato/admin/todas')
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(403);
    });

    test('PATCH /contato/:id/responder deve responder a mensagem', async () => {
        const response = await request(app)
            .patch(`/contato/${mensagemId}/responder`)
            .set(auth(funcionario.token))
            .send({ resposta: 'É só abrir Dispositivos no app e tocar em Conectar.' });

        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('respondida');
    });

    test('GET /notificacoes deve mostrar a notificação da resposta para o cliente', async () => {
        const response = await request(app)
            .get('/notificacoes')
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);
        expect(response.body.notificacoes.length).toBeGreaterThan(0);
    });

    test('PATCH /contato/:id/status deve retornar 400 para status inválido', async () => {
        const response = await request(app)
            .patch(`/contato/${mensagemId}/status`)
            .set(auth(funcionario.token))
            .send({ status: 'perdida' });

        expect(response.statusCode).toBe(400);
    });

    test('PATCH /contato/:id/status deve fechar a mensagem', async () => {
        const response = await request(app)
            .patch(`/contato/${mensagemId}/status`)
            .set(auth(funcionario.token))
            .send({ status: 'fechada' });

        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('fechada');
    });

    test('PATCH /contato/:id/status deve retornar 404 para ID inexistente', async () => {
        const response = await request(app)
            .patch('/contato/999999/status')
            .set(auth(funcionario.token))
            .send({ status: 'fechada' });

        expect(response.statusCode).toBe(404);
    });
});
