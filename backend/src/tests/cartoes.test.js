import request from 'supertest';
import app from '../app.js';
import { criarClienteTeste, removerClienteTeste, auth } from './helpers.js';

describe('Testes da API de Cartões', () => {
    let cliente;
    let cartao1Id;
    let cartao2Id;

    beforeAll(async () => {
        cliente = await criarClienteTeste();
    });

    afterAll(async () => {
        await removerClienteTeste(cliente.id);
    });

    test('POST /cartoes deve criar o primeiro cartão já como padrão', async () => {
        const response = await request(app)
            .post('/cartoes')
            .set(auth(cliente.token))
            .send({ icone: 'visa', destinatario: 'Cliente Teste', ultimos_digitos: '1234' });

        expect(response.statusCode).toBe(201);
        expect(response.body.msg).toBe('Cartão cadastrado com sucesso');

        cartao1Id = response.body.id;
    });

    test('POST /cartoes deve criar um segundo cartão', async () => {
        const response = await request(app)
            .post('/cartoes')
            .set(auth(cliente.token))
            .send({ icone: 'master', destinatario: 'Cliente Teste', ultimos_digitos: '5678' });

        expect(response.statusCode).toBe(201);

        cartao2Id = response.body.id;
    });

    test('POST /cartoes deve recusar número completo do cartão e CVV', async () => {
        const response = await request(app)
            .post('/cartoes')
            .set(auth(cliente.token))
            .send({ destinatario: 'Cliente', numero: '4111111111111111', cvv: '123', ultimos_digitos: '1111' });

        expect(response.statusCode).toBe(400);
    });

    test('POST /cartoes deve retornar 400 para ultimos_digitos inválido', async () => {
        const response = await request(app)
            .post('/cartoes')
            .set(auth(cliente.token))
            .send({ destinatario: 'Cliente', ultimos_digitos: '12a' });

        expect(response.statusCode).toBe(400);
        expect(response.body.msg).toBe('ultimos_digitos deve ter exatamente 4 números');
    });

    test('GET /cartoes deve listar os cartões, com só um padrão', async () => {
        const response = await request(app)
            .get('/cartoes')
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(2);
        expect(response.body.filter((c) => Boolean(c.padrao)).length).toBe(1);
    });

    test('PATCH /cartoes/:id/padrao deve trocar o cartão padrão', async () => {
        const response = await request(app)
            .patch(`/cartoes/${cartao2Id}/padrao`)
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);

        const cartao = await request(app)
            .get(`/cartoes/${cartao2Id}`)
            .set(auth(cliente.token));

        expect(Boolean(cartao.body.padrao)).toBe(true);
    });

    test('PUT /cartoes/:id deve atualizar o cartão', async () => {
        const response = await request(app)
            .put(`/cartoes/${cartao1Id}`)
            .set(auth(cliente.token))
            .send({ destinatario: 'Nome Atualizado' });

        expect(response.statusCode).toBe(200);
        expect(response.body.msg).toBe('Cartão atualizado');
    });

    test('GET /cartoes/:id deve retornar 404 para ID inexistente', async () => {
        const response = await request(app)
            .get('/cartoes/999999')
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(404);
    });

    test('DELETE /cartoes/:id deve remover o cartão padrão e passar o padrão para outro', async () => {
        const response = await request(app)
            .delete(`/cartoes/${cartao2Id}`)
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);

        const cartao = await request(app)
            .get(`/cartoes/${cartao1Id}`)
            .set(auth(cliente.token));

        expect(Boolean(cartao.body.padrao)).toBe(true);
    });

    test('DELETE /cartoes/:id deve retornar 404 para ID inexistente', async () => {
        const response = await request(app)
            .delete('/cartoes/999999')
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(404);
    });
});
