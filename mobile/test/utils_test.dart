import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:happysnouts/utils/formatters.dart';
import 'package:happysnouts/utils/input_masks.dart';
import 'package:happysnouts/utils/validators.dart';

void main() {
  group('Formatters', () {
    test('formata moeda no padrão brasileiro', () {
      expect(Formatters.currency(0), 'R\$ 0,00');
      expect(Formatters.currency(175), 'R\$ 175,00');
      expect(Formatters.currency(39.9), 'R\$ 39,90');
      expect(Formatters.currency(1234.5), 'R\$ 1.234,50');
      expect(Formatters.currency(1234567.891), 'R\$ 1.234.567,89');
      expect(Formatters.currency(-10), '-R\$ 10,00');
    });

    test('formata e interpreta datas dd/mm/aaaa', () {
      expect(Formatters.date(DateTime(2026, 9, 5)), '05/09/2026');
      expect(Formatters.parseDate('05/09/2026'), DateTime(2026, 9, 5));
      expect(Formatters.parseDate('31/02/2026'), isNull);
      expect(Formatters.parseDate('2026-09-05'), isNull);
    });

    test('calcula idade por extenso', () {
      final now = DateTime(2026, 10, 28);
      expect(Formatters.age(DateTime(2024, 7, 15), now: now), '2 anos e 3 meses');
      expect(Formatters.age(DateTime(2025, 10, 28), now: now), '1 ano');
      expect(Formatters.age(DateTime(2026, 6, 5), now: now), '4 meses');
      expect(Formatters.age(DateTime(2026, 10, 20), now: now), '8 dias');
    });

    test('formata peso', () {
      expect(Formatters.weight(7), '7 kg');
      expect(Formatters.weight(7.5), '7,5 kg');
    });
  });

  group('Validators', () {
    test('CPF', () {
      expect(Validators.isValidCpf('529.982.247-25'), isTrue);
      expect(Validators.isValidCpf('529.982.247-24'), isFalse);
      expect(Validators.isValidCpf('111.111.111-11'), isFalse);
      expect(Validators.cpf(''), 'Campo obrigatório');
    });

    test('e-mail', () {
      expect(Validators.email('pessoa@exemplo.com'), isNull);
      expect(Validators.email('pessoa@exemplo'), 'E-mail inválido. Confira se digitou certo');
      expect(Validators.email('  '), 'Campo obrigatório');
    });

    test('telefone, CEP e UF', () {
      expect(Validators.phone('(11) 9 8142-3765'), isNull);
      expect(Validators.phone('(11) 3842-1576'), isNull); // fixo
      expect(Validators.phone('(11) 9999-999'), 'Telefone inválido. Use DDD + número');
      expect(Validators.phone('(20) 98765-4321'), 'DDD inválido');
      expect(Validators.phone('(11) 9 9999-9999'), 'Telefone inválido'); // número repetido
      expect(Validators.phone('(11) 9 1234-5678'), 'Telefone inválido. Digite seu número de verdade'); // sequência
      expect(Validators.phone('(11) 8142-37650'), 'Celular deve começar com 9 depois do DDD');
      expect(Validators.cep('06233-120'), isNull);
      expect(Validators.cep('0623'), 'CEP inválido');
      expect(Validators.uf('sp'), isNull);
      expect(Validators.uf('XX'), 'UF inválida');
    });

    test('nome completo e senha', () {
      expect(Validators.name('Lays Cintra'), isNull);
      expect(Validators.name('Lays'), 'Informe nome e sobrenome');
      expect(Validators.password('12345'), isNotNull);
      expect(Validators.password('123456'), isNull);
    });

    test('data de nascimento não pode ser futura', () {
      expect(Validators.birthDate('01/12/2008'), isNull);
      expect(Validators.birthDate('01/01/2999'), 'A data não pode estar no futuro');
      expect(Validators.birthDate('32/01/2000'), 'Data inválida');
    });

    test('cartão (Luhn), validade e CVV', () {
      expect(Validators.cardNumber('4111 1111 1111 1111'), isNull);
      expect(Validators.cardNumber('4111 1111 1111 1112'), 'Número de cartão inválido');
      final now = DateTime(2026, 10, 28);
      expect(Validators.cardExpiry('10/26', now: now), isNull);
      expect(Validators.cardExpiry('09/26', now: now), 'Cartão vencido');
      expect(Validators.cardExpiry('13/30', now: now), 'Mês inválido');
      expect(Validators.cvv('12'), 'CVV inválido');
      expect(Validators.cvv('123'), isNull);
    });
  });

  group('Máscaras', () {
    String mask(TextInputFormatter formatter, String input) {
      return formatter.formatEditUpdate(TextEditingValue.empty, TextEditingValue(text: input)).text;
    }

    test('aplicam o formato esperado', () {
      expect(mask(InputMasks.cpf(), '52998224725'), '529.982.247-25');
      expect(mask(InputMasks.cep(), '06233120'), '06233-120');
      expect(mask(InputMasks.phone(), '11999999999'), '(11) 9 9999-9999');
      expect(mask(InputMasks.phone(), '1133334444'), '(11) 3333-4444');
      expect(mask(InputMasks.cardExpiry(), '1229'), '12/29');
      expect(mask(InputMasks.cpf(), '529982247251234'), '529.982.247-25');
    });
  });
}
