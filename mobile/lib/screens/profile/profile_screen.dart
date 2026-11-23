import 'package:flutter/material.dart';
import 'package:happysnouts/models/order.dart';
import 'package:happysnouts/screens/auth/splash_screen.dart';
import 'package:happysnouts/screens/orders/orders_screen.dart';
import 'package:happysnouts/screens/pets/calendar_screen.dart';
import 'package:happysnouts/screens/pets/my_pets_screen.dart';
import 'package:happysnouts/screens/profile/account_details_screen.dart';
import 'package:happysnouts/screens/profile/addresses_screen.dart';
import 'package:happysnouts/screens/profile/payment_methods_screen.dart';
import 'package:happysnouts/screens/profile/settings_screen.dart';
import 'package:happysnouts/screens/shop/coupons_screen.dart';
import 'package:happysnouts/screens/shop/favorites_screen.dart';
import 'package:happysnouts/services/session_controller.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/app_ui.dart';
import 'package:happysnouts/widgets/bottom_nav_bar.dart';
import 'package:happysnouts/widgets/photo_avatar.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  Future<void> _logout(BuildContext context) async {
    final confirmed = await AppFeedback.confirm(
      context,
      title: 'Sair da conta',
      message: 'Deseja mesmo sair?',
      confirmLabel: 'Sair',
    );
    if (!confirmed || !context.mounted) return;
    await SessionController.logout();
    if (!context.mounted) return;
    Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const SplashScreen()), (route) => false);
  }

  void _open(BuildContext context, Widget screen) => Navigator.push(context, MaterialPageRoute(builder: (_) => screen));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      bottomNavigationBar: const AppBottomNavBar(currentIndex: 4),
      body: SingleChildScrollView(
        child: Column(
          children: [
            _buildHeader(context),
            Transform.translate(
              offset: const Offset(0, -28 - _fadeHeight),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  children: [
                    _buildOrdersCard(context),
                    const SizedBox(height: 16),
                    _buildMenuCard(context),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(foregroundColor: AppColors.red),
                        onPressed: () => _logout(context),
                        icon: const Icon(Icons.logout_rounded),
                        label: const Text('Sair da conta'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  static const double _fadeHeight = 140;

  Widget _buildHeader(BuildContext context) {
    final background = context.palette.background;
    return Stack(
      children: [
        const Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [AppColors.navyDark, AppColors.navy, AppColors.navyGradientEnd],
              ),
            ),
          ),
        ),
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          height: _fadeHeight,
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  background.withValues(alpha: 0),
                  background.withValues(alpha: 0.12),
                  background.withValues(alpha: 0.38),
                  background.withValues(alpha: 0.7),
                  background.withValues(alpha: 0.92),
                  background,
                ],
                stops: const [0, 0.2, 0.42, 0.65, 0.85, 1],
              ),
            ),
          ),
        ),
        Container(
          width: double.infinity,
          margin: const EdgeInsets.only(bottom: _fadeHeight),
          padding: EdgeInsets.fromLTRB(20, MediaQuery.paddingOf(context).top + 16, 20, 52),
          child: ValueListenableBuilder(
            valueListenable: SessionController.currentUser,
            builder: (context, user, _) {
              return InkWell(
                onTap: () => _open(context, const AccountDetailsScreen()),
                borderRadius: BorderRadius.circular(16),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(color: AppColors.orange, shape: BoxShape.circle),
                      child: PhotoAvatar(imageUrl: user?.avatarUrl ?? '', radius: 34),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.fullName.isNotEmpty == true ? user!.fullName : (user?.name ?? ''),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 19),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            user?.email ?? '',
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: Colors.white70, fontSize: 13),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.14),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Text(
                              'Editar perfil',
                              style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right_rounded, color: Colors.white70),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildOrdersCard(BuildContext context) {
    final palette = context.palette;
    const shortcuts = [
      (icon: Icons.inventory_2_outlined, filter: OrderFilter.emAndamento, color: AppColors.orangeStrong),
      (icon: Icons.local_shipping_outlined, filter: OrderFilter.aCaminho, color: Color(0xFF7B5CD6)),
      (icon: Icons.check_circle_outline_rounded, filter: OrderFilter.entregues, color: AppColors.green),
      (icon: Icons.cancel_outlined, filter: OrderFilter.cancelados, color: AppColors.red),
    ];
    return AppCard(
      // Topo mais justo: o botão "Ver todos" já dá altura à linha do título.
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: Column(
        children: [
          SectionTitle('Meus pedidos', actionLabel: 'Ver todos', onAction: () => _open(context, const OrdersScreen())),
          const SizedBox(height: 12),
          Row(
            children: shortcuts.map((item) {
              return Expanded(
                child: InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: () => _open(context, OrdersScreen(initialFilter: item.filter)),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Column(
                      children: [
                        IconBadge(icon: item.icon, color: item.color, size: 46),
                        const SizedBox(height: 8),
                        Text(
                          item.filter.label,
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: palette.text),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuCard(BuildContext context) {
    final palette = context.palette;
    final items = [
      (
        icon: Icons.pets_rounded,
        title: 'Meus pets',
        subtitle: 'Perfis, vacinas e saúde',
        color: AppColors.orangeStrong,
        screen: const MyPetsScreen() as Widget,
      ),
      (
        icon: Icons.location_on_outlined,
        title: 'Endereços',
        subtitle: 'Onde entregamos seus pedidos',
        color: AppColors.formBlue,
        screen: const AddressesScreen() as Widget,
      ),
      (
        icon: Icons.credit_card_rounded,
        title: 'Cartões',
        subtitle: 'Suas formas de pagamento',
        color: const Color(0xFFE0609A),
        screen: const PaymentMethodsScreen() as Widget,
      ),
      (
        icon: Icons.calendar_month_outlined,
        title: 'Calendário',
        subtitle: 'Vacinas, consultas e lembretes',
        color: AppColors.green,
        screen: const CalendarScreen() as Widget,
      ),
      (
        icon: Icons.favorite_border_rounded,
        title: 'Favoritos',
        subtitle: 'Produtos que você salvou',
        color: AppColors.red,
        screen: const FavoritesScreen() as Widget,
      ),
      (
        icon: Icons.confirmation_number_outlined,
        title: 'Cupons',
        subtitle: 'Descontos disponíveis',
        color: const Color(0xFF7B5CD6),
        screen: const CouponsScreen() as Widget,
      ),
      (
        icon: Icons.settings_outlined,
        title: 'Configurações',
        subtitle: 'Notificações, tema e ajuda',
        color: AppColors.navy,
        screen: const SettingsScreen() as Widget,
      ),
    ];
    return AppCard(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Column(
        children: [
          for (var i = 0; i < items.length; i++) ...[
            ListTile(
              leading: IconBadge(icon: items[i].icon, color: items[i].color, size: 40),
              title: Text(
                items[i].title,
                style: TextStyle(color: palette.text, fontWeight: FontWeight.w700, fontSize: 15),
              ),
              subtitle: Text(items[i].subtitle, style: TextStyle(color: palette.muted, fontSize: 12.5)),
              trailing: Icon(Icons.chevron_right_rounded, color: palette.muted),
              onTap: () => _open(context, items[i].screen),
            ),
            if (i < items.length - 1) Divider(indent: 72, endIndent: 16, color: palette.border),
          ],
        ],
      ),
    );
  }
}
