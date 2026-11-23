import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../app.js';
import { conexao } from '../config/db.js';
import * as recuperacaoModel from '../models/recuperacao.model.js';
import { criarFuncionarioTeste, removerClienteTeste, removerFuncionarioTeste, SENHA_TESTE } from './helpers.js';

describe('Testes da API de Autenticação', () => {
    let clienteId;
    let emailTeste;
    let funcionario;

    function dadosCliente() {
        return {
            nome_completo: 'Fulano de Tal',
            nome_usuario: `fulano_${Date.now()}`,
            email: emailTeste,
            cpf: String(Date.now()).slice(-11).padStart(11, '1'),
            telefone: '(11) 99182-7364',
            data_nascimento: '2000-05-10',
            senha: SENHA_TESTE
        };
    }

    beforeAll(async () => {
        emailTeste = `teste_${Date.now()}@gmail.com`;//para criar um email unico
        funcionario = await criarFuncionarioTeste();
    });

    afterAll(async () => {
        await conexao.query('DELETE FROM recuperacao_senha WHERE email = ?', [emailTeste]);
        await removerClienteTeste(clienteId);
        await removerFuncionarioTeste(funcionario.id);
    });

    test('POST /auth/cliente/registrar deve retornar 400 para dados incompletos', async () => {
        const response = await request(app)
            .post('/auth/cliente/registrar')
            .send({ nome_completo: 'Fulano' });

        expect(response.statusCode).toBe(400);
    });

    test('POST /auth/cliente/registrar deve retornar 400 para senha curta', async () => {
        const response = await request(app)
            .post('/auth/cliente/registrar')
            .send({ ...dadosCliente(), senha: '123' });

        expect(response.statusCode).toBe(400);
        expect(response.body.mensagem).toBe('A senha precisa ter pelo menos 6 caracteres');
    });

    test('POST /auth/cliente/registrar deve retornar 400 para telefone inválido', async () => {
        const response = await request(app)
            .post('/auth/cliente/registrar')
            .send({ ...dadosCliente(), telefone: '(11) 99999-9999' });

        expect(response.statusCode).toBe(400);
    });

    test('POST /auth/cliente/registrar deve retornar 400 para menor de 16 anos', async () => {
        const ano = new Date().getFullYear() - 10;
        const response = await request(app)
            .post('/auth/cliente/registrar')
            .send({ ...dadosCliente(), data_nascimento: `${ano}-01-01` });

        expect(response.statusCode).toBe(400);
    });

    test('POST /auth/cliente/registrar deve pedir o código de confirmação do e-mail', async () => {
        const response = await request(app)
            .post('/auth/cliente/registrar')
            .send(dadosCliente());

        expect(response.statusCode).toBe(400);
        expect(response.body.mensagem).toBe('Confirme seu e-mail com o código que enviamos.');
    });

    test('POST /auth/cliente/registrar deve retornar 400 com código errado', async () => {
        await recuperacaoModel.criarCodigo({
            email: emailTeste,
            tipo_usuario: 'cliente',
            codigo_hash: await bcrypt.hash('123456', 10),
            minutos: 15
        });

        const response = await request(app)
            .post('/auth/cliente/registrar')
            .send({ ...dadosCliente(), codigo_email: '000000' });

        expect(response.statusCode).toBe(400);
        expect(response.body.mensagem).toContain('Código incorreto');
    });

    test('POST /auth/cliente/registrar deve criar um novo cliente com o código certo', async () => {
        const response = await request(app)
            .post('/auth/cliente/registrar')
            .send({ ...dadosCliente(), codigo_email: '123456' });

        expect(response.statusCode).toBe(201);
        expect(response.body.mensagem).toBe('Cliente cadastrado com sucesso');
        expect(response.body).toHaveProperty('id');

        clienteId = response.body.id;
    });

    test('POST /auth/cliente/registrar deve retornar 400 para e-mail já cadastrado', async () => {
        const response = await request(app)
            .post('/auth/cliente/registrar')
            .send({ ...dadosCliente(), codigo_email: '123456' });

        expect(response.statusCode).toBe(400);
        expect(response.body.mensagem).toBe('Email já cadastrado');
    });

    test('POST /auth/login deve autenticar o cliente com sucesso', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({ email: emailTeste, senha: SENHA_TESTE });

        expect(response.statusCode).toBe(200);
        expect(response.body.tipo).toBe('cliente');
        expect(response.body).toHaveProperty('token');
    });

    test('POST /auth/login deve autenticar o funcionário com sucesso', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({ email: funcionario.email, senha: SENHA_TESTE });

        expect(response.statusCode).toBe(200);
        expect(response.body.tipo).toBe('funcionario');
        expect(response.body).toHaveProperty('token');
    });

    test('POST /auth/login deve retornar 401 para senha errada', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({ email: emailTeste, senha: 'senhaErrada' });

        expect(response.statusCode).toBe(401);
    });

    test('POST /auth/login deve retornar 404 para usuário inexistente', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({ email: 'naoexiste_999999@gmail.com', senha: SENHA_TESTE });

        expect(response.statusCode).toBe(404);
    });

    test('POST /auth/login deve retornar 400 sem e-mail e senha', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({});

        expect(response.statusCode).toBe(400);
    });

    test('POST /auth/cliente/login (rota antiga do site) deve autenticar', async () => {
        const response = await request(app)
            .post('/auth/cliente/login')
            .send({ email: emailTeste, senha: SENHA_TESTE });

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('token');
    });

    test('POST /auth/funcionario/registrar deve retornar 401 sem token', async () => {
        const response = await request(app)
            .post('/auth/funcionario/registrar')
            .send({ nome: 'Novo Func', email: `novo_${Date.now()}@gmail.com`, senha: SENHA_TESTE });

        expect(response.statusCode).toBe(401);
    });

    test('POST /auth/verificar-codigo deve retornar 400 sem código', async () => {
        const response = await request(app)
            .post('/auth/verificar-codigo')
            .send({ email: emailTeste });

        expect(response.statusCode).toBe(400);
    });

    test('POST /auth/redefinir-senha deve retornar 400 para senha nova curta', async () => {
        const response = await request(app)
            .post('/auth/redefinir-senha')
            .send({ email: emailTeste, codigo: '123456', nova_senha: '123' });

        expect(response.statusCode).toBe(400);
    });
});
