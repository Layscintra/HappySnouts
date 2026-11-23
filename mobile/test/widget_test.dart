import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:happysnouts/main.dart';
import 'package:happysnouts/models/pet.dart';
import 'package:happysnouts/screens/auth/forgot_password_screen.dart';
import 'package:happysnouts/screens/auth/login_screen.dart';
import 'package:happysnouts/screens/auth/signup_screen.dart';
import 'package:happysnouts/screens/auth/splash_screen.dart';
import 'package:happysnouts/screens/blog/blog_screen.dart';
import 'package:happysnouts/screens/devices/devices_screen.dart';
import 'package:happysnouts/screens/devices/feeding_screen.dart';
import 'package:happysnouts/screens/devices/tracker_screen.dart';
import 'package:happysnouts/screens/employee/employee_panel_screen.dart';
import 'package:happysnouts/screens/home/home_screen.dart';
import 'package:happysnouts/screens/orders/orders_screen.dart';
import 'package:happysnouts/screens/pets/calendar_screen.dart';
import 'package:happysnouts/screens/pets/my_pets_screen.dart';
import 'package:happysnouts/screens/pets/pet_form_screen.dart';
import 'package:happysnouts/screens/profile/account_details_screen.dart';
import 'package:happysnouts/screens/profile/addresses_screen.dart';
import 'package:happysnouts/screens/profile/notifications_screen.dart';
import 'package:happysnouts/screens/profile/payment_methods_screen.dart';
import 'package:happysnouts/screens/profile/profile_screen.dart';
import 'package:happysnouts/screens/profile/settings_screen.dart';
import 'package:happysnouts/screens/shop/cart_screen.dart';
import 'package:happysnouts/screens/shop/coupons_screen.dart';
import 'package:happysnouts/screens/shop/favorites_screen.dart';
import 'package:happysnouts/screens/shop/products_screen.dart';
import 'package:happysnouts/screens/support/contact_screen.dart';
import 'package:happysnouts/services/cart_controller.dart';
import 'package:happysnouts/services/session_controller.dart';
import 'package:happysnouts/theme/app_theme.dart';
import 'package:happysnouts/widgets/auth_scaffold.dart';

import 'fake_backend.dart';
import 'test_helpers.dart';

void main() {
  setUp(() async {
    await setUpTestEnvironment();
  });

  testWidgets('App sem sessão abre na tela de boas-vindas', (tester) async {
    await tester.pumpWidget(const HappySnoutsApp());
    await tester.pumpAndSettle();
    expect(find.byType(SplashScreen), findsOneWidget);
    expect(find.text('Me cadastrar'), findsOneWidget);
    expect(find.textContaining('Entrar agora', findRichText: true), findsOneWidget);
  });

  testWidgets('App com sessão salva abre direto na Home', (tester) async {
    await loginTestUser();
    await tester.pumpWidget(const HappySnoutsApp());
    await tester.pumpAndSettle();
    expect(find.byType(HomeScreen), findsOneWidget);
  });

  group('Login', () {
    testWidgets('não entra com campos vazios', (tester) async {
      await pumpScreen(tester, const LoginScreen());
      await tester.tap(find.text('Entrar'));
      await tester.pumpAndSettle();
      expect(find.text('Campo obrigatório'), findsOneWidget);
      expect(find.text('Digite sua senha'), findsOneWidget);
      expect(find.byType(HomeScreen), findsNothing);
    });

    testWidgets('não entra com senha errada', (tester) async {
      await pumpScreen(tester, const LoginScreen());
      await tester.enterText(find.byType(TextFormField).at(0), FakeBackend.email);
      await tester.enterText(find.byType(TextFormField).at(1), 'senhaerrada');
      await tester.tap(find.text('Entrar'));
      await tester.pumpAndSettle();
      expect(find.text('E-mail ou senha incorretos.'), findsOneWidget);
      expect(find.byType(HomeScreen), findsNothing);
      expect(SessionController.isLoggedIn, isFalse);
    });

    testWidgets('entra com a conta correta e vai para a Home', (tester) async {
      await pumpScreen(tester, const LoginScreen());
      await tester.enterText(find.byType(TextFormField).at(0), FakeBackend.email);
      await tester.enterText(find.byType(TextFormField).at(1), FakeBackend.password);
      await tester.tap(find.text('Entrar'));
      await tester.pumpAndSettle();
      expect(find.byType(HomeScreen), findsOneWidget);
      expect(SessionController.isLoggedIn, isTrue);
    });
  });

  testWidgets('Cadastro valida CPF e senhas diferentes', (tester) async {
    await pumpScreen(tester, const SignupScreen(), size: const Size(400, 1400));
    final fields = find.byType(TextFormField);
    await tester.enterText(fields.at(0), 'Ana Paula');
    await tester.enterText(fields.at(1), 'ana');
    await tester.enterText(fields.at(3), '111.111.111-11');
    await tester.enterText(fields.at(7), 'senha123');
    await tester.enterText(fields.at(8), 'outra123');
    await tester.tap(find.text('CONTINUAR'));
    await tester.pumpAndSettle();
    expect(find.text('CPF inválido'), findsOneWidget);
    expect(find.text('As senhas não coincidem'), findsOneWidget);
  });

  testWidgets('Adicionar na Home atualiza o carrinho compartilhado', (tester) async {
    await loginTestUser();
    await pumpScreen(tester, const HomeScreen(), size: const Size(400, 2000));
    await tester.tap(find.bySemanticsLabel(RegExp('^Adicionar .* ao carrinho')).first);
    await tester.pumpAndSettle();
    expect(CartController.itemCount, 1);

    await pumpScreen(tester, const CartScreen());
    expect(find.text('Seu carrinho está vazio'), findsNothing);
    expect(find.text('Finalizar compra'), findsOneWidget);
  });

  testWidgets('Busca de produtos filtra a lista', (tester) async {
    await pumpScreen(tester, const ProductsScreen());
    expect(find.text('Coleira Rastreadora de Couro'), findsOneWidget);
    await tester.enterText(find.byType(TextField), 'pelúcia');
    await tester.pump(const Duration(milliseconds: 400));
    await tester.pumpAndSettle();
    expect(find.text('Pelúcia Cachorrinho Soneca'), findsOneWidget);
    expect(find.text('Coleira Rastreadora de Couro'), findsNothing);
  });

  testWidgets('Fluxo de compra completo registra o pedido e esvazia o carrinho', (tester) async {
    await loginTestUser();
    await pumpScreen(tester, const ProductsScreen());
    await tester.tap(find.text('Coleira Rastreadora de Couro'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Comprar agora'));
    await tester.tap(find.text('Comprar agora'));
    await tester.pumpAndSettle();
    expect(find.byType(CartScreen), findsOneWidget);
    await tester.tap(find.text('Finalizar compra'));
    await tester.pumpAndSettle();
    await tester.tap(find.textContaining('Confirmar pedido'));
    await tester.pumpAndSettle();
    expect(find.textContaining('recebido!'), findsOneWidget);
    expect(find.text('Acompanhe seu pedido'), findsOneWidget);
    expect(CartController.items.value, isEmpty);
  });

  testWidgets('Finalizar compra oferece Pix, crédito, débito e boleto', (tester) async {
    await loginTestUser();
    await pumpScreen(tester, const ProductsScreen());
    await tester.tap(find.text('Coleira Rastreadora de Couro'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Comprar agora'));
    await tester.tap(find.text('Comprar agora'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Finalizar compra'));
    await tester.pumpAndSettle();

    expect(find.text('Pix'), findsOneWidget);
    expect(find.text('Boleto'), findsOneWidget);
    expect(find.text('Pagamento via Pix'), findsOneWidget);
    expect(find.text('Cartão de débito'), findsOneWidget);
    expect(find.text('Qual cartão usar no crédito?'), findsNothing);

    await tester.ensureVisible(find.text('Cartão de crédito'));
    await tester.tap(find.text('Cartão de crédito'));
    await tester.pumpAndSettle();
    expect(find.text('Qual cartão usar no crédito?'), findsOneWidget);
    expect(find.text('Parcelas'), findsOneWidget);

    await tester.ensureVisible(find.text('Cartão de débito'));
    await tester.tap(find.text('Cartão de débito'));
    await tester.pumpAndSettle();
    expect(find.text('Qual cartão usar no débito?'), findsOneWidget);
    expect(find.text('Parcelas'), findsNothing);
    expect(find.text('Pagamento via Cartão de débito • à vista'), findsOneWidget);

    await tester.ensureVisible(find.text('Boleto'));
    await tester.tap(find.text('Boleto'));
    await tester.pumpAndSettle();
    await tester.tap(find.textContaining('Confirmar pedido'));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(find.textContaining('Boleto'), 200, scrollable: find.byType(Scrollable).first);
    expect(find.textContaining('Boleto'), findsWidgets);
    expect(find.text('Aguardando pagamento'), findsOneWidget);
  });

  testWidgets('Pedido no Pix mostra o copia e cola e o status', (tester) async {
    await loginTestUser();
    await pumpScreen(tester, const ProductsScreen());
    await tester.tap(find.text('Coleira Rastreadora de Couro'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Comprar agora'));
    await tester.tap(find.text('Comprar agora'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Finalizar compra'));
    await tester.pumpAndSettle();
    await tester.tap(find.textContaining('Confirmar pedido'));
    await tester.pumpAndSettle();

    await tester.scrollUntilVisible(find.text('Copiar código Pix'), 200, scrollable: find.byType(Scrollable).first);
    expect(find.text('Aguardando pagamento'), findsOneWidget);
    expect(find.text('Pix copia e cola'), findsOneWidget);
  });

  testWidgets('Dispositivos lista a coleira e o vazio manda conectar', (tester) async {
    await loginTestUser();
    await pumpScreen(tester, const DevicesScreen());
    expect(find.text('Coleira rastreadora'), findsOneWidget);
    expect(find.textContaining('Thor'), findsOneWidget);

    await tester.pumpWidget(const SizedBox()); // descarta a tela anterior
    final backend = await setUpTestEnvironment();
    for (final pet in backend.pets) {
      pet['id_coleira'] = null;
    }
    await loginTestUser();
    await pumpScreen(tester, const DevicesScreen());
    expect(find.text('Nenhum dispositivo conectado'), findsOneWidget);
    expect(find.text('Conectar dispositivo'), findsOneWidget);
  });

  testWidgets('Funcionário entra pelo mesmo login e cai direto no painel', (tester) async {
    await pumpScreen(tester, const LoginScreen());
    expect(find.text('Sou funcionário'), findsNothing);
    await tester.enterText(find.byType(TextFormField).at(0), FakeBackend.employeeEmail);
    await tester.enterText(find.byType(TextFormField).at(1), 'admin123');
    await tester.tap(find.text('Entrar'));
    await tester.pumpAndSettle();
    expect(find.byType(EmployeePanelScreen), findsOneWidget);
    expect(find.textContaining('Ana'), findsWidgets);
    expect(find.text('Novos'), findsOneWidget);

    await tester.tap(find.text('Produtos').last);
    await tester.pumpAndSettle();
    expect(find.text('Coleira Rastreadora de Couro'), findsOneWidget);

    await tester.tap(find.text('Categorias').last);
    await tester.pumpAndSettle();
    expect(find.text('Higiene'), findsOneWidget);
  });

  testWidgets('Esqueci a senha: código por e-mail e nova senha', (tester) async {
    await pumpScreen(tester, const ForgotPasswordScreen(initialEmail: FakeBackend.email), size: const Size(400, 1000));
    await tester.tap(find.text('Enviar código'));
    await tester.pumpAndSettle();
    expect(find.text('Digite o código'), findsOneWidget);
    // as 6 caixinhas confirmam sozinhas quando o código fica completo
    await tester.enterText(find.descendant(of: find.byType(OtpCodeField), matching: find.byType(TextField)), '123456');
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextFormField).at(0), 'novaSenha1');
    await tester.enterText(find.byType(TextFormField).at(1), 'novaSenha1');
    await tester.tap(find.text('Salvar nova senha'));
    await tester.pumpAndSettle();
    expect(find.text('Senha alterada!'), findsOneWidget);
    // Para o timer de "reenviar código".
    await tester.pumpWidget(const SizedBox());
  });

  testWidgets('Perfil mostra Endereços no lugar de Alimentação', (tester) async {
    await loginTestUser();
    await pumpScreen(tester, const ProfileScreen(), size: const Size(400, 1200));
    expect(find.text('Endereços'), findsOneWidget);
    expect(find.text('Alimentação'), findsNothing);
  });

  group('Dispositivos inteligentes', () {
    const zoe = Pet(id: '1', name: 'zoe', breed: 'viralata', collarId: '24673914');

    // O rastreador tem timers e animações contínuas (pino pulsando), então
    // não dá para usar pumpAndSettle: avança o relógio em passos fixos.
    Future<void> pumpTracker(WidgetTester tester, {bool dark = false, Size size = const Size(320, 568)}) async {
      tester.view.physicalSize = size;
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.light(),
          darkTheme: AppTheme.dark(),
          themeMode: dark ? ThemeMode.dark : ThemeMode.light,
          home: const TrackerScreen(pet: zoe),
        ),
      );
      await tester.pump(const Duration(seconds: 1));
    }

    Future<void> tapAndWait(WidgetTester tester, Finder finder) async {
      await tester.ensureVisible(finder);
      await tester.pump();
      await tester.tap(finder);
      await tester.pump(const Duration(milliseconds: 800));
    }

    testWidgets('Card da coleira mostra nome, raça, bateria e número', (tester) async {
      await loginTestUser();
      await pumpTracker(tester, size: const Size(400, 900));
      expect(find.text('Zoe'), findsNWidgets(2)); // card do pet + etiqueta do pino no mapa
      expect(find.text('Vira-lata'), findsOneWidget);
      expect(find.text('Online'), findsOneWidget);
      expect(find.text('75%'), findsOneWidget);
      expect(find.text('24673914'), findsOneWidget);
      expect(find.text('R. Analândia'), findsOneWidget);
      await tester.pumpWidget(const SizedBox()); // para os timers
    });

    for (final dark in [false, true]) {
      testWidgets('Rastreador GPS: as três abas renderizam em tela pequena (${dark ? 'escuro' : 'claro'})', (
        tester,
      ) async {
        await loginTestUser();
        await pumpTracker(tester, dark: dark);
        await tapAndWait(tester, find.text('Relatórios & Saúde'));
        expect(find.text('Tempo Ativo'), findsOneWidget);
        expect(find.text('Distância'), findsOneWidget);
        expect(find.text('Calorias'), findsOneWidget);
        expect(find.text('Eventos recentes'), findsOneWidget);
        await tapAndWait(tester, find.text('Semanal'));
        expect(find.text('Resumo da semana'), findsOneWidget);
        await tapAndWait(tester, find.text('Rotas'));
        expect(find.text('Linha do tempo'), findsOneWidget);
        final error = tester.takeException();
        expect(error, isNull, reason: error is FlutterError ? error.toStringDeep() : '$error');
        await tester.pumpWidget(const SizedBox());
      });
    }

    testWidgets('Comedouro: abas, conexão, liberar porção e modal de horário', (tester) async {
      await loginTestUser();
      await pumpScreen(tester, const FeedingScreen(), size: const Size(400, 2600));
      expect(find.text('Liberar Porção Agora'), findsOneWidget);
      expect(find.text('08:00'), findsOneWidget);
      expect(find.text('Próxima refeição'), findsOneWidget);

      // Simula desconectar e reconectar.
      await tester.tap(find.byType(Switch).first); // "Simular conexão do aparelho"
      await tester.pumpAndSettle();
      expect(find.text('Desconectado'), findsOneWidget);
      expect(find.text('Conecte o comedouro para liberar'), findsOneWidget);
      await tester.tap(find.byType(Switch).first);
      await tester.pumpAndSettle();
      expect(find.text('Conectado'), findsOneWidget);

      // Liberar uma porção aparece na hora no relatório.
      await tester.tap(find.text('Relatórios & Consumo'));
      await tester.pumpAndSettle();
      expect(find.text('Total Consumido'), findsOneWidget);
      expect(find.text('Média Diária'), findsOneWidget);
      expect(find.text('Refeições Entregues'), findsOneWidget);
      expect(find.text('Porção extra'), findsNothing);
      await tester.tap(find.text('Liberar Porção Agora'));
      await tester.pump(const Duration(milliseconds: 1300));
      await tester.pump();
      expect(find.text('Porção liberada! (90 g)'), findsOneWidget);
      expect(find.text('74%'), findsOneWidget); // 1560 g - 90 g de 2000 g
      expect(find.text('Porção extra'), findsOneWidget);
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // "+ Adicionar" abre o formulário de horário.
      await tester.tap(find.text('Agendamentos'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Adicionar'));
      await tester.pumpAndSettle();
      expect(find.text('Nova refeição'), findsOneWidget);
    });

    for (final dark in [false, true]) {
      testWidgets('Comedouro: relatório renderiza em tela pequena (${dark ? 'escuro' : 'claro'})', (tester) async {
        await loginTestUser();
        await pumpScreen(tester, const FeedingScreen(), dark: dark, size: const Size(320, 568));
        await tester.tap(find.text('Relatórios & Consumo'));
        await tester.pumpAndSettle();
        await tester.scrollUntilVisible(find.text('Semanal'), 200, scrollable: find.byType(Scrollable).first);
        await tester.ensureVisible(find.text('Semanal'));
        await tester.pumpAndSettle();
        await tester.tap(find.text('Semanal'));
        await tester.pumpAndSettle();
        expect(find.text('Resumo da semana'), findsOneWidget);
        await tester.scrollUntilVisible(find.text('Últimas refeições'), 200, scrollable: find.byType(Scrollable).first);
        await tester.pumpAndSettle();
        final error = tester.takeException();
        expect(error, isNull, reason: error is FlutterError ? error.toStringDeep() : '$error');
      });
    }
  });

  // Abre cada tela principal nos dois temas e numa tela pequena (320x568,
  // tamanho de um iPhone SE) para pegar overflow e erros de renderização.
  final screens = <String, Widget Function()>{
    'Splash': () => const SplashScreen(),
    'Login': () => const LoginScreen(),
    'Home': () => const HomeScreen(),
    'Produtos': () => const ProductsScreen(),
    'Carrinho': () => const CartScreen(),
    'Perfil': () => const ProfileScreen(),
    'Configurações': () => const SettingsScreen(),
    'Meus Dados': () => const AccountDetailsScreen(),
    'Endereços': () => const AddressesScreen(),
    'Pagamentos': () => const PaymentMethodsScreen(),
    'Favoritos': () => const FavoritesScreen(),
    'Meus Pets': () => const MyPetsScreen(),
    'Cadastro de pet': () => const PetFormScreen(),
    'Calendário': () => const CalendarScreen(),
    'Alimentação': () => const FeedingScreen(),
    'Dispositivos': () => const DevicesScreen(),
    'Pedidos': () => const OrdersScreen(),
    'Notificações': () => const NotificationsScreen(),
    'Cupons': () => const CouponsScreen(),
    'Blog': () => const BlogScreen(),
    'Fale conosco': () => const ContactScreen(),
    'Esqueci a senha': () => const ForgotPasswordScreen(),
    'Painel do funcionário': () => const EmployeePanelScreen(),
  };

  for (final dark in [false, true]) {
    for (final entry in screens.entries) {
      testWidgets('${entry.key} renderiza sem erros em tela pequena (${dark ? 'escuro' : 'claro'})', (tester) async {
        await loginTestUser();
        await pumpScreen(tester, entry.value(), dark: dark, size: const Size(320, 568));
        final error = tester.takeException();
        expect(error, isNull, reason: error is FlutterError ? error.toStringDeep() : '$error');
      });
    }
  }
}
