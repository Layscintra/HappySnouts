import 'package:flutter/material.dart';
import 'package:happysnouts/screens/auth/login_screen.dart';
import 'package:happysnouts/screens/auth/signup_screen.dart';
import 'package:happysnouts/widgets/brand_backdrop.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.paddingOf(context).bottom;
    return Scaffold(
      body: BrandBackdrop(
        colors: const [Color(0xFFFFF3D2), Color(0xFFFFE9B0)],
        blobColor: const Color(0xFFFFD27A).withValues(alpha: 0.55),
        pawColor: const Color(0xFFF7B84A).withValues(alpha: 0.45),
        child: SafeArea(
          bottom: false,
          child: LayoutBuilder(
            builder: (context, constraints) {
              // Em telas baixas (ou com fonte grande) o conteúdo rola em vez de estourar.
              return SingleChildScrollView(
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: constraints.maxHeight),
                  child: IntrinsicHeight(
                    child: Column(
                      children: [
                        const SizedBox(height: 28),
                        Image.asset('assets/images/logo_vertical.png', height: 170, semanticLabel: 'Happy Snouts'),
                        const SizedBox(height: 8),
                        _buildTagline(),
                        const Spacer(),
                        _buildCatAndCard(context, bottomInset),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildTagline() {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 32),
      child: Text.rich(
        TextSpan(
          style: TextStyle(
            color: BrandColors.brown,
            fontSize: 23,
            height: 1.3,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.3,
          ),
          children: [
            TextSpan(text: 'Seu pet merece '),
            TextSpan(
              text: 'cuidado',
              style: TextStyle(color: BrandColors.orange),
            ),
            TextSpan(text: '\nem cada refeição!'),
          ],
        ),
        textAlign: TextAlign.center,
      ),
    );
  }

  // O gato espia por cima do cartão: o cartão começa mais abaixo (padding)
  // e o gato, sem padding, fica por cima dele no Stack.
  Widget _buildCatAndCard(BuildContext context, double bottomInset) {
    return Stack(
      alignment: Alignment.topCenter,
      clipBehavior: Clip.none,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 196),
          child: Container(
            width: double.infinity,
            padding: EdgeInsets.fromLTRB(32, 56, 32, 28 + bottomInset),
            decoration: BoxDecoration(
              color: BrandColors.cream,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(44)),
              boxShadow: [
                BoxShadow(
                  color: BrandColors.orangeDark.withValues(alpha: 0.12),
                  blurRadius: 24,
                  offset: const Offset(0, -6),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: SizedBox(
                    width: double.infinity,
                    child: BrandButton(
                      label: 'Me cadastrar',
                      onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SignupScreen())),
                    ),
                  ),
                ),
                const SizedBox(height: 26),
                TextButton(
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
                  child: const Text.rich(
                    TextSpan(
                      style: TextStyle(color: BrandColors.brown, fontSize: 17, fontWeight: FontWeight.w500),
                      children: [
                        TextSpan(text: 'Já tem login? '),
                        TextSpan(
                          text: 'Entrar agora',
                          style: TextStyle(
                            color: BrandColors.orange,
                            fontWeight: FontWeight.w700,
                            decoration: TextDecoration.underline,
                            decorationColor: BrandColors.orange,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        Image.asset('assets/images/gato_login.png', height: 225, fit: BoxFit.contain, excludeFromSemantics: true),
      ],
    );
  }
}
