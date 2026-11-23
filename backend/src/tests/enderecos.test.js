import request from 'supertest';
import app from '../app.js';
import { criarClienteTeste, removerClienteTeste, auth } from './helpers.js';

describe('Testes da API de Endereços', () => {
    let cliente;
    let enderecoId;

    const novoEndereco = {
        cep: '01310-100',
        estado: 'SP',
        cidade: 'São Paulo',
        bairro: 'Bela Vista',
        endereco: 'Avenida Paulista',
        numero: '1000',
        apelido: 'Casa'
    };

    beforeAll(async () => {
        cliente = await criarClienteTeste();
    });

    afterAll(async () => {
        await removerClienteTeste(cliente.id);
    });

    test('POST /endereco deve retornar 401 sem token', async () => {
        const response = await request(app)
            .post('/endereco')
            .send(novoEndereco);

        expect(response.statusCode).toBe(401);
    });

    test('POST /endereco deve criar um novo endereço', async () => {
        const response = await request(app)
            .post('/endereco')
            .set(auth(cliente.token))
            .send(novoEndereco);

        expect(response.statusCode).toBe(201);
        expect(response.body.msg).toBe('Endereço cadastrado com sucesso');

        enderecoId = response.body.id;
    });

    test('POST /endereco deve retornar 400 para dados incompletos', async () => {
        const response = await request(app)
            .post('/endereco')
            .set(auth(cliente.token))
            .send({ cep: '01310-100' });

        expect(response.statusCode).toBe(400);
    });

    test('GET /endereco/usuario/:id deve listar os endereços do cliente', async () => {
        const response = await request(app)
            .get(`/endereco/usuario/${cliente.id}`)
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);
    });

    test('GET /endereco/usuario/:id/total deve contar os endereços', async () => {
        const response = await request(app)
            .get(`/endereco/usuario/${cliente.id}/total`)
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);
        expect(Number(response.body.total)).toBe(1);
    });

    test('GET /endereco/:id deve buscar um endereço por ID', async () => {
        const response = await request(app)
            .get(`/endereco/${enderecoId}`)
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);
        expect(response.body.bairro).toBe('Bela Vista');
    });

    test('GET /endereco/:id deve retornar 404 para ID inexistente', async () => {
        const response = await request(app)
            .get('/endereco/999999')
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(404);
    });

    test('PUT /endereco/:id deve atualizar um endereço existente', async () => {
        const response = await request(app)
            .put(`/endereco/${enderecoId}`)
            .set(auth(cliente.token))
            .send({ ...novoEndereco, numero: '2000', apelido: 'Trabalho' });

        expect(response.statusCode).toBe(200);
        expect(response.body.msg).toBe('Endereço atualizado');
    });

    test('PATCH /endereco/:id/padrao deve definir o endereço padrão', async () => {
        const response = await request(app)
            .patch(`/endereco/${enderecoId}/padrao`)
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);
        expect(response.body.msg).toBe('Endereço definido como padrão');
    });

    test('DELETE /endereco/:id deve remover o endereço', async () => {
        const response = await request(app)
            .delete(`/endereco/${enderecoId}`)
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);
        expect(response.body.msg).toBe('Endereço removido');
    });

    test('DELETE /endereco/:id deve retornar 404 para ID inexistente', async () => {
        const response = await request(app)
            .delete('/endereco/999999')
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(404);
    });
});
