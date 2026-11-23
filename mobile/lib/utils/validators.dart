import 'package:happysnouts/utils/formatters.dart';

class Validators {
  Validators._();

  static String? required(String? value, {String message = 'Campo obrigatório'}) {
    if (value == null || value.trim().isEmpty) return message;
    return null;
  }

  static String? name(String? value) {
    final error = required(value);
    if (error != null) return error;
    if (value!.trim().split(RegExp(r'\s+')).length < 2) return 'Informe nome e sobrenome';
    return null;
  }

  static String? username(String? value) {
    final error = required(value);
    if (error != null) return error;
    if (!RegExp(r'^[a-zA-Z0-9._]{3,30}$').hasMatch(value!.trim())) {
      return 'Use de 3 a 30 letras, números, ponto ou _';
    }
    return null;
  }

  /// Erros comuns de digitação no domínio (mesma lista do site e do backend).
  static const Map<String, String> _emailTypos = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmal.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'gmail.co': 'gmail.com',
    'gmail.con': 'gmail.com',
    'gmail.cm': 'gmail.com',
    'gmail.om': 'gmail.com',
    'gmail.com.br': 'gmail.com',
    'gnail.com': 'gmail.com',
    'gmaill.com': 'gmail.com',
    'gmail.comm': 'gmail.com',
    'hotmial.com': 'hotmail.com',
    'hotmal.com': 'hotmail.com',
    'hotmai.com': 'hotmail.com',
    'hotmail.co': 'hotmail.com',
    'hotmail.con': 'hotmail.com',
    'hotmil.com': 'hotmail.com',
    'hotamil.com': 'hotmail.com',
    'homail.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'outloo.com': 'outlook.com',
    'outlook.co': 'outlook.com',
    'outlook.con': 'outlook.com',
    'yaho.com': 'yahoo.com',
    'yahoo.co': 'yahoo.com',
    'yahoo.con': 'yahoo.com',
    'yahoo.com.b': 'yahoo.com.br',
    'icloud.co': 'icloud.com',
    'iclod.com': 'icloud.com',
    'uol.com': 'uol.com.br',
    'bol.com': 'bol.com.br',
  };

  static const Set<String> _emailBlocked = {
    'mailinator.com',
    'yopmail.com',
    '10minutemail.com',
    'guerrillamail.com',
    'guerrillamail.net',
    'sharklasers.com',
    'temp-mail.org',
    'tempmail.com',
    'tempmail.net',
    'tempail.com',
    'tmpmail.org',
    'trashmail.com',
    'getnada.com',
    'dispostable.com',
    'maildrop.cc',
    'throwawaymail.com',
    'emailondeck.com',
    'mohmal.com',
    'fakeinbox.com',
    'mailnesia.com',
    '1secmail.com',
    'minuteinbox.com',
    'mintemail.com',
    'spamgourmet.com',
    'burnermail.io',
    'example.com',
    'example.org',
    'example.net',
    'test.com',
    'teste.com',
    'teste.com.br',
    'email.com.br',
  };

  static final _emailFormat = RegExp(
    r'^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9_%+-])?@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$',
  );

  /// Login e "esqueci a senha": só o formato básico, para não barrar quem
  /// já tem conta com um e-mail que hoje não seria aceito no cadastro.
  static String? loginEmail(String? value) {
    final error = required(value);
    if (error != null) return error;
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(value!.trim())) return 'E-mail inválido';
    return null;
  }

  /// E-mail de verdade: formato, erro de digitação e e-mail temporário.
  /// O backend ainda confere se o domínio recebe e-mail.
  static String? email(String? value) {
    final error = required(value);
    if (error != null) return error;
    final email = value!.trim().toLowerCase();
    if (!_emailFormat.hasMatch(email) || email.contains('..')) return 'E-mail inválido. Confira se digitou certo';
    final domain = email.split('@')[1];
    final typo = _emailTypos[domain];
    if (typo != null) return 'Confira o e-mail. Você quis dizer @$typo?';
    if (_emailBlocked.contains(domain)) return 'Use um e-mail pessoal de verdade (temporários não são aceitos)';
    return null;
  }

  static String? password(String? value) {
    final error = required(value);
    if (error != null) return error;
    if (value!.length < 6) return 'A senha deve ter pelo menos 6 caracteres';
    return null;
  }

  static String? cpf(String? value) {
    final error = required(value);
    if (error != null) return error;
    return isValidCpf(value!) ? null : 'CPF inválido';
  }

  static bool isValidCpf(String value) {
    final digits = Formatters.onlyDigits(value);
    if (digits.length != 11) return false;
    if (RegExp(r'^(\d)\1{10}$').hasMatch(digits)) return false;

    int checkDigit(int length) {
      var sum = 0;
      for (var i = 0; i < length; i++) {
        sum += int.parse(digits[i]) * (length + 1 - i);
      }
      final rest = (sum * 10) % 11;
      return rest == 10 ? 0 : rest;
    }

    return checkDigit(9) == int.parse(digits[9]) && checkDigit(10) == int.parse(digits[10]);
  }

  /// DDDs que existem no Brasil (mesma lista do site e do backend).
  static const Set<int> _ddds = {
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    21,
    22,
    24,
    27,
    28,
    31,
    32,
    33,
    34,
    35,
    37,
    38,
    41,
    42,
    43,
    44,
    45,
    46,
    47,
    48,
    49,
    51,
    53,
    54,
    55,
    61,
    62,
    63,
    64,
    65,
    66,
    67,
    68,
    69,
    71,
    73,
    74,
    75,
    77,
    79,
    81,
    82,
    83,
    84,
    85,
    86,
    87,
    88,
    89,
    91,
    92,
    93,
    94,
    95,
    96,
    97,
    98,
    99,
  };

  /// Telefone brasileiro: DDD que existe, celular com 9 na frente (11 dígitos)
  /// ou fixo começando com 2 a 5 (10 dígitos). Recusa número todo repetido.
  static String? phone(String? value) {
    final error = required(value);
    if (error != null) return error;
    var digits = Formatters.onlyDigits(value!);
    if (digits.length > 11 && digits.startsWith('55')) digits = digits.substring(2);
    if (digits.length != 10 && digits.length != 11) return 'Telefone inválido. Use DDD + número';
    if (!_ddds.contains(int.parse(digits.substring(0, 2)))) return 'DDD inválido';
    final numero = digits.substring(2);
    if (RegExp(r'^(\d)\1+$').hasMatch(numero)) return 'Telefone inválido';
    if (_fakeNumber(numero)) return 'Telefone inválido. Digite seu número de verdade';
    if (digits.length == 11 && numero[0] != '9') return 'Celular deve começar com 9 depois do DDD';
    if (digits.length == 10 && !'2345'.contains(numero[0])) return 'Telefone fixo inválido';
    return null;
  }

  /// Os 8 últimos em sequência (1234-5678, 8765-4321) ou dois dígitos se
  /// repetindo (1212-1212). Mesma regra do site e do backend.
  static bool _fakeNumber(String numero) {
    final end = numero.substring(numero.length - 8);
    final steps = [for (var i = 1; i < end.length; i++) (int.parse(end[i]) - int.parse(end[i - 1]) + 10) % 10];
    if (steps.every((s) => s == 1) || steps.every((s) => s == 9)) return true;
    return RegExp(r'^(\d\d)\1{3}$').hasMatch(end);
  }

  static String? cep(String? value) {
    final error = required(value);
    if (error != null) return error;
    if (Formatters.onlyDigits(value!).length != 8) return 'CEP inválido';
    return null;
  }

  static const _ufs = {
    'AC',
    'AL',
    'AP',
    'AM',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MT',
    'MS',
    'MG',
    'PA',
    'PB',
    'PR',
    'PE',
    'PI',
    'RJ',
    'RN',
    'RS',
    'RO',
    'RR',
    'SC',
    'SP',
    'SE',
    'TO',
  };

  static String? uf(String? value) {
    final error = required(value);
    if (error != null) return error;
    if (!_ufs.contains(value!.trim().toUpperCase())) return 'UF inválida';
    return null;
  }

  static String? pastDate(String? value) {
    final error = required(value);
    if (error != null) return error;
    final date = Formatters.parseDate(value!);
    if (date == null) return 'Data inválida';
    if (date.isAfter(DateTime.now())) return 'A data não pode estar no futuro';
    return null;
  }

  /// Idade mínima para ter conta (o backend confere de novo).
  static const int idadeMinima = 16;

  /// Data mais recente permitida: quem nasceu depois disso tem menos de 16 anos.
  static DateTime dataLimiteNascimento() {
    final hoje = DateTime.now();
    return DateTime(hoje.year - idadeMinima, hoje.month, hoje.day);
  }

  static String? birthDate(String? value) {
    final error = pastDate(value);
    if (error != null) return error;
    final date = Formatters.parseDate(value!)!;
    if (date.year < 1900) return 'Data inválida';
    if (date.isAfter(dataLimiteNascimento())) {
      return 'É preciso ter pelo menos $idadeMinima anos';
    }
    return null;
  }

  static String? optionalPositiveNumber(String? value) {
    if (value == null || value.trim().isEmpty) return null;
    final number = double.tryParse(value.trim().replaceAll(',', '.'));
    if (number == null || number <= 0) return 'Número inválido';
    return null;
  }

  static String? cardNumber(String? value) {
    final error = required(value);
    if (error != null) return error;
    final digits = Formatters.onlyDigits(value!);
    if (digits.length < 13 || digits.length > 19 || !_passesLuhn(digits)) {
      return 'Número de cartão inválido';
    }
    return null;
  }

  static bool _passesLuhn(String digits) {
    var sum = 0;
    var doubleIt = false;
    for (var i = digits.length - 1; i >= 0; i--) {
      var digit = int.parse(digits[i]);
      if (doubleIt) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      doubleIt = !doubleIt;
    }
    return sum % 10 == 0;
  }

  static String? cardExpiry(String? value, {DateTime? now}) {
    final error = required(value);
    if (error != null) return error;
    final match = RegExp(r'^(\d{2})/(\d{2})$').firstMatch(value!.trim());
    if (match == null) return 'Use o formato MM/AA';
    final month = int.parse(match.group(1)!);
    final year = 2000 + int.parse(match.group(2)!);
    if (month < 1 || month > 12) return 'Mês inválido';
    final today = now ?? DateTime.now();
    // O cartão vale até o último dia do mês de validade.
    if (DateTime(year, month + 1).isBefore(DateTime(today.year, today.month, today.day))) {
      return 'Cartão vencido';
    }
    return null;
  }

  static String? cvv(String? value) {
    final error = required(value);
    if (error != null) return error;
    final digits = Formatters.onlyDigits(value!);
    if (digits.length < 3 || digits.length > 4) return 'CVV inválido';
    return null;
  }
}
