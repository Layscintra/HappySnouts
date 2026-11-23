import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/widgets/brand_backdrop.dart';

class AuthColors {
  AuthColors._();

  static const backdrop = [Color(0xFFFFBE5C), Color(0xFFFBA83F)];
  static const card = BrandColors.cream;
  static const cardBorder = Color(0xFFF5DDB8);
  static const title = BrandColors.brown;
  static const text = Color(0xFF6B4A2E);
  static const muted = Color(0xFF9A7B5E);
  static const orange = AppColors.orangeStrong;
  static const orangeLight = Color(0xFFFFA53D);
  static const orangeDark = Color(0xFFE8820F);
  static const orangeSoft = Color(0xFFFFE6C4);
  static const fieldBorder = Color(0xFFEAD3B2);
  static const error = Color(0xFFC62828);
}

class AuthScaffold extends StatelessWidget {
  /// Título em azul; [highlight] é a palavra destacada em laranja (ex.: "e-mail").
  final String title;
  final String? highlight;

  final InlineSpan subtitle;

  final IconData? headerIcon;

  final bool headerCheck;
  final Widget child;
  final bool showBack;

  /// Pet "espiando" por cima do cartão; null tira o pet.
  final String? petImage;

  final bool logoInCard;

  const AuthScaffold({
    super.key,
    required this.title,
    required this.subtitle,
    required this.child,
    this.highlight,
    this.headerIcon,
    this.headerCheck = true,
    this.showBack = true,
    this.petImage = 'assets/images/dog _login1.png',
    this.logoInCard = false,
  });

  static const _petHeight = 150.0;
  static const _petOverlap = 34.0; // quanto dos pets fica por cima do cartão

  @override
  Widget build(BuildContext context) {
    final insets = MediaQuery.paddingOf(context);
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: AppTheme.darkStatusIcons,
      child: Scaffold(
        body: BrandBackdrop(
          colors: AuthColors.backdrop,
          blobColor: const Color(0xFFF59A2C).withValues(alpha: 0.55),
          pawColor: const Color(0xFFFFD58A).withValues(alpha: 0.7),
          child: LayoutBuilder(
            builder: (context, viewport) => SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(16, insets.top + 4, 16, insets.bottom + 28),
              child: Center(
                child: ConstrainedBox(
                  // ocupa pelo menos a tela toda, para o cartão ficar centralizado na altura
                  constraints: BoxConstraints(
                    maxWidth: 460,
                    minHeight: (viewport.maxHeight - insets.top - insets.bottom - 32).clamp(0, double.infinity),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      SizedBox(
                        height: 52,
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: showBack && Navigator.canPop(context) ? const _BackButton() : null,
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          if (!logoInCard) ...[
                            Center(
                              child: Image.asset(
                                'assets/images/logo_marrom.png',
                                height: 60,
                                semanticLabel: 'Happy Snouts',
                              ),
                            ),
                            const SizedBox(height: 6),
                          ] else
                            const SizedBox(height: 12),
                          Stack(
                            clipBehavior: Clip.none,
                            children: [
                              Padding(
                                padding: EdgeInsets.only(top: petImage == null ? 0 : _petHeight - _petOverlap),
                                child: _AuthCard(
                                  title: title,
                                  highlight: highlight,
                                  subtitle: subtitle,
                                  headerIcon: headerIcon,
                                  headerCheck: headerCheck,
                                  showLogo: logoInCard,
                                  topPadding: petImage == null ? 28 : 40,
                                  child: child,
                                ),
                              ),
                              // os pets ficam por cima da borda do cartão, "espiando"
                              if (petImage != null)
                                Positioned(
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  child: IgnorePointer(
                                    child: Center(
                                      child: Image.asset(petImage!, height: _petHeight, excludeFromSemantics: true),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 52), // contrapeso do botão de voltar, para o cartão ficar no meio
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _AuthCard extends StatelessWidget {
  final String title;
  final String? highlight;
  final InlineSpan subtitle;
  final IconData? headerIcon;
  final bool headerCheck;
  final bool showLogo;
  final double topPadding;
  final Widget child;

  const _AuthCard({
    required this.title,
    required this.highlight,
    required this.subtitle,
    required this.headerIcon,
    required this.headerCheck,
    required this.showLogo,
    required this.topPadding,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(22, topPadding, 22, 26),
      decoration: BoxDecoration(
        color: AuthColors.card,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: AuthColors.cardBorder),
        boxShadow: [
          BoxShadow(color: BrandColors.orangeDark.withValues(alpha: 0.25), blurRadius: 24, offset: const Offset(0, 10)),
        ],
      ),
      // o conteúdo do cartão usa sempre o tema claro (o cartão é creme também no modo escuro)
      child: Theme(
        data: AppTheme.light(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (showLogo) ...[
              // logo marrom: a laranja/amarela some no fundo creme do cartão
              Center(child: Image.asset('assets/images/logo_marrom.png', height: 64, semanticLabel: 'Happy Snouts')),
              const SizedBox(height: 18),
            ],
            if (headerIcon != null) ...[
              Center(
                child: _HeaderIcon(icon: headerIcon!, check: headerCheck),
              ),
              const SizedBox(height: 14),
            ],
            Text.rich(
              TextSpan(
                children: [
                  TextSpan(text: title),
                  if (highlight != null) ...[
                    const TextSpan(text: ' '),
                    TextSpan(
                      text: highlight,
                      style: const TextStyle(color: AuthColors.orange),
                    ),
                  ],
                ],
              ),
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 28,
                height: 1.15,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.6,
                color: AuthColors.title,
              ),
            ),
            const SizedBox(height: 10),
            Text.rich(
              subtitle,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 14.5, height: 1.5, color: AuthColors.text),
            ),
            const SizedBox(height: 24),
            child,
          ],
        ),
      ),
    );
  }
}

class _HeaderIcon extends StatelessWidget {
  final IconData icon;
  final bool check;

  const _HeaderIcon({required this.icon, required this.check});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 76,
      height: 76,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: 76,
            height: 76,
            decoration: const BoxDecoration(color: AuthColors.orangeSoft, shape: BoxShape.circle),
            child: Icon(icon, size: 36, color: AuthColors.title),
          ),
          if (check)
            Positioned(
              right: -2,
              bottom: 2,
              child: Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(
                  color: AuthColors.orange,
                  shape: BoxShape.circle,
                  border: Border.all(color: AuthColors.card, width: 2.5),
                ),
                child: const Icon(Icons.check_rounded, size: 15, color: Colors.white),
              ),
            ),
        ],
      ),
    );
  }
}

class _BackButton extends StatelessWidget {
  const _BackButton();

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withValues(alpha: 0.35),
      shape: const CircleBorder(),
      child: IconButton(
        tooltip: 'Voltar',
        onPressed: () => Navigator.maybePop(context),
        icon: const Icon(Icons.arrow_back_rounded, color: BrandColors.brown),
      ),
    );
  }
}

class AuthPrimaryButton extends StatelessWidget {
  final String label;
  final bool loading;
  final VoidCallback? onPressed;
  final IconData icon;

  const AuthPrimaryButton({
    super.key,
    required this.label,
    required this.loading,
    required this.onPressed,
    this.icon = Icons.arrow_forward_rounded,
  });

  @override
  Widget build(BuildContext context) {
    final enabled = !loading && onPressed != null;
    return Semantics(
      button: true,
      enabled: enabled,
      label: label,
      excludeSemantics: true,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 150),
        opacity: enabled || loading ? 1 : 0.6,
        child: DecoratedBox(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            gradient: const LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [AuthColors.orangeLight, AuthColors.orange, AuthColors.orangeDark],
            ),
            boxShadow: [
              BoxShadow(color: AuthColors.orange.withValues(alpha: 0.45), blurRadius: 18, offset: const Offset(0, 8)),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(18),
              onTap: enabled ? onPressed : null,
              child: SizedBox(
                height: 56,
                child: Center(
                  child: loading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2.6, color: Colors.white),
                        )
                      : Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Flexible(
                              child: Text(
                                label,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16.5,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Icon(icon, color: Colors.white, size: 22),
                          ],
                        ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class AuthTextField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final String hint;
  final IconData icon;
  final bool obscureText;
  final TextInputType keyboardType;
  final TextInputAction textInputAction;
  final FormFieldValidator<String>? validator;
  final ValueChanged<String>? onSubmitted;
  final Iterable<String>? autofillHints;
  final bool autofocus;

  const AuthTextField({
    super.key,
    required this.controller,
    required this.label,
    required this.hint,
    required this.icon,
    this.obscureText = false,
    this.keyboardType = TextInputType.text,
    this.textInputAction = TextInputAction.next,
    this.validator,
    this.onSubmitted,
    this.autofillHints,
    this.autofocus = false,
  });

  @override
  State<AuthTextField> createState() => _AuthTextFieldState();
}

class _AuthTextFieldState extends State<AuthTextField> {
  late bool _hidden = widget.obscureText;

  @override
  Widget build(BuildContext context) {
    OutlineInputBorder border(Color color, [double width = 1.4]) => OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide(color: color, width: width),
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            widget.label,
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14.5, color: AuthColors.title),
          ),
        ),
        TextFormField(
          controller: widget.controller,
          obscureText: _hidden,
          keyboardType: widget.keyboardType,
          textInputAction: widget.textInputAction,
          validator: widget.validator,
          onFieldSubmitted: widget.onSubmitted,
          autofillHints: widget.autofillHints,
          autofocus: widget.autofocus,
          autovalidateMode: AutovalidateMode.onUserInteraction,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AuthColors.title),
          decoration: InputDecoration(
            hintText: widget.hint,
            hintStyle: const TextStyle(color: Color(0xFFA2A6B0), fontWeight: FontWeight.w500),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
            prefixIcon: Padding(
              padding: const EdgeInsets.only(left: 10, right: 10),
              child: Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(color: AuthColors.orangeSoft, borderRadius: BorderRadius.circular(12)),
                child: Icon(widget.icon, size: 20, color: AuthColors.orangeDark),
              ),
            ),
            prefixIconConstraints: const BoxConstraints(minWidth: 58, minHeight: 38),
            suffixIcon: widget.obscureText
                ? IconButton(
                    tooltip: _hidden ? 'Mostrar senha' : 'Ocultar senha',
                    onPressed: () => setState(() => _hidden = !_hidden),
                    icon: Icon(
                      _hidden ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                      size: 21,
                      color: AuthColors.muted,
                    ),
                  )
                : null,
            enabledBorder: border(AuthColors.fieldBorder),
            focusedBorder: border(AuthColors.orange, 2),
            errorBorder: border(AuthColors.error),
            focusedErrorBorder: border(AuthColors.error, 2),
            errorStyle: const TextStyle(color: AuthColors.error, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}

/// Código de 6 números em caixinhas separadas (estilo PIN/OTP).
/// Um campo invisível por cima recebe a digitação, o "colar" e o preenchimento
/// automático do código pelo celular; as caixas só mostram os números.
class OtpCodeField extends FormField<String> {
  OtpCodeField({
    super.key,
    required TextEditingController controller,
    ValueChanged<String>? onCompleted,
    bool autofocus = false,
  }) : super(
         initialValue: controller.text,
         validator: (value) => (value ?? '').length == 6 ? null : 'Digite os 6 números do código',
         builder: (state) =>
             _OtpBoxes(state: state, controller: controller, onCompleted: onCompleted, autofocus: autofocus),
       );
}

class _OtpBoxes extends StatefulWidget {
  final FormFieldState<String> state;
  final TextEditingController controller;
  final ValueChanged<String>? onCompleted;
  final bool autofocus;

  const _OtpBoxes({required this.state, required this.controller, required this.onCompleted, required this.autofocus});

  @override
  State<_OtpBoxes> createState() => _OtpBoxesState();
}

class _OtpBoxesState extends State<_OtpBoxes> {
  static const _length = 6;
  final _focus = FocusNode();

  @override
  void initState() {
    super.initState();
    _focus.addListener(() => setState(() {}));
    widget.controller.addListener(_sync);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_sync);
    _focus.dispose();
    super.dispose();
  }

  // o campo do formulário acompanha o que foi digitado (e limpa o erro ao digitar)
  void _sync() {
    final text = widget.controller.text;
    if (text != widget.state.value) widget.state.didChange(text);
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final text = widget.controller.text;
    final hasError = widget.state.hasError;
    final current = text.length.clamp(0, _length - 1);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Semantics(
          label: 'Código de 6 números',
          child: Stack(
            children: [
              Row(
                children: [
                  for (var i = 0; i < _length; i++) ...[
                    if (i > 0) const SizedBox(width: 8),
                    Expanded(
                      child: _box(
                        i < text.length ? text[i] : '',
                        active: _focus.hasFocus && i == current && text.length < _length,
                        hasError: hasError,
                      ),
                    ),
                  ],
                ],
              ),
              Positioned.fill(
                child: TextField(
                  controller: widget.controller,
                  focusNode: _focus,
                  autofocus: widget.autofocus,
                  keyboardType: TextInputType.number,
                  textInputAction: TextInputAction.done,
                  autofillHints: const [AutofillHints.oneTimeCode],
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(_length)],
                  showCursor: false,
                  enableInteractiveSelection: true,
                  style: const TextStyle(color: Colors.transparent, fontSize: 1),
                  decoration: const InputDecoration(
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    filled: false,
                    counterText: '',
                    contentPadding: EdgeInsets.zero,
                  ),
                  onChanged: (value) {
                    if (value.length == _length) widget.onCompleted?.call(value);
                  },
                  onSubmitted: (value) {
                    if (value.length == _length) widget.onCompleted?.call(value);
                  },
                ),
              ),
            ],
          ),
        ),
        if (hasError)
          Padding(
            padding: const EdgeInsets.only(top: 10),
            child: Text(
              widget.state.errorText!,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AuthColors.error, fontSize: 13, fontWeight: FontWeight.w600),
            ),
          ),
      ],
    );
  }

  Widget _box(String digit, {required bool active, required bool hasError}) {
    final borderColor = hasError
        ? AuthColors.error
        : active
        ? AuthColors.orange
        : digit.isNotEmpty
        ? AuthColors.title.withValues(alpha: 0.55)
        : AuthColors.fieldBorder;
    return AspectRatio(
      aspectRatio: 0.84,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 140),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: borderColor, width: active ? 2.2 : 1.5),
          boxShadow: active
              ? [BoxShadow(color: AuthColors.orange.withValues(alpha: 0.18), blurRadius: 0, spreadRadius: 4)]
              : null,
        ),
        alignment: Alignment.center,
        child: digit.isNotEmpty
            ? Text(
                digit,
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AuthColors.title),
              )
            : active
            ? Container(width: 2.2, height: 24, color: AuthColors.orange)
            : Container(
                width: 6,
                height: 6,
                decoration: const BoxDecoration(color: Color(0xFFC9BFB1), shape: BoxShape.circle),
              ),
      ),
    );
  }
}

class AuthCodeActions extends StatelessWidget {
  final String backLabel;
  final VoidCallback? onBack;
  final int resendIn;
  final VoidCallback? onResend;

  const AuthCodeActions({
    super.key,
    required this.backLabel,
    required this.onBack,
    required this.resendIn,
    required this.onResend,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            const Expanded(child: Divider(color: AuthColors.fieldBorder, thickness: 1)),
            TextButton.icon(
              onPressed: onBack,
              style: TextButton.styleFrom(
                foregroundColor: AuthColors.title,
                minimumSize: const Size(48, 48),
                textStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
              ),
              icon: const Icon(Icons.replay_rounded, size: 20),
              label: Text(backLabel),
            ),
            const Expanded(child: Divider(color: AuthColors.fieldBorder, thickness: 1)),
          ],
        ),
        TextButton(
          onPressed: resendIn > 0 ? null : onResend,
          style: TextButton.styleFrom(
            foregroundColor: AuthColors.orangeDark,
            disabledForegroundColor: AuthColors.muted,
            minimumSize: const Size(48, 44),
            textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
          ),
          child: Text(resendIn > 0 ? 'Reenviar em ${resendIn}s' : 'Reenviar código'),
        ),
      ],
    );
  }
}

class AuthStepIndicator extends StatelessWidget {
  final int current;
  final List<String> labels;

  const AuthStepIndicator({super.key, required this.current, this.labels = const ['E-mail', 'Código', 'Nova senha']});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Etapa ${current + 1} de ${labels.length}: ${labels[current]}',
      excludeSemantics: true,
      child: Row(
        children: [
          for (var i = 0; i < labels.length; i++) ...[
            if (i > 0) const SizedBox(width: 8),
            Expanded(
              child: Column(
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 220),
                    height: 5,
                    decoration: BoxDecoration(
                      color: i <= current ? AuthColors.orange : AuthColors.fieldBorder,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    labels[i],
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: i == current ? FontWeight.w800 : FontWeight.w600,
                      color: i <= current ? AuthColors.title : AuthColors.muted,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class OrDivider extends StatelessWidget {
  const OrDivider({super.key});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Row(
      children: [
        Expanded(child: Divider(color: palette.border)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text('ou', style: TextStyle(color: palette.muted, fontSize: 13)),
        ),
        Expanded(child: Divider(color: palette.border)),
      ],
    );
  }
}
