import { erroTelefone, digitosTelefone } from "../services/telefone.service.js";
import { erroDataNascimento, IDADE_MINIMA } from "../services/idade.service.js";
import { erroFormatoEmail } from "../services/emailValido.service.js";
import { gerarPixCopiaECola } from "../services/pix.service.js";
import { emailConfigurado } from "../services/email.service.js";

describe('Testes do serviço de telefone', () => {

    test('digitosTelefone deve tirar a máscara e o +55', () => {
        expect(digitosTelefone('(11) 99182-7364')).toBe('11991827364');
        expect(digitosTelefone('+55 11 99182-7364')).toBe('11991827364');
    });

    test('erroTelefone deve aceitar celular e fixo válidos', () => {
        expect(erroTelefone('(11) 99182-7364')).toBeNull();
        expect(erroTelefone('(21) 3456-7290')).toBeNull();
    });

    test('erroTelefone deve recusar telefone com tamanho errado', () => {
        expect(erroTelefone('1199999')).toBe('Telefone inválido. Use DDD + número.');
    });

    test('erroTelefone deve recusar DDD que não existe', () => {
        expect(erroTelefone('(20) 99182-7364')).toBe('DDD inválido.');
    });

    test('erroTelefone deve recusar número repetido ou em sequência', () => {
        expect(erroTelefone('(11) 99999-9999')).toBe('Telefone inválido.');
        expect(erroTelefone('(11) 91234-5678')).toBe('Telefone inválido. Digite seu número de verdade.');
    });

    test('erroTelefone deve recusar celular que não começa com 9', () => {
        expect(erroTelefone('(11) 89182-7364')).toBe('Celular deve começar com 9 depois do DDD.');
    });
});

describe('Testes do serviço de idade', () => {

    test('erroDataNascimento deve aceitar uma pessoa adulta', () => {
        expect(erroDataNascimento('2000-05-10')).toBeNull();
    });

    test('erroDataNascimento deve recusar formato errado', () => {
        expect(erroDataNascimento('10/05/2000')).toBe('Data de nascimento inválida. Use o formato AAAA-MM-DD.');
    });

    test('erroDataNascimento deve recusar data que não existe', () => {
        expect(erroDataNascimento('2000-02-31')).toBe('Data de nascimento inválida.');
    });

    test('erroDataNascimento deve recusar data no futuro', () => {
        const ano = new Date().getFullYear() + 1;
        expect(erroDataNascimento(`${ano}-01-01`)).toBe('A data de nascimento não pode ser no futuro.');
    });

    test(`erroDataNascimento deve recusar quem tem menos de ${IDADE_MINIMA} anos`, () => {
        const ano = new Date().getFullYear() - 10;
        expect(erroDataNascimento(`${ano}-01-01`)).toBe(`É preciso ter pelo menos ${IDADE_MINIMA} anos para ter uma conta.`);
    });
});

describe('Testes do serviço de e-mail', () => {

    test('erroFormatoEmail deve aceitar e-mail válido', () => {
        expect(erroFormatoEmail('fulano@gmail.com')).toBeNull();
    });

    test('erroFormatoEmail deve recusar e-mail vazio ou mal formatado', () => {
        expect(erroFormatoEmail('')).toBe('Digite o e-mail.');
        expect(erroFormatoEmail('fulano@')).toBe('E-mail inválido. Confira se digitou certo.');
        expect(erroFormatoEmail('fulano..silva@gmail.com')).toBe('E-mail inválido. Confira se digitou certo.');
    });

    test('erroFormatoEmail deve sugerir o domínio certo quando tem erro de digitação', () => {
        expect(erroFormatoEmail('fulano@gmial.com')).toBe('Confira o e-mail. Você quis dizer @gmail.com?');
    });

    test('erroFormatoEmail deve recusar e-mail temporário', () => {
        expect(erroFormatoEmail('fulano@mailinator.com')).toBe('Use um e-mail pessoal de verdade (e-mails temporários não são aceitos).');
    });

    test('nos testes o envio de e-mail de verdade deve estar desligado', () => {
        expect(emailConfigurado).toBe(false);
    });
});

describe('Testes do serviço de Pix', () => {

    test('gerarPixCopiaECola deve gerar o código com valor e número do pedido', () => {
        const codigo = gerarPixCopiaECola({ valor: 59.9, id_pedido: 42 });

        expect(codigo.startsWith('000201')).toBe(true);
        expect(codigo).toContain('br.gov.bcb.pix');
        expect(codigo).toContain('540559.90');
        expect(codigo).toContain('PEDIDO00042');
        expect(codigo).toMatch(/6304[0-9A-F]{4}$/);
    });

    test('gerarPixCopiaECola deve gerar códigos diferentes para pedidos diferentes', () => {
        const pix1 = gerarPixCopiaECola({ valor: 10, id_pedido: 1 });
        const pix2 = gerarPixCopiaECola({ valor: 10, id_pedido: 2 });

        expect(pix1).not.toBe(pix2);
    });
});
