import request from 'supertest';
import app from '../app.js';
import { criarClienteTeste, criarFuncionarioTeste, removerClienteTeste, removerFuncionarioTeste, auth, SENHA_TESTE } from './helpers.js';

describe('Testes da API de Clientes', () => {
    let cliente;
    let funcionario;

    beforeAll(async () => {
        cliente = await criarClienteTeste();
        funcionario = await criarFuncionarioTeste();
    });

    afterAll(async () => {
        await removerClienteTeste(cliente.id);
        await removerFuncionarioTeste(funcionario.id);
    });

    test('GET /cliente/:id deve retornar 401 sem token', async () => {
        const response = await request(app).get(`/cliente/${cliente.id}`);

        expect(response.statusCode).toBe(401);
    });

    test('GET /cliente/:id deve buscar o próprio cliente', async () => {
        const response = await request(app)
            .get(`/cliente/${cliente.id}`)
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('Id_usuario', cliente.id);
        expect(response.body).not.toHaveProperty('senha_hash');
    });

    test('GET /cliente/:id deve retornar 403 ao acessar a conta de outro cliente', async () => {
        const response = await request(app)
            .get(`/cliente/${cliente.id + 1}`)
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(403);
    });

    test('GET /cliente deve retornar 403 para cliente (só funcionário lista)', async () => {
        const response = await request(app)
            .get('/cliente')
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(403);
    });

    test('GET /cliente deve listar os clientes para funcionário', async () => {
        const response = await request(app)
            .get('/cliente')
            .set(auth(funcionario.token));

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test('GET /cliente/:id deve retornar 404 para ID inexistente', async () => {
        const response = await request(app)
            .get('/cliente/999999')
            .set(auth(funcionario.token));

        expect(response.statusCode).toBe(404);
    });

    test('PUT /cliente/:id deve atualizar o cliente', async () => {
        const response = await request(app)
            .put(`/cliente/${cliente.id}`)
            .set(auth(cliente.token))
            .send({ nome_completo: 'Cliente Atualizado' });

        expect(response.statusCode).toBe(200);
        expect(response.body.msg).toBe('Cliente atualizado');
    });

    test('PUT /cliente/:id deve retornar 400 para telefone inválido', async () => {
        const response = await request(app)
            .put(`/cliente/${cliente.id}`)
            .set(auth(cliente.token))
            .send({ telefone: '123' });

        expect(response.statusCode).toBe(400);
    });

    test('PUT /cliente/:id deve retornar 400 sem nenhum campo válido', async () => {
        const response = await request(app)
            .put(`/cliente/${cliente.id}`)
            .set(auth(cliente.token))
            .send({ campo_que_nao_existe: 'x' });

        expect(response.statusCode).toBe(400);
        expect(response.body.msg).toBe('Nenhum campo válido para atualizar');
    });

    test('PUT /cliente/:id/senha deve retornar 401 com a senha atual errada', async () => {
        const response = await request(app)
            .put(`/cliente/${cliente.id}/senha`)
            .set(auth(cliente.token))
            .send({ senha_atual: 'errada', nova_senha: 'novaSenha123' });

        expect(response.statusCode).toBe(401);
    });

    test('PUT /cliente/:id/senha deve atualizar a senha', async () => {
        const response = await request(app)
            .put(`/cliente/${cliente.id}/senha`)
            .set(auth(cliente.token))
            .send({ senha_atual: SENHA_TESTE, nova_senha: 'novaSenha123' });

        expect(response.statusCode).toBe(200);
        expect(response.body.msg).toBe('Senha atualizada');
    });

    test('POST /auth/login deve funcionar com a senha nova', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({ email: cliente.email, senha: 'novaSenha123' });

        expect(response.statusCode).toBe(200);
    });

    test('DELETE /cliente/:id deve remover o cliente', async () => {
        const response = await request(app)
            .delete(`/cliente/${cliente.id}`)
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);
        expect(response.body.msg).toBe('Cliente removido');
    });

    test('DELETE /cliente/:id deve retornar 404 para ID inexistente', async () => {
        const response = await request(app)
            .delete('/cliente/999999')
            .set(auth(funcionario.token));

        expect(response.statusCode).toBe(404);
    });
});
