import 'package:flutter/material.dart';
import 'package:happysnouts/screens/profile/about_screen.dart';
import 'package:happysnouts/screens/support/contact_screen.dart';
import 'package:happysnouts/screens/support/help_center_screen.dart';
import 'package:happysnouts/services/preferences_service.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/theme/theme_controller.dart';
import 'package:happysnouts/widgets/section_card.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _prefs = PreferencesService.instance;
  late bool _notificationsEnabled = _prefs.notificationsEnabled;
  late bool _offersEnabled = _prefs.offersEnabled;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Configurações')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _buildSectionLabel('Configuração'),
          SectionCard(
            children: [
              _buildSwitchRow(
                Icons.notifications_outlined,
                'Notificações',
                'Lembretes de cuidados e pedidos',
                _notificationsEnabled,
                (value) {
                  setState(() => _notificationsEnabled = value);
                  _prefs.setNotificationsEnabled(value);
                },
              ),
              _buildSwitchRow(Icons.campaign_outlined, 'Receber Ofertas', 'Promoções e cupons', _offersEnabled, (
                value,
              ) {
                setState(() => _offersEnabled = value);
                _prefs.setOffersEnabled(value);
              }),
              _buildThemeSwitchRow(),
              ListTile(
                leading: Icon(Icons.translate, color: context.palette.title),
                title: Text('Idioma', style: _rowStyle),
                trailing: Text('Português (Brasil)', style: TextStyle(color: context.palette.muted, fontSize: 12)),
                subtitle: Text(
                  'Único idioma disponível nesta versão',
                  style: TextStyle(color: context.palette.muted, fontSize: 11),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _buildSectionLabel('Suporte'),
          SectionCard(
            children: [
              _buildNavRow(Icons.help_outline, 'Central de Ajuda', const HelpCenterScreen()),
              _buildNavRow(Icons.mail_outline, 'Fale conosco', const ContactScreen()),
              _buildNavRow(Icons.info_outline, 'Sobre o aplicativo', const AboutScreen()),
            ],
          ),
        ],
      ),
    );
  }

  TextStyle get _rowStyle => TextStyle(color: context.palette.title, fontWeight: FontWeight.w600, fontSize: 14);

  Widget _buildSectionLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 4),
      child: Text(
        label,
        style: TextStyle(color: context.palette.title, fontWeight: FontWeight.bold, fontSize: 15),
      ),
    );
  }

  Widget _buildNavRow(IconData icon, String label, Widget destination) {
    return ListTile(
      leading: Icon(icon, color: context.palette.title),
      title: Text(label, style: _rowStyle),
      trailing: Icon(Icons.chevron_right, color: context.palette.title),
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => destination)),
    );
  }

  Widget _buildSwitchRow(IconData icon, String label, String subtitle, bool value, ValueChanged<bool> onChanged) {
    return SwitchListTile(
      secondary: Icon(icon, color: context.palette.title),
      title: Text(label, style: _rowStyle),
      subtitle: Text(subtitle, style: TextStyle(fontSize: 12, color: context.palette.muted)),
      value: value,
      onChanged: onChanged,
    );
  }

  Widget _buildThemeSwitchRow() {
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: ThemeController.themeMode,
      builder: (context, mode, _) {
        final isDark = mode == ThemeMode.dark;
        return SwitchListTile(
          secondary: Icon(isDark ? Icons.nightlight_round : Icons.wb_sunny_outlined, color: context.palette.title),
          title: Text('Tema do Aplicativo', style: _rowStyle),
          subtitle: Text(isDark ? 'Escuro' : 'Claro', style: TextStyle(fontSize: 12, color: context.palette.muted)),
          value: isDark,
          onChanged: (_) => ThemeController.toggle(),
        );
      },
    );
  }
}
