import request from 'supertest';
import app from '../app.js';
import { criarClienteTeste, removerClienteTeste, auth } from './helpers.js';

describe('Testes da API de Pets', () => {
    let cliente;
    let outroCliente;
    let petId;
    let pesoId;

    beforeAll(async () => {
        cliente = await criarClienteTeste();
        outroCliente = await criarClienteTeste();
    });

    afterAll(async () => {
        await removerClienteTeste(cliente.id);
        await removerClienteTeste(outroCliente.id);
    });

    test('GET /pets deve retornar 401 sem token', async () => {
        const response = await request(app).get('/pets');

        expect(response.statusCode).toBe(401);
    });

    test('POST /pets deve criar um novo pet', async () => {
        const novoPet = {
            nome_pet: 'Rex',
            raca: 'Vira-lata',
            idade_pet: 3,
            peso_atual: 12.5
        };

        const response = await request(app)
            .post('/pets')
            .set(auth(cliente.token))
            .send(novoPet);

        expect(response.statusCode).toBe(201);
        expect(response.body.msg).toBe('Pet cadastrado com sucesso');
        expect(response.body).toHaveProperty('id');

        petId = response.body.id;
    });

    test('POST /pets deve retornar 400 para dados incompletos', async () => {
        const response = await request(app)
            .post('/pets')
            .set(auth(cliente.token))
            .send({ nome_pet: 'Sem Raça' });

        expect(response.statusCode).toBe(400);
    });

    test('GET /pets deve listar os pets do cliente', async () => {
        const response = await request(app)
            .get('/pets')
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);
    });

    test('GET /pets/:id deve buscar um pet por ID', async () => {
        const response = await request(app)
            .get(`/pets/${petId}`)
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);
        expect(response.body.nome_pet).toBe('Rex');
    });

    test('GET /pets/:id deve retornar 404 para pet de outro cliente', async () => {
        const response = await request(app)
            .get(`/pets/${petId}`)
            .set(auth(outroCliente.token));

        expect(response.statusCode).toBe(404);
    });

    test('GET /pets/:id deve retornar 404 para ID inexistente', async () => {
        const response = await request(app)
            .get('/pets/999999')
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(404);
    });

    test('PUT /pets/:id deve atualizar um pet existente', async () => {
        const response = await request(app)
            .put(`/pets/${petId}`)
            .set(auth(cliente.token))
            .send({ nome_pet: 'Rex Atualizado', raca: 'Labrador' });

        expect(response.statusCode).toBe(200);
        expect(response.body.msg).toBe('Pet atualizado');
    });

    test('PUT /pets/:id deve retornar 404 para ID inexistente', async () => {
        const response = await request(app)
            .put('/pets/999999')
            .set(auth(cliente.token))
            .send({ nome_pet: 'Nada', raca: 'Nada' });

        expect(response.statusCode).toBe(404);
    });

    test('POST /pets/:id/pesos deve registrar uma pesagem', async () => {
        const response = await request(app)
            .post(`/pets/${petId}/pesos`)
            .set(auth(cliente.token))
            .send({ peso: 13.2 });

        expect(response.statusCode).toBe(201);
        expect(response.body.msg).toBe('Pesagem registrada');

        pesoId = response.body.id;
    });

    test('POST /pets/:id/pesos deve retornar 400 para peso inválido', async () => {
        const response = await request(app)
            .post(`/pets/${petId}/pesos`)
            .set(auth(cliente.token))
            .send({ peso: -5 });

        expect(response.statusCode).toBe(400);
    });

    test('POST /pets/:id/pesos deve retornar 400 para data no futuro', async () => {
        const ano = new Date().getFullYear() + 1;
        const response = await request(app)
            .post(`/pets/${petId}/pesos`)
            .set(auth(cliente.token))
            .send({ peso: 10, data_registro: `${ano}-01-01` });

        expect(response.statusCode).toBe(400);
    });

    test('GET /pets/:id/pesos deve listar o histórico de peso', async () => {
        const response = await request(app)
            .get(`/pets/${petId}/pesos`)
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
    });

    test('DELETE /pets/:id/pesos/:id_peso deve remover a pesagem', async () => {
        const response = await request(app)
            .delete(`/pets/${petId}/pesos/${pesoId}`)
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);
        expect(response.body.msg).toBe('Pesagem removida');
    });

    test('DELETE /pets/:id deve remover o pet', async () => {
        const response = await request(app)
            .delete(`/pets/${petId}`)
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);
        expect(response.body.msg).toBe('Pet removido');
    });

    test('DELETE /pets/:id deve retornar 404 para ID inexistente', async () => {
        const response = await request(app)
            .delete('/pets/999999')
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(404);
    });
});
