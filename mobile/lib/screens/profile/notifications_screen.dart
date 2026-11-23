import 'package:flutter/material.dart';
import 'package:happysnouts/models/app_notification.dart';
import 'package:happysnouts/models/care_event.dart';
import 'package:happysnouts/screens/blog/blog_screen.dart' show relativeTime;
import 'package:happysnouts/screens/orders/order_details_screen.dart';
import 'package:happysnouts/screens/orders/orders_screen.dart';
import 'package:happysnouts/screens/pets/calendar_screen.dart';
import 'package:happysnouts/screens/support/contact_screen.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/care_event_service.dart';
import 'package:happysnouts/services/notification_service.dart';
import 'package:happysnouts/services/preferences_service.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/utils/formatters.dart';
import 'package:happysnouts/widgets/app_ui.dart';
import 'package:happysnouts/widgets/async_views.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> with ReloadOnChange {
  late Future<List<CareEvent>> _future;

  @override
  List<DataTopic> get reloadTopics => const [DataTopic.reminders];

  @override
  void initState() {
    super.initState();
    reload();
    NotificationService.instance.refresh();
  }

  @override
  void reload() => _future = CareEventService.instance.getUpcoming(days: 7);

  Future<void> _refresh() async {
    setState(reload);
    await Future.wait([NotificationService.instance.refresh(), _future.catchError((_) => <CareEvent>[])]);
  }

  @override
  Widget build(BuildContext context) {
    final service = NotificationService.instance;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notificações'),
        actions: [
          ValueListenableBuilder<int>(
            valueListenable: service.unreadCount,
            builder: (context, unread, _) => unread == 0
                ? const SizedBox.shrink()
                : TextButton(onPressed: service.markAllRead, child: const Text('Marcar todas como lidas')),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: ValueListenableBuilder<List<AppNotification>>(
          valueListenable: service.items,
          builder: (context, notifications, _) {
            return FutureStateBuilder<List<CareEvent>>(
              future: _future,
              onRetry: () => setState(reload),
              builder: (context, events) => _buildList(notifications, events),
            );
          },
        ),
      ),
    );
  }

  Widget _buildList(List<AppNotification> notifications, List<CareEvent> events) {
    final palette = context.palette;
    if (notifications.isEmpty && events.isEmpty) {
      return ListView(
        children: const [
          SizedBox(height: 60),
          EmptyView(
            icon: Icons.notifications_none_rounded,
            title: 'Tudo em dia!',
            message:
                'Quando seu pedido mudar de etapa ou a equipe responder sua mensagem, o aviso aparece aqui e no seu celular.',
          ),
        ],
      );
    }
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: [
        if (!PreferencesService.instance.notificationsEnabled)
          const Padding(
            padding: EdgeInsets.only(bottom: 16),
            child: InfoBanner(
              icon: Icons.notifications_off_outlined,
              message: 'Os alertas no celular estão desativados em Configurações. Você continua vendo tudo aqui.',
            ),
          ),
        if (events.isNotEmpty) ...[
          const SectionTitle('Próximos cuidados', subtitle: 'Agendados para os próximos 7 dias'),
          const SizedBox(height: 10),
          ...events.map(
            (e) => _tile(
              icon: careTypeIcon(e.type),
              color: careTypeColor(e.type),
              title: '${e.title} • ${e.petName}',
              subtitle: '${_relativeDay(e.date)} às ${e.time}',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CalendarScreen())),
            ),
          ),
          const SizedBox(height: 18),
        ],
        if (notifications.isNotEmpty) ...[
          const SectionTitle('Avisos'),
          const SizedBox(height: 10),
          ...notifications.map(
            (n) => Dismissible(
              key: ValueKey('n${n.id}'),
              direction: DismissDirection.endToStart,
              background: Container(
                alignment: Alignment.centerRight,
                padding: const EdgeInsets.only(right: 20),
                margin: const EdgeInsets.only(bottom: 10),
                decoration: BoxDecoration(
                  color: AppColors.red.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(Icons.delete_outline_rounded, color: AppColors.red),
              ),
              onDismissed: (_) => NotificationService.instance.remove(n),
              child: _tile(
                icon: _iconFor(n.type),
                color: _colorFor(n.type),
                title: n.title,
                subtitle: '${n.message}\n${relativeTime(n.createdAt)}',
                unread: !n.read,
                onTap: () {
                  NotificationService.instance.markRead(n);
                  openNotification(Navigator.of(context), n.type, n.referenceId);
                },
              ),
            ),
          ),
        ],
        const SizedBox(height: 8),
        Text(
          'Deslize um aviso para a esquerda para apagar.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 12, color: palette.muted),
        ),
      ],
    );
  }

  String _relativeDay(DateTime date) {
    final today = DateUtils.dateOnly(DateTime.now());
    final diff = DateUtils.dateOnly(date).difference(today).inDays;
    if (diff == 0) return 'Hoje';
    if (diff == 1) return 'Amanhã';
    return Formatters.date(date);
  }

  static IconData _iconFor(String type) {
    switch (type) {
      case 'pedido':
        return Icons.local_shipping_outlined;
      case 'contato':
        return Icons.support_agent_rounded;
      default:
        return Icons.notifications_none_rounded;
    }
  }

  static Color _colorFor(String type) {
    switch (type) {
      case 'pedido':
        return AppColors.orangeStrong;
      case 'contato':
        return AppColors.green;
      default:
        return AppColors.navy;
    }
  }

  Widget _tile({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    bool unread = false,
  }) {
    final palette = context.palette;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: AppCard(
        onTap: onTap,
        padding: const EdgeInsets.all(14),
        color: unread ? (palette.isDark ? AppColors.darkSurfaceHigh : const Color(0xFFFFFAF2)) : null,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            IconBadge(icon: icon, color: color, size: 42),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontWeight: unread ? FontWeight.w800 : FontWeight.w700,
                      fontSize: 14,
                      color: palette.text,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(subtitle, style: TextStyle(fontSize: 12.5, height: 1.4, color: palette.muted)),
                ],
              ),
            ),
            if (unread)
              Container(
                width: 9,
                height: 9,
                margin: const EdgeInsets.only(left: 8, top: 4),
                decoration: const BoxDecoration(color: AppColors.orangeStrong, shape: BoxShape.circle),
              ),
          ],
        ),
      ),
    );
  }
}

void openNotificationPayload(NavigatorState navigator, String payload) {
  final parts = payload.split(':');
  openNotification(navigator, parts.first, parts.length > 1 ? int.tryParse(parts[1]) : null);
}

void openNotification(NavigatorState navigator, String type, int? referenceId) {
  switch (type) {
    case 'pedido':
      navigator.push(
        MaterialPageRoute(
          builder: (_) => referenceId == null ? const OrdersScreen() : OrderDetailsScreen(orderId: '$referenceId'),
        ),
      );
    case 'contato':
      navigator.push(MaterialPageRoute(builder: (_) => const ContactScreen(showMessages: true)));
    case 'lembrete':
      navigator.push(MaterialPageRoute(builder: (_) => const CalendarScreen()));
    default:
      navigator.push(MaterialPageRoute(builder: (_) => const NotificationsScreen()));
  }
}
