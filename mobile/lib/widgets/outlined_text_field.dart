import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:happysnouts/theme/app_theme.dart';

/// Campo padrão dos formulários (login, cadastro, endereço, pets...).
/// O visual (borda, cores, cantos) vem do tema (AppTheme.inputDecorationTheme).
class OutlinedTextField extends StatefulWidget {
  final TextEditingController controller;
  final String hint;
  final String? label;
  final bool obscureText;
  final TextInputType keyboardType;
  final IconData? suffixIcon;
  final IconData? prefixIcon;
  final bool readOnly;
  final VoidCallback? onTap;
  final String? Function(String?)? validator;
  final List<TextInputFormatter>? inputFormatters;
  final TextInputAction? textInputAction;
  final TextCapitalization textCapitalization;
  final int maxLines;
  final int? maxLength;
  final Iterable<String>? autofillHints;
  final ValueChanged<String>? onSubmitted;
  final ValueChanged<String>? onChanged;
  final bool autofocus;

  const OutlinedTextField({
    super.key,
    required this.controller,
    required this.hint,
    this.label,
    this.obscureText = false,
    this.keyboardType = TextInputType.text,
    this.suffixIcon,
    this.prefixIcon,
    this.readOnly = false,
    this.onTap,
    this.validator,
    this.inputFormatters,
    this.textInputAction = TextInputAction.next,
    this.textCapitalization = TextCapitalization.none,
    this.maxLines = 1,
    this.maxLength,
    this.autofillHints,
    this.onSubmitted,
    this.onChanged,
    this.autofocus = false,
  });

  @override
  State<OutlinedTextField> createState() => _OutlinedTextFieldState();
}

class _OutlinedTextFieldState extends State<OutlinedTextField> {
  late bool _hidden = widget.obscureText;

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    Widget? suffix;
    if (widget.obscureText) {
      suffix = IconButton(
        tooltip: _hidden ? 'Mostrar senha' : 'Ocultar senha',
        onPressed: () => setState(() => _hidden = !_hidden),
        icon: Icon(_hidden ? Icons.visibility_outlined : Icons.visibility_off_outlined, size: 20),
      );
    } else if (widget.suffixIcon != null) {
      suffix = Icon(widget.suffixIcon, size: 20);
    }

    return TextFormField(
      controller: widget.controller,
      obscureText: _hidden,
      keyboardType: widget.maxLines > 1 ? TextInputType.multiline : widget.keyboardType,
      readOnly: widget.readOnly,
      onTap: widget.onTap,
      validator: widget.validator,
      inputFormatters: widget.inputFormatters,
      textInputAction: widget.maxLines > 1 ? TextInputAction.newline : widget.textInputAction,
      textCapitalization: widget.textCapitalization,
      maxLines: widget.obscureText ? 1 : widget.maxLines,
      maxLength: widget.maxLength,
      autofillHints: widget.autofillHints,
      onFieldSubmitted: widget.onSubmitted,
      onChanged: widget.onChanged,
      autofocus: widget.autofocus,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      style: TextStyle(fontSize: 15, color: palette.text),
      decoration: InputDecoration(
        labelText: widget.label,
        hintText: widget.hint,
        alignLabelWithHint: widget.maxLines > 1,
        prefixIcon: widget.prefixIcon == null ? null : Icon(widget.prefixIcon, size: 20),
        suffixIcon: suffix,
      ),
    );
  }
}
