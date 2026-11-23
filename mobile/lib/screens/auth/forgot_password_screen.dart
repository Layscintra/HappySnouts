import 'dart:async';

import 'package:flutter/material.dart';
import 'package:happysnouts/services/auth_service.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/utils/validators.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/auth_scaffold.dart';

enum _Step { email, code, password, done }

/// Recuperação de senha em 3 passos:
/// 1. e-mail → o backend manda um código de 6 dígitos (vale 15 min);
/// 2. código → confere;
/// 3. nova senha → grava e a pessoa já pode entrar.
class ForgotPasswordScreen extends StatefulWidget {
  final String initialEmail;

  const ForgotPasswordScreen({super.key, this.initialEmail = ''});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  late final _email = TextEditingController(text: widget.initialEmail);
  final _code = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  _Step _step = _Step.email;
  bool _loading = false;
  int _resendIn = 0;
  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    for (final c in [_email, _code, _password, _confirm]) {
      c.dispose();
    }
    super.dispose();
  }

  void _startResendTimer() {
    _timer?.cancel();
    setState(() => _resendIn = 60);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return timer.cancel();
      setState(() => _resendIn--);
      if (_resendIn <= 0) timer.cancel();
    });
  }

  Future<void> _run(Future<void> Function() action) async {
    if (_loading || !_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() => _loading = true);
    try {
      await action();
    } catch (error) {
      if (mounted) AppFeedback.show(context, errorMessage(error), error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _sendCode() => _run(() async {
    await AuthService.instance.requestPasswordReset(_email.text);
    if (!mounted) return;
    _code.clear();
    setState(() => _step = _Step.code);
    _startResendTimer();
  });

  Future<void> _resend() async {
    if (_resendIn > 0 || _loading) return;
    setState(() => _loading = true);
    try {
      await AuthService.instance.requestPasswordReset(_email.text);
      if (!mounted) return;
      AppFeedback.show(context, 'Enviamos um novo código para ${_email.text.trim()}.');
      _startResendTimer();
    } catch (error) {
      if (mounted) AppFeedback.show(context, errorMessage(error), error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _checkCode() => _run(() async {
    await AuthService.instance.verifyResetCode(_email.text, _code.text);
    if (mounted) setState(() => _step = _Step.password);
  });

  Future<void> _savePassword() => _run(() async {
    await AuthService.instance.resetPassword(_email.text, _code.text, _password.text);
    if (mounted) setState(() => _step = _Step.done);
  });

  (String, String) get _heading {
    switch (_step) {
      case _Step.email:
        return ('Esqueceu a', 'senha?');
      case _Step.code:
        return ('Digite o', 'código');
      case _Step.password:
        return ('Crie uma nova', 'senha');
      case _Step.done:
        return ('Senha', 'alterada!');
    }
  }

  InlineSpan get _subtitle {
    const bold = TextStyle(fontWeight: FontWeight.w800, color: AuthColors.title);
    switch (_step) {
      case _Step.email:
        return const TextSpan(
          text: 'Informe o e-mail da sua conta. Vamos enviar um código para você criar uma nova senha.',
        );
      case _Step.code:
        return TextSpan(
          children: [
            const TextSpan(text: 'Enviamos um código de 6 números para '),
            TextSpan(text: _email.text.trim(), style: bold),
            const TextSpan(text: '. Ele vale por 15 minutos. Confira também a caixa de spam.'),
          ],
        );
      case _Step.password:
        return const TextSpan(text: 'Escolha uma senha com pelo menos 6 caracteres.');
      case _Step.done:
        return const TextSpan(text: 'Tudo certo. Agora é só entrar com a sua nova senha.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final (title, highlight) = _heading;
    return PopScope(
      canPop: _step == _Step.email || _step == _Step.done,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) setState(() => _step = _step == _Step.password ? _Step.code : _Step.email);
      },
      child: AuthScaffold(
        title: title,
        highlight: highlight,
        subtitle: _subtitle,
        petImage: null,
        logoInCard: true,
        child: Form(
          key: _formKey,
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 220),
            child: KeyedSubtree(key: ValueKey(_step), child: _buildStep()),
          ),
        ),
      ),
    );
  }

  Widget _buildStep() {
    switch (_step) {
      case _Step.email:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const AuthStepIndicator(current: 0),
            const SizedBox(height: 22),
            AuthTextField(
              controller: _email,
              label: 'E-mail da conta',
              hint: 'voce@email.com',
              icon: Icons.mail_outline_rounded,
              keyboardType: TextInputType.emailAddress,
              validator: Validators.loginEmail,
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _sendCode(),
              autofillHints: const [AutofillHints.email],
            ),
            const SizedBox(height: 22),
            AuthPrimaryButton(
              label: 'Enviar código',
              loading: _loading,
              onPressed: _sendCode,
              icon: Icons.send_rounded,
            ),
          ],
        );
      case _Step.code:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const AuthStepIndicator(current: 1),
            const SizedBox(height: 22),
            OtpCodeField(controller: _code, autofocus: true, onCompleted: (_) => _checkCode()),
            const SizedBox(height: 22),
            AuthPrimaryButton(label: 'Confirmar código', loading: _loading, onPressed: _checkCode),
            const SizedBox(height: 12),
            AuthCodeActions(
              backLabel: 'Trocar e-mail',
              onBack: _loading ? null : () => setState(() => _step = _Step.email),
              resendIn: _resendIn,
              onResend: _loading ? null : _resend,
            ),
          ],
        );
      case _Step.password:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const AuthStepIndicator(current: 2),
            const SizedBox(height: 22),
            AuthTextField(
              controller: _password,
              label: 'Nova senha',
              hint: 'Mínimo de 6 caracteres',
              icon: Icons.lock_outline_rounded,
              obscureText: true,
              validator: Validators.password,
              autofillHints: const [AutofillHints.newPassword],
            ),
            const SizedBox(height: 16),
            AuthTextField(
              controller: _confirm,
              label: 'Confirme a nova senha',
              hint: 'Repita a senha',
              icon: Icons.lock_outline_rounded,
              obscureText: true,
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _savePassword(),
              validator: (v) => v == _password.text ? null : 'As senhas não são iguais',
            ),
            const SizedBox(height: 22),
            AuthPrimaryButton(
              label: 'Salvar nova senha',
              loading: _loading,
              onPressed: _savePassword,
              icon: Icons.check_rounded,
            ),
          ],
        );
      case _Step.done:
        return AuthPrimaryButton(
          label: 'Voltar para o login',
          loading: false,
          onPressed: () => Navigator.pop(context),
          icon: Icons.login_rounded,
        );
    }
  }
}
