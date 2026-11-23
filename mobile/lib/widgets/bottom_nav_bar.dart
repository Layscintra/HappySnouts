import 'package:flutter/material.dart';
import 'package:happysnouts/screens/blog/blog_screen.dart';
import 'package:happysnouts/screens/devices/devices_screen.dart';
import 'package:happysnouts/screens/home/home_screen.dart';
import 'package:happysnouts/screens/profile/profile_screen.dart';
import 'package:happysnouts/screens/shop/cart_screen.dart';
import 'package:happysnouts/services/cart_controller.dart';

/// Barra inferior de navegação entre as 5 abas principais.
/// [currentIndex] = -1 quando a tela atual não é uma das abas (ex.: Produtos).
class AppBottomNavBar extends StatelessWidget {
  final int currentIndex;

  const AppBottomNavBar({super.key, required this.currentIndex});

  static const _tabs = [
    (icon: Icons.home_outlined, selected: Icons.home_rounded, label: 'Início'),
    (icon: Icons.devices_other_outlined, selected: Icons.devices_other_rounded, label: 'Dispositivos'),
    (icon: Icons.shopping_bag_outlined, selected: Icons.shopping_bag_rounded, label: 'Carrinho'),
    (icon: Icons.article_outlined, selected: Icons.article_rounded, label: 'Blog'),
    (icon: Icons.person_outline_rounded, selected: Icons.person_rounded, label: 'Perfil'),
  ];

  Widget _screenFor(int index) {
    switch (index) {
      case 1:
        return const DevicesScreen();
      case 2:
        return const CartScreen();
      case 3:
        return const BlogScreen();
      case 4:
        return const ProfileScreen();
      default:
        return const HomeScreen();
    }
  }

  void _onTap(BuildContext context, int index) {
    if (index == currentIndex) return;
    // Cada aba substitui toda a pilha: o "voltar" do Android não fica
    // pulando entre abas visitadas.
    Navigator.pushAndRemoveUntil(
      context,
      PageRouteBuilder(
        pageBuilder: (_, _, _) => _screenFor(index),
        transitionDuration: const Duration(milliseconds: 160),
        reverseTransitionDuration: Duration.zero,
        transitionsBuilder: (_, animation, _, child) => FadeTransition(opacity: animation, child: child),
      ),
      (route) => false,
    );
  }

  Widget _cartIcon(IconData icon) {
    return ValueListenableBuilder(
      valueListenable: CartController.items,
      builder: (context, _, child) {
        final count = CartController.itemCount;
        return Badge(
          isLabelVisible: count > 0,
          label: Text(count > 99 ? '99+' : '$count', style: const TextStyle(fontWeight: FontWeight.w800)),
          child: child,
        );
      },
      child: Icon(icon),
    );
  }

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, -2)),
        ],
      ),
      child: NavigationBar(
        // -1 (tela fora das abas): nenhuma fica marcada.
        selectedIndex: currentIndex < 0 ? 0 : currentIndex,
        indicatorColor: currentIndex < 0 ? Colors.transparent : null,
        onDestinationSelected: (index) => _onTap(context, index),
        destinations: [
          for (var i = 0; i < _tabs.length; i++)
            NavigationDestination(
              tooltip: _tabs[i].label,
              label: _tabs[i].label,
              icon: i == 2 ? _cartIcon(_tabs[i].icon) : Icon(_tabs[i].icon),
              selectedIcon: i == 2 ? _cartIcon(_tabs[i].selected) : Icon(_tabs[i].selected),
            ),
        ],
      ),
    );
  }
}
