import 'package:flutter/material.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';

/// Cabeçalho usado nas telas do fluxo de cadastro: seta de voltar,
/// barra de progresso, título e linha divisória.
/// [progress] vai de 0.0 (início do fluxo) a 1.0 (fim).
class OnboardingHeader extends StatelessWidget {
  final String title;
  final double progress;

  const OnboardingHeader({super.key, required this.title, required this.progress});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Row(
          children: [
            IconButton(
              tooltip: 'Voltar',
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.arrow_back_ios_new, color: AppColors.formBlue, size: 18),
            ),
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 6,
                  backgroundColor: palette.isDark ? Colors.white12 : const Color(0xFFDADADA),
                  valueColor: const AlwaysStoppedAnimation<Color>(AppColors.formBlue),
                ),
              ),
            ),
            const SizedBox(width: 12),
          ],
        ),
        const SizedBox(height: 12),
        Text(
          title,
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17, color: palette.text),
        ),
        const SizedBox(height: 12),
        Divider(color: palette.isDark ? Colors.white12 : const Color(0xFFB9CCF5), thickness: 1, height: 1),
      ],
    );
  }
}
