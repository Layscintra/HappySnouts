import 'package:flutter/material.dart';
import 'package:happysnouts/screens/auth/forgot_password_screen.dart';
import 'package:happysnouts/screens/employee/employee_panel_screen.dart';
import 'package:happysnouts/screens/home/home_screen.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/services/session_controller.dart';
import 'package:happysnouts/utils/validators.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/brand_backdrop.dart';

/// Login único: cliente e funcionário entram pelo mesmo formulário. O backend
/// reconhece quem é pelo e-mail e o app abre a Home ou o painel da loja.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (_loading || !_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() => _loading = true);
    try {
      final kind = await SessionController.login(_emailController.text, _passwordController.text);
      if (!mounted) return;
      openHomeFor(context, kind);
    } catch (error) {
      if (!mounted) return;
      AppFeedback.show(context, errorMessage(error), error: true);
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BrandBackdrop(
        colors: const [Color(0xFFFFBE5C), Color(0xFFFBA83F)],
        blobColor: const Color(0xFFF59A2C).withValues(alpha: 0.55),
        pawColor: const Color(0xFFFFD58A).withValues(alpha: 0.7),
        child: SafeArea(
          child: Stack(
            children: [
              SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 440),
                    child: Column(
                      children: [
                        const SizedBox(height: 56),
                        Image.asset('assets/images/logo_marrom.png', height: 105, semanticLabel: 'Happy Snouts'),
                        const SizedBox(height: 56),
                        const Text(
                          'Bem-vindo de volta!',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Color.fromARGB(255, 110, 60, 10),
                            fontSize: 26,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.4,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Faça login para continuar',
                          style: TextStyle(color: Color.fromARGB(255, 91, 51, 16), fontSize: 16),
                        ),
                        const SizedBox(height: 8),
                        _buildCatAndCard(),
                      ],
                    ),
                  ),
                ),
              ),
              if (Navigator.canPop(context))
                IconButton(
                  tooltip: 'Voltar',
                  onPressed: () => Navigator.maybePop(context),
                  icon: const Icon(Icons.arrow_back_rounded, color: BrandColors.brown),
                ),
            ],
          ),
        ),
      ),
    );
  }

  // O gato dorme em cima do cartão: o cartão começa mais abaixo e o gato fica por cima.
  Widget _buildCatAndCard() {
    return Stack(
      alignment: Alignment.topCenter,
      clipBehavior: Clip.none,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 80),
          child: Container(
            padding: const EdgeInsets.fromLTRB(20, 80, 20, 22),
            decoration: BoxDecoration(
              color: BrandColors.cream,
              borderRadius: BorderRadius.circular(34),
              boxShadow: [
                BoxShadow(
                  color: BrandColors.orangeDark.withValues(alpha: 0.25),
                  blurRadius: 24,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: AutofillGroup(
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _pillField(
                      controller: _emailController,
                      hint: 'E-mail',
                      icon: Icons.mail_outline_rounded,
                      keyboardType: TextInputType.emailAddress,
                      validator: Validators.loginEmail,
                      autofillHints: const [AutofillHints.email],
                    ),
                    const SizedBox(height: 14),
                    _pillField(
                      controller: _passwordController,
                      hint: 'Senha',
                      icon: Icons.lock_outline_rounded,
                      obscure: _obscurePassword,
                      validator: (value) => Validators.required(value, message: 'Digite sua senha'),
                      textInputAction: TextInputAction.done,
                      onSubmitted: (_) => _handleLogin(),
                      autofillHints: const [AutofillHints.password],
                      suffix: IconButton(
                        tooltip: _obscurePassword ? 'Mostrar senha' : 'Ocultar senha',
                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                        icon: Icon(
                          _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                          color: BrandColors.brown,
                        ),
                      ),
                    ),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () => Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => ForgotPasswordScreen(initialEmail: _emailController.text)),
                        ),
                        child: const Text.rich(
                          TextSpan(
                            style: TextStyle(color: BrandColors.brown, fontSize: 14, fontWeight: FontWeight.w500),
                            children: [
                              TextSpan(text: 'Esqueceu sua '),
                              TextSpan(
                                text: 'senha?',
                                style: TextStyle(color: BrandColors.orange, fontWeight: FontWeight.w700),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    BrandButton(label: 'Entrar', loading: _loading, onPressed: _handleLogin),
                  ],
                ),
              ),
            ),
          ),
        ),
        Positioned(
          top: 10,
          child: IgnorePointer(
            child: Image.asset('assets/images/gatoDeitadologin01.png', height: 145, excludeFromSemantics: true),
          ),
        ),
        const Positioned(top: 1, right: 28, child: IgnorePointer()),
      ],
    );
  }

  Widget _pillField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    bool obscure = false,
    TextInputType keyboardType = TextInputType.text,
    String? Function(String?)? validator,
    TextInputAction textInputAction = TextInputAction.next,
    ValueChanged<String>? onSubmitted,
    Iterable<String>? autofillHints,
    Widget? suffix,
  }) {
    OutlineInputBorder border(Color color, [double width = 1.2]) => OutlineInputBorder(
      borderRadius: BorderRadius.circular(40),
      borderSide: BorderSide(color: color, width: width),
    );
    return TextFormField(
      controller: controller,
      obscureText: obscure,
      keyboardType: keyboardType,
      validator: validator,
      textInputAction: textInputAction,
      onFieldSubmitted: onSubmitted,
      autofillHints: autofillHints,
      style: const TextStyle(color: BrandColors.brown, fontSize: 16, fontWeight: FontWeight.w600),
      cursorColor: BrandColors.orange,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: BrandColors.brownSoft.withValues(alpha: 0.75), fontSize: 16),
        filled: true,
        fillColor: BrandColors.creamLight,
        prefixIcon: Padding(
          padding: const EdgeInsets.only(left: 12, right: 6),
          child: Icon(icon, color: BrandColors.brown),
        ),
        suffixIcon: suffix,
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
        errorStyle: const TextStyle(color: Color(0xFFC0392B), fontWeight: FontWeight.w600),
        border: border(const Color(0xFFE2C9A6)),
        enabledBorder: border(const Color(0xFFE2C9A6)),
        focusedBorder: border(BrandColors.orange, 1.8),
        errorBorder: border(const Color(0xFFC0392B)),
        focusedErrorBorder: border(const Color(0xFFC0392B), 1.8),
      ),
    );
  }
}

/// Abre a tela inicial certa para quem entrou (Home do cliente ou painel do
/// funcionário) e limpa a pilha: o "voltar" não volta para o login.
void openHomeFor(BuildContext context, SessionKind kind) {
  Navigator.pushAndRemoveUntil(
    context,
    MaterialPageRoute(builder: (_) => kind == SessionKind.employee ? const EmployeePanelScreen() : const HomeScreen()),
    (route) => false,
  );
}
