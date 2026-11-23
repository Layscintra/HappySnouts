import 'dart:async';

import 'package:flutter/material.dart';
import 'package:happysnouts/screens/home/home_screen.dart';
import 'package:happysnouts/services/auth_service.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/services/session_controller.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/auth_scaffold.dart';

/// Último passo do cadastro: digitar o código que chegou no e-mail.
/// Só com o código certo o backend cria a conta (prova que o e-mail é da pessoa).
class ConfirmEmailScreen extends StatefulWidget {
  final RegistrationData registration;

  /// Aviso do backend quando o código já tinha sido enviado há pouco.
  final String? notice;

  const ConfirmEmailScreen({super.key, required this.registration, this.notice});

  @override
  State<ConfirmEmailScreen> createState() => _ConfirmEmailScreenState();
}

class _ConfirmEmailScreenState extends State<ConfirmEmailScreen> {
  final _formKey = GlobalKey<FormState>();
  final _code = TextEditingController();
  bool _loading = false;
  int _resendIn = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startResendTimer();
    if (widget.notice != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) AppFeedback.show(context, widget.notice!);
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _code.dispose();
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

  Future<void> _resend() async {
    if (_resendIn > 0 || _loading) return;
    setState(() => _loading = true);
    try {
      final notice = await AuthService.instance.requestSignupCode(
        widget.registration.email,
        widget.registration.fullName,
      );
      if (!mounted) return;
      AppFeedback.show(context, notice ?? 'Enviamos um novo código para ${widget.registration.email.trim()}.');
      _startResendTimer();
    } catch (error) {
      if (mounted) AppFeedback.show(context, errorMessage(error), error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _confirm() async {
    if (_loading || !_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() => _loading = true);
    try {
      widget.registration.emailCode = _code.text;
      await SessionController.register(widget.registration);
      if (!mounted) return;
      Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const HomeScreen()), (route) => false);
      AppFeedback.show(context, 'Conta criada! Boas-vindas ao Happy Snouts 🐾');
    } catch (error) {
      if (!mounted) return;
      setState(() => _loading = false);
      AppFeedback.show(context, errorMessage(error), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Confirme seu',
      highlight: 'e-mail',
      headerIcon: Icons.mail_rounded,
      subtitle: TextSpan(
        children: [
          const TextSpan(text: 'Enviamos um código de 6 números para '),
          TextSpan(
            text: widget.registration.email.trim(),
            style: const TextStyle(fontWeight: FontWeight.w800, color: AuthColors.title),
          ),
          const TextSpan(text: '. Ele vale por 15 minutos. Confira também a caixa de spam.'),
        ],
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            OtpCodeField(controller: _code, autofocus: true, onCompleted: (_) => _confirm()),
            const SizedBox(height: 22),
            AuthPrimaryButton(label: 'Confirmar e criar conta', loading: _loading, onPressed: _confirm),
            const SizedBox(height: 12),
            AuthCodeActions(
              backLabel: 'Voltar e corrigir',
              onBack: _loading ? null : () => Navigator.pop(context),
              resendIn: _resendIn,
              onResend: _loading ? null : _resend,
            ),
          ],
        ),
      ),
    );
  }
}
