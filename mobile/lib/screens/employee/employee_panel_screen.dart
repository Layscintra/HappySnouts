import 'dart:async';

import 'package:flutter/material.dart';
import 'package:happysnouts/screens/auth/splash_screen.dart';
import 'package:happysnouts/screens/employee/blog_tab.dart';
import 'package:happysnouts/screens/employee/categories_tab.dart';
import 'package:happysnouts/screens/employee/messages_tab.dart';
import 'package:happysnouts/screens/employee/orders_tab.dart';
import 'package:happysnouts/screens/employee/products_tab.dart';
import 'package:happysnouts/services/session_controller.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/theme/theme_controller.dart';
import 'package:happysnouts/widgets/app_feedback.dart';

/// Painel da loja. Abre sozinho quando quem entra é funcionário
/// (o login é o mesmo do cliente; o backend reconhece pelo e-mail).
class EmployeePanelScreen extends StatefulWidget {
  const EmployeePanelScreen({super.key});

  @override
  State<EmployeePanelScreen> createState() => _EmployeePanelScreenState();
}

class _EmployeePanelScreenState extends State<EmployeePanelScreen> {
  int _tab = 0;

  static const _titles = ['Pedidos', 'Produtos', 'Categorias', 'Atendimento', 'Blog'];

  Future<void> _logout() async {
    final confirmed = await AppFeedback.confirm(
      context,
      title: 'Sair do painel',
      message: 'Deseja sair da conta?',
      confirmLabel: 'Sair',
    );
    if (!confirmed || !mounted) return;
    await SessionController.logout();
    if (!mounted) return;
    Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const SplashScreen()), (route) => false);
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return ValueListenableBuilder<String?>(
      valueListenable: SessionController.employeeName,
      builder: (context, name, _) => Scaffold(
        appBar: AppBar(
          titleSpacing: 16,
          title: Row(
            children: [
              Image.asset(
                'assets/images/logo_vertical.png',
                height: 44,
                fit: BoxFit.contain,
                semanticLabel: 'Happy Snouts',
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_titles[_tab]),
                    Text(
                      'Painel da loja • ${(name ?? 'Funcionário').split(' ').first}',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: palette.muted),
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            ValueListenableBuilder<ThemeMode>(
              valueListenable: ThemeController.themeMode,
              builder: (context, mode, _) => IconButton(
                tooltip: mode == ThemeMode.dark ? 'Tema claro' : 'Tema escuro',
                onPressed: ThemeController.toggle,
                icon: Icon(mode == ThemeMode.dark ? Icons.light_mode_outlined : Icons.dark_mode_outlined),
              ),
            ),
            IconButton(tooltip: 'Sair', onPressed: _logout, icon: const Icon(Icons.logout_rounded)),
            const SizedBox(width: 4),
          ],
        ),
        body: IndexedStack(
          index: _tab,
          children: const [OrdersTab(), ProductsTab(), CategoriesTab(), MessagesTab(), BlogTab()],
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _tab,
          onDestinationSelected: (index) => setState(() => _tab = index),
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.receipt_long_outlined),
              selectedIcon: Icon(Icons.receipt_long_rounded),
              label: 'Pedidos',
            ),
            NavigationDestination(
              icon: Icon(Icons.inventory_2_outlined),
              selectedIcon: Icon(Icons.inventory_2_rounded),
              label: 'Produtos',
            ),
            NavigationDestination(
              icon: Icon(Icons.category_outlined),
              selectedIcon: Icon(Icons.category_rounded),
              label: 'Categorias',
            ),
            NavigationDestination(
              icon: Icon(Icons.support_agent_outlined),
              selectedIcon: Icon(Icons.support_agent_rounded),
              label: 'Atendimento',
            ),
            NavigationDestination(
              icon: Icon(Icons.article_outlined),
              selectedIcon: Icon(Icons.article_rounded),
              label: 'Blog',
            ),
          ],
        ),
      ),
    );
  }
}
