import 'package:flutter/material.dart';
import 'package:happysnouts/config/app_config.dart';
import 'package:happysnouts/theme/app_theme.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Scaffold(
      appBar: AppBar(title: const Text('Sobre o aplicativo')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Image.asset('assets/images/logo_vertical.png', height: 120, semanticLabel: AppConfig.appName),
          const SizedBox(height: 16),
          Text(
            AppConfig.appName,
            textAlign: TextAlign.center,
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 22, color: palette.title),
          ),
          Text(
            'Versão ${AppConfig.appVersion}',
            textAlign: TextAlign.center,
            style: TextStyle(color: palette.muted),
          ),
          const SizedBox(height: 24),
          Text(
            'O Happy Snouts reúne em um só lugar os cuidados com o seu pet: '
            'perfil e saúde, calendário de vacinas e consultas, alimentação com '
            'comedouro automático, rastreamento com coleira e uma loja de produtos.',
            textAlign: TextAlign.center,
            style: TextStyle(color: palette.text, height: 1.5),
          ),
          const SizedBox(height: 12),
          Text(
            'Projeto desenvolvido no SENAI.',
            textAlign: TextAlign.center,
            style: TextStyle(color: palette.muted),
          ),
        ],
      ),
    );
  }
}
