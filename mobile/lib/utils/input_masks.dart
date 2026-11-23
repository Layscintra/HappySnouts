import 'package:flutter/services.dart';

/// Máscara simples para campos numéricos: cada "#" do padrão recebe um dígito
/// e os demais caracteres (pontos, traços, barras...) são inseridos sozinhos.
class MaskInputFormatter extends TextInputFormatter {
  final String pattern;

  MaskInputFormatter(this.pattern);

  int get _maxDigits => '#'.allMatches(pattern).length;

  String apply(String digits) {
    final buffer = StringBuffer();
    var digitIndex = 0;
    for (var i = 0; i < pattern.length && digitIndex < digits.length; i++) {
      if (pattern[i] == '#') {
        buffer.write(digits[digitIndex]);
        digitIndex++;
      } else {
        buffer.write(pattern[i]);
      }
    }
    return buffer.toString();
  }

  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    var digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    if (digits.length > _maxDigits) digits = digits.substring(0, _maxDigits);
    final text = apply(digits);
    return TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }
}

class PhoneInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    final pattern = digits.length > 10 ? '(##) # ####-####' : '(##) ####-####';
    return MaskInputFormatter(pattern).formatEditUpdate(oldValue, newValue);
  }
}

class InputMasks {
  InputMasks._();

  static TextInputFormatter cpf() => MaskInputFormatter('###.###.###-##');
  static TextInputFormatter cep() => MaskInputFormatter('#####-###');
  static TextInputFormatter date() => MaskInputFormatter('##/##/####');
  static TextInputFormatter cardNumber() => MaskInputFormatter('#### #### #### #######');
  static TextInputFormatter cardExpiry() => MaskInputFormatter('##/##');
  static TextInputFormatter phone() => PhoneInputFormatter();
}
