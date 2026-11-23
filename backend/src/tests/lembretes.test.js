import request from 'supertest';
import app from '../app.js';
import { criarClienteTeste, criarFuncionarioTeste, removerClienteTeste, removerFuncionarioTeste, auth } from './helpers.js';

describe('Testes da API de Lembretes (calendário de cuidados)', () => {
    let cliente;
    let funcionario;
    let petId;
    let lembreteId;

    const ano = new Date().getFullYear() + 1;

    beforeAll(async () => {
        cliente = await criarClienteTeste();
        funcionario = await criarFuncionarioTeste();

        const pet = await request(app)
            .post('/pets')
            .set(auth(cliente.token))
            .send({ nome_pet: 'Mel', raca: 'Poodle' });
        petId = pet.body.id;
    });

    afterAll(async () => {
        await removerClienteTeste(cliente.id);
        await removerFuncionarioTeste(funcionario.id);
    });

    test('GET /lembretes deve retornar 403 para funcionário', async () => {
        const response = await request(app)
            .get('/lembretes')
            .set(auth(funcionario.token));

        expect(response.statusCode).toBe(403);
    });

    test('POST /lembretes deve criar um novo lembrete', async () => {
        const novoLembrete = {
            id_pet: petId,
            titulo: 'Vacina antirrábica',
            tipo: 'vacina',
            cor: '#E57373',
            descricao: 'Levar a carteirinha',
            data_hora: `${ano}-03-15 10:30`
        };

        const response = await request(app)
            .post('/lembretes')
            .set(auth(cliente.token))
            .send(novoLembrete);

        expect(response.statusCode).toBe(201);
        expect(response.body.msg).toBe('Lembrete cadastrado com sucesso');

        lembreteId = response.body.id;
    });

    test('POST /lembretes deve retornar 400 para dados incompletos', async () => {
        const response = await request(app)
            .post('/lembretes')
            .set(auth(cliente.token))
            .send({ titulo: 'Sem pet' });

        expect(response.statusCode).toBe(400);
    });

    test('POST /lembretes deve retornar 400 para tipo inválido', async () => {
        const response = await request(app)
            .post('/lembretes')
            .set(auth(cliente.token))
            .send({ id_pet: petId, titulo: 'X', tipo: 'festa', data_hora: `${ano}-03-15 10:30` });

        expect(response.statusCode).toBe(400);
    });

    test('POST /lembretes deve retornar 400 para data_hora inválida', async () => {
        const response = await request(app)
            .post('/lembretes')
            .set(auth(cliente.token))
            .send({ id_pet: petId, titulo: 'X', tipo: 'banho', data_hora: '15/03/2030' });

        expect(response.statusCode).toBe(400);
    });

    test('POST /lembretes deve retornar 404 para pet que não é do cliente', async () => {
        const response = await request(app)
            .post('/lembretes')
            .set(auth(cliente.token))
            .send({ id_pet: 999999, titulo: 'X', tipo: 'banho', data_hora: `${ano}-03-15 10:30` });

        expect(response.statusCode).toBe(404);
    });

    test('GET /lembretes?mes= deve listar os lembretes do mês', async () => {
        const response = await request(app)
            .get(`/lembretes?mes=${ano}-03`)
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);
    });

    test('GET /lembretes?mes= deve retornar 400 para mês fora do formato', async () => {
        const response = await request(app)
            .get('/lembretes?mes=03-2030')
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(400);
    });

    test('GET /lembretes/proximos deve listar os próximos cuidados', async () => {
        const response = await request(app)
            .get('/lembretes/proximos')
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    test('GET /lembretes/:id deve buscar um lembrete por ID', async () => {
        const response = await request(app)
            .get(`/lembretes/${lembreteId}`)
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);
        expect(response.body.titulo).toBe('Vacina antirrábica');
    });

    test('GET /lembretes/:id deve retornar 404 para ID inexistente', async () => {
        const response = await request(app)
            .get('/lembretes/999999')
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(404);
    });

    test('PUT /lembretes/:id deve atualizar o lembrete', async () => {
        const response = await request(app)
            .put(`/lembretes/${lembreteId}`)
            .set(auth(cliente.token))
            .send({ titulo: 'Vacina V10', data_hora: `${ano}-03-20 09:00:00` });

        expect(response.statusCode).toBe(200);
        expect(response.body.msg).toBe('Lembrete atualizado');
    });

    test('PATCH /lembretes/:id/concluir deve concluir o lembrete', async () => {
        const response = await request(app)
            .patch(`/lembretes/${lembreteId}/concluir`)
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);
        expect(response.body.msg).toBe('Lembrete concluído');
    });

    test('DELETE /lembretes/:id deve remover o lembrete', async () => {
        const response = await request(app)
            .delete(`/lembretes/${lembreteId}`)
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(200);
        expect(response.body.msg).toBe('Lembrete removido');
    });

    test('DELETE /lembretes/:id deve retornar 404 para ID inexistente', async () => {
        const response = await request(app)
            .delete('/lembretes/999999')
            .set(auth(cliente.token));

        expect(response.statusCode).toBe(404);
    });
});
