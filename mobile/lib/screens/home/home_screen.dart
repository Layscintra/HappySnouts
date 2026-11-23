import 'package:flutter/material.dart';
import 'package:happysnouts/models/blog_post.dart';
import 'package:happysnouts/models/care_event.dart';
import 'package:happysnouts/models/product.dart';
import 'package:happysnouts/screens/blog/blog_post_screen.dart';
import 'package:happysnouts/screens/blog/blog_screen.dart';
import 'package:happysnouts/screens/devices/devices_screen.dart';
import 'package:happysnouts/screens/orders/orders_screen.dart';
import 'package:happysnouts/screens/pets/calendar_screen.dart';
import 'package:happysnouts/screens/pets/my_pets_screen.dart';
import 'package:happysnouts/screens/profile/notifications_screen.dart';
import 'package:happysnouts/screens/profile/profile_screen.dart';
import 'package:happysnouts/screens/shop/cart_screen.dart';
import 'package:happysnouts/screens/shop/coupons_screen.dart';
import 'package:happysnouts/screens/shop/product_details_screen.dart';
import 'package:happysnouts/screens/shop/products_screen.dart';
import 'package:happysnouts/services/admin_service.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/blog_service.dart';
import 'package:happysnouts/services/care_event_service.dart';
import 'package:happysnouts/services/cart_controller.dart';
import 'package:happysnouts/services/catalog_service.dart';
import 'package:happysnouts/services/notification_service.dart';
import 'package:happysnouts/services/session_controller.dart';
import 'package:happysnouts/theme/app_colors.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/widgets/app_feedback.dart';
import 'package:happysnouts/widgets/app_ui.dart';
import 'package:happysnouts/widgets/async_views.dart';
import 'package:happysnouts/widgets/auto_carousel.dart';
import 'package:happysnouts/widgets/bottom_nav_bar.dart';
import 'package:happysnouts/widgets/category_icon.dart';
import 'package:happysnouts/widgets/photo_avatar.dart';
import 'package:happysnouts/widgets/product_card.dart';
import 'package:happysnouts/widgets/promo_banner.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with ReloadOnChange {
  late Future<List<Product>> _productsFuture;
  late Future<List<BlogPost>> _postsFuture;
  late Future<List<ProductCategory>> _categoriesFuture;
  late Future<List<CareEvent>> _careFuture;

  @override
  List<DataTopic> get reloadTopics => const [
    DataTopic.products,
    DataTopic.categories,
    DataTopic.blog,
    DataTopic.reminders,
  ];

  @override
  void initState() {
    super.initState();
    reload();
  }

  @override
  void reload() {
    _productsFuture = CatalogService.instance.getFeaturedProducts();
    _postsFuture = BlogService.instance.getPosts().then((posts) => posts.take(8).toList());
    _categoriesFuture = AdminService.instance.getCategories();
    _careFuture = CareEventService.instance.getUpcoming(days: 30);
  }

  void _open(Widget screen) => Navigator.push(context, MaterialPageRoute(builder: (_) => screen));

  void _addToCart(Product product) {
    CartController.add(product);
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        content: Text('${product.name} adicionado ao carrinho'),
        action: SnackBarAction(label: 'VER', onPressed: () => _open(const CartScreen())),
      ),
    );
  }

  Future<void> _refresh() async {
    setState(reload);
    NotificationService.instance.refresh();
    try {
      await Future.wait([_productsFuture, _postsFuture]);
    } catch (_) {
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      bottomNavigationBar: const AppBottomNavBar(currentIndex: 0),
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: _refresh,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.only(top: 8, bottom: 24),
            children: [
              _pad(_buildHeader()),
              const SizedBox(height: 16),
              _pad(_buildSearch()),
              const SizedBox(height: 18),
              _buildBanners(),
              const SizedBox(height: 22),
              _pad(_buildQuickActions()),
              const SizedBox(height: 18),
              _pad(_buildNextCare()),
              _buildCategories(),
              const SizedBox(height: 8),
              _pad(
                SectionTitle(
                  'Produtos em destaque',
                  actionLabel: 'Ver todos',
                  onAction: () => _open(const ProductsScreen()),
                ),
              ),
              const SizedBox(height: 12),
              _buildProducts(),
              const SizedBox(height: 24),
              _pad(
                SectionTitle(
                  'BlogSnouts',
                  subtitle: 'Dicas para o dia a dia com seu pet',
                  actionLabel: 'Ver blog',
                  onAction: () => _open(const BlogScreen()),
                ),
              ),
              const SizedBox(height: 12),
              _buildBlog(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _pad(Widget child) => Padding(padding: const EdgeInsets.symmetric(horizontal: 20), child: child);

  Widget _buildHeader() {
    final palette = context.palette;
    return ValueListenableBuilder(
      valueListenable: SessionController.currentUser,
      builder: (context, user, _) {
        final firstName = user?.name.split(' ').first ?? '';
        return Row(
          children: [
            GestureDetector(
              onTap: () => Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (_) => const ProfileScreen()),
                (r) => false,
              ),
              child: PhotoAvatar(imageUrl: user?.avatarUrl ?? '', radius: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    firstName.isEmpty ? 'Olá! 👋' : 'Olá, $firstName! 👋',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 20,
                      letterSpacing: -0.3,
                      color: palette.title,
                    ),
                  ),
                  Text('Como está seu pet hoje?', style: TextStyle(fontSize: 13, color: palette.muted)),
                ],
              ),
            ),
            ValueListenableBuilder<int>(
              valueListenable: NotificationService.instance.unreadCount,
              builder: (context, unread, _) => Material(
                color: palette.card,
                shape: CircleBorder(side: BorderSide(color: palette.border)),
                child: IconButton(
                  tooltip: 'Notificações',
                  onPressed: () => _open(const NotificationsScreen()),
                  icon: Badge(
                    isLabelVisible: unread > 0,
                    label: Text(unread > 9 ? '9+' : '$unread'),
                    child: Icon(Icons.notifications_none_rounded, color: palette.title),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildSearch() {
    final palette = context.palette;
    return Material(
      color: palette.card,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: palette.border),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => _open(const ProductsScreen()),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Icon(Icons.search_rounded, color: palette.accent),
              const SizedBox(width: 12),
              Expanded(
                child: Text('Buscar rações, brinquedos, coleiras...', style: TextStyle(color: palette.muted)),
              ),
              Icon(Icons.tune_rounded, color: palette.muted, size: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBanners() {
    final banners = [
      PromoBanner(
        tag: 'DESTAQUE DA SEMANA',
        title: 'Alimentador\nAutomático',
        subtitle: 'Horários e porções\npelo app',
        cta: 'Ver produtos',
        image: 'assets/images/upscalemedia-transformed-removebg-preview.png',
        colors: const [AppColors.orange, AppColors.orangeStrong],
        textColor: AppColors.navyDark,
        onTap: () => _open(const ProductsScreen()),
      ),
      PromoBanner(
        tag: 'SEGURANÇA',
        title: 'Coleira com\nGPS',
        subtitle: 'Saiba onde seu pet\nestá, sempre',
        cta: 'Conectar',
        image: 'assets/images/cachorro_pescocano.png',
        colors: const [AppColors.navy, AppColors.navyGradientEnd],
        onTap: () => Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (_) => const DevicesScreen()),
          (r) => false,
        ),
      ),
      PromoBanner(
        tag: 'BLOGSNOUTS',
        title: 'Dicas de quem\nentende de pet',
        subtitle: 'Saúde, comportamento\ne alimentação',
        cta: 'Ler agora',
        image: 'assets/images/dog _login1.png',
        colors: const [Color(0xFF2E9E7F), Color(0xFF1F6F5A)],
        onTap: () => _open(const BlogScreen()),
      ),
      PromoBanner(
        tag: 'CUPOM',
        title: 'Frete grátis\nna 1ª compra',
        subtitle: 'Use o cupom no\nfechamento do pedido',
        cta: 'Ver cupons',
        image: 'assets/images/gato_login.png',
        colors: const [Color(0xFF7B5CD6), Color(0xFF5A3FB0)],
        onTap: () => _open(const CouponsScreen()),
      ),
    ];
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth.clamp(0, 640).toDouble();
        return AutoCarousel(
          height: (width - 40) / 2.25,
          viewportFraction: ((width - 28) / constraints.maxWidth).clamp(0.5, 1.0),
          interval: const Duration(seconds: 5),
          itemCount: banners.length,
          itemBuilder: (context, index) =>
              Padding(padding: const EdgeInsets.symmetric(horizontal: 6), child: banners[index]),
        );
      },
    );
  }

  Widget _buildQuickActions() {
    final palette = context.palette;
    final actions = [
      (
        icon: Icons.pets_rounded,
        label: 'Meus pets',
        color: AppColors.orangeStrong,
        onTap: () => _open(const MyPetsScreen()),
      ),
      (
        icon: Icons.calendar_month_rounded,
        label: 'Agenda',
        color: AppColors.green,
        onTap: () => _open(const CalendarScreen()),
      ),
      (
        icon: Icons.receipt_long_rounded,
        label: 'Pedidos',
        color: AppColors.formBlue,
        onTap: () => _open(const OrdersScreen()),
      ),
      (
        icon: Icons.confirmation_number_rounded,
        label: 'Cupons',
        color: const Color(0xFF7B5CD6),
        onTap: () => _open(const CouponsScreen()),
      ),
    ];
    return Row(
      children: actions.map((a) {
        return Expanded(
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: a.onTap,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Column(
                children: [
                  Container(
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      color: palette.card,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: palette.border),
                      boxShadow: palette.shadow,
                    ),
                    child: Icon(a.icon, color: a.color, size: 26),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    a.label,
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: palette.text),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildNextCare() {
    return FutureBuilder<List<CareEvent>>(
      future: _careFuture,
      builder: (context, snapshot) {
        final events = snapshot.data ?? const [];
        if (events.isEmpty) return const SizedBox.shrink();
        final e = events.first;
        final palette = context.palette;
        final days = DateUtils.dateOnly(e.date).difference(DateUtils.dateOnly(DateTime.now())).inDays;
        final when = days == 0
            ? 'Hoje'
            : days == 1
            ? 'Amanhã'
            : 'Em $days dias';
        return Padding(
          padding: const EdgeInsets.only(bottom: 18),
          child: AppCard(
            onTap: () => _open(const CalendarScreen()),
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                IconBadge(icon: careTypeIcon(e.type), color: careTypeColor(e.type), size: 46),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Próximo cuidado • $when',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: palette.accent),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${e.title} do ${e.petName}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontWeight: FontWeight.w800, color: palette.title),
                      ),
                      Text('${e.type.label} às ${e.time}', style: TextStyle(fontSize: 12.5, color: palette.muted)),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right_rounded, color: palette.muted),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildCategories() {
    return FutureBuilder<List<ProductCategory>>(
      future: _categoriesFuture,
      builder: (context, snapshot) {
        final categories = snapshot.data ?? const [];
        if (categories.isEmpty) return const SizedBox.shrink();
        final palette = context.palette;
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _pad(const SectionTitle('Categorias')),
              const SizedBox(height: 10),
              SizedBox(
                height: 96,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: categories.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 14),
                  itemBuilder: (context, i) {
                    final c = categories[i];
                    return InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () => _open(ProductsScreen(initialQuery: c.name)),
                      child: SizedBox(
                        width: 70,
                        child: Column(
                          children: [
                            Container(
                              width: 62,
                              height: 62,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: AppColors.orange.withValues(alpha: palette.isDark ? 0.2 : 0.16),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: CategoryIcon(icon: c.icon, size: 30),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              c.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: palette.text),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildProducts() {
    return SizedBox(
      height: 250,
      child: FutureStateBuilder<List<Product>>(
        future: _productsFuture,
        onRetry: () => setState(reload),
        builder: (context, products) {
          if (products.isEmpty) {
            return const EmptyView(icon: Icons.storefront_outlined, title: 'Nenhum produto disponível no momento');
          }
          return ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
            itemCount: products.length,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final product = products[index];
              return SizedBox(
                width: 160,
                child: ProductCard(
                  product: product,
                  onTap: () => _open(ProductDetailsScreen(product: product)),
                  onAddTap: () => _addToCart(product),
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildBlog() {
    return SizedBox(
      height: 214,
      child: FutureStateBuilder<List<BlogPost>>(
        future: _postsFuture,
        onRetry: () => setState(reload),
        builder: (context, posts) {
          if (posts.isEmpty) return const EmptyView(icon: Icons.article_outlined, title: 'Nenhum post ainda');
          return ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
            itemCount: posts.length,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (context, index) => BlogPostCard(
              post: posts[index],
              onTap: () => _open(BlogPostScreen(post: posts[index])),
            ),
          );
        },
      ),
    );
  }
}

void showAddedToCart(BuildContext context, Product product) {
  AppFeedback.show(context, '${product.name} adicionado ao carrinho');
}
