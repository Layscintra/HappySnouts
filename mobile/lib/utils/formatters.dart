class Formatters {
  Formatters._();

  /// 1234.5 -> "R$ 1.234,50"
  static String currency(double value) {
    final negative = value < 0;
    final cents = (value.abs() * 100).round();
    final integerPart = (cents ~/ 100).toString();
    final decimalPart = (cents % 100).toString().padLeft(2, '0');

    final buffer = StringBuffer();
    for (var i = 0; i < integerPart.length; i++) {
      final remaining = integerPart.length - i;
      buffer.write(integerPart[i]);
      if (remaining > 1 && remaining % 3 == 1) buffer.write('.');
    }
    return '${negative ? '-' : ''}R\$ $buffer,$decimalPart';
  }

  /// DateTime(2026, 9, 5) -> "05/09/2026"
  static String date(DateTime date) {
    return '${_two(date.day)}/${_two(date.month)}/${date.year}';
  }

  /// DateTime(2026, 9, 5, 8, 3) -> "05/09/2026 às 08:03"
  static String dateTime(DateTime date) {
    return '${Formatters.date(date)} às ${_two(date.hour)}:${_two(date.minute)}';
  }

  /// "05/09/2026" -> DateTime(2026, 9, 5). Retorna null se a data for inválida.
  static DateTime? parseDate(String text) {
    final match = RegExp(r'^(\d{2})/(\d{2})/(\d{4})$').firstMatch(text.trim());
    if (match == null) return null;
    final day = int.parse(match.group(1)!);
    final month = int.parse(match.group(2)!);
    final year = int.parse(match.group(3)!);
    final parsed = DateTime(year, month, day);
    // DateTime "corrige" datas como 31/02 para 03/03; aqui isso é inválido.
    if (parsed.day != day || parsed.month != month || parsed.year != year) return null;
    return parsed;
  }

  /// Idade por extenso a partir da data de nascimento: "2 anos e 3 meses".
  static String age(DateTime birthDate, {DateTime? now}) {
    final today = now ?? DateTime.now();
    var months = (today.year - birthDate.year) * 12 + today.month - birthDate.month;
    if (today.day < birthDate.day) months--;
    if (months < 0) return '';

    if (months == 0) {
      final days = today.difference(birthDate).inDays;
      return days == 1 ? '1 dia' : '$days dias';
    }

    final years = months ~/ 12;
    final restMonths = months % 12;
    final yearsText = years == 1 ? '1 ano' : '$years anos';
    final monthsText = restMonths == 1 ? '1 mês' : '$restMonths meses';
    if (years == 0) return monthsText;
    if (restMonths == 0) return yearsText;
    return '$yearsText e $monthsText';
  }

  /// 7.0 -> "7 kg", 7.5 -> "7,5 kg"
  static String weight(double kg) {
    final text = kg == kg.roundToDouble() ? kg.toStringAsFixed(0) : kg.toStringAsFixed(1);
    return '${text.replaceAll('.', ',')} kg';
  }

  static String onlyDigits(String text) => text.replaceAll(RegExp(r'\D'), '');

  /// "11999999999" -> "(11) 9 9999-9999" e "1133334444" -> "(11) 3333-4444".
  /// O backend guarda só os dígitos; outros formatos voltam como vieram.
  static String phone(String text) {
    final d = onlyDigits(text);
    if (d.length == 11) return '(${d.substring(0, 2)}) ${d[2]} ${d.substring(3, 7)}-${d.substring(7)}';
    if (d.length == 10) return '(${d.substring(0, 2)}) ${d.substring(2, 6)}-${d.substring(6)}';
    return text;
  }

  static String _two(int value) => value.toString().padLeft(2, '0');
}
