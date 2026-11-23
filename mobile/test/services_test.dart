import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:happysnouts/models/address.dart';
import 'package:happysnouts/models/care_event.dart';
import 'package:happysnouts/models/feeder.dart';
import 'package:happysnouts/models/order.dart';
import 'package:happysnouts/models/pet.dart';
import 'package:happysnouts/models/picked_photo.dart';
import 'package:happysnouts/services/address_service.dart';
import 'package:happysnouts/services/admin_service.dart';
import 'package:happysnouts/services/api_client.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/auth_service.dart';
import 'package:happysnouts/services/blog_service.dart';
import 'package:happysnouts/services/care_event_service.dart';
import 'package:happysnouts/services/cart_controller.dart';
import 'package:happysnouts/services/catalog_service.dart';
import 'package:happysnouts/services/coupon_service.dart';
import 'package:happysnouts/services/favorites_controller.dart';
import 'package:happysnouts/services/notification_service.dart';
import 'package:happysnouts/services/order_service.dart';
import 'package:happysnouts/services/payment_service.dart';
import 'package:happysnouts/services/pet_service.dart';
import 'package:happysnouts/services/preferences_service.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/services/session_controller.dart';
import 'package:happysnouts/services/support_service.dart';

import 'fake_backend.dart';
import 'test_helpers.dart';

void main() {
  late FakeBackend backend;
  final photo = PickedPhoto(bytes: Uint8List.fromList([1, 2, 3]), fileName: 'foto.jpg', mimeType: 'image/jpeg');

  setUp(() async {
    backend = await setUpTestEnvironment();
  });

  Future<void> cartAdd(String id, {int quantity = 1}) async {
    final product = (await CatalogService.instance.getProducts()).firstWhere((p) => p.id == id);
    await CartController.add(product, quantity: quantity);
  }

  group('Autenticação', () {
    test('rejeita senha incorreta e e-mail desconhecido com a mesma mensagem', () async {
      for (final email in [FakeBackend.email, 'ninguem@exemplo.com']) {
        await expectLater(
          SessionController.login(email, 'errada'),
          throwsA(isA<ServiceException>().having((e) => e.message, 'message', 'E-mail ou senha incorretos.')),
        );
      }
      expect(SessionController.isLoggedIn, isFalse);
    });

    test('login guarda o token, carrega o perfil, carrinho e favoritos', () async {
      await loginTestUser();
      final user = SessionController.currentUser.value!;
      expect(user.id, '1');
      expect(user.name, 'Lays Silva');
      expect(user.phone, '(11) 9 9999-9999');
      expect(user.birthDate, isNotEmpty);
      expect(PreferencesService.instance.sessionToken, isNotNull);
      expect(FavoritesController.productIds.value, {'1'});
    });

    test('sessão salva é reaberta e logout limpa tudo', () async {
      await loginTestUser();
      await cartAdd('2');
      ApiClient.instance.token = null;
      SessionController.currentUser.value = null;

      await SessionController.restore();
      expect(SessionController.currentUser.value?.email, FakeBackend.email);
      expect(CartController.itemCount, 1);

      await SessionController.logout();
      expect(SessionController.isLoggedIn, isFalse);
      expect(CartController.items.value, isEmpty);
      expect(PreferencesService.instance.sessionToken, isNull);
    });

    test('token vencido não reabre a sessão', () async {
      await PreferencesService.instance.setSessionToken(
        FakeBackend.tokenFor(backend.users.first, validFor: const Duration(hours: -1)),
      );
      await SessionController.restore();
      expect(SessionController.isLoggedIn, isFalse);
      expect(PreferencesService.instance.sessionToken, isNull);
    });

    test('cadastro envia CPF/telefone só com dígitos, entra e salva o endereço', () async {
      final data = RegistrationData(
        fullName: 'Maria Souza Lima',
        username: 'maria',
        birthDate: '01/01/2000',
        cpf: '529.982.247-25',
        phone: '(11) 9 8888-7777',
        email: 'Maria@Exemplo.com',
        password: 'segredo1',
        address: const Address(
          id: '',
          street: 'Rua Nova',
          number: '10',
          neighborhood: 'B',
          city: 'C',
          state: 'SP',
          cep: '00000-000',
        ),
      );
      await SessionController.register(data);
      final created = backend.users.last;
      expect(created['email'], 'maria@exemplo.com');
      expect(created['cpf'], '52998224725');
      expect(created['telefone'], '11988887777');
      expect(created['data_nascimento'], startsWith('2000-01-01'));
      expect(SessionController.currentUser.value?.name, 'Maria Lima');
      final addresses = await AddressService.instance.getAddresses();
      expect(addresses.single.isCurrent, isTrue);

      await SessionController.logout();
      await expectLater(
        AuthService.instance.register(data),
        throwsA(isA<ServiceException>().having((e) => e.message, 'message', 'Email já cadastrado')),
      );
    });

    test('troca de senha exige a senha atual e não derruba a sessão', () async {
      await loginTestUser();
      final user = SessionController.currentUser.value!;
      await expectLater(
        AuthService.instance.changePassword(user, 'errada', 'nova123'),
        throwsA(isA<ServiceException>().having((e) => e.message, 'message', 'A senha atual está incorreta.')),
      );
      expect(SessionController.isLoggedIn, isTrue);
      await AuthService.instance.changePassword(user, FakeBackend.password, 'nova123');
      expect(backend.users.first['senha'], 'nova123');
    });

    test('editar perfil atualiza o backend e o nome curto', () async {
      await loginTestUser();
      final user = SessionController.currentUser.value!;
      await SessionController.updateProfile(user.copyWith(fullName: 'Lays Cintra', phone: '(11) 9 1111-2222'));
      expect(SessionController.currentUser.value?.name, 'Lays Cintra');
      expect(backend.users.first['telefone'], '11911112222');
    });
  });

  group('Catálogo', () {
    test('usa o preço promocional e mostra o preço antigo', () async {
      final toy = (await CatalogService.instance.getProducts()).firstWhere((p) => p.id == '3');
      expect(toy.price, 39.9);
      expect(toy.oldPrice, 49.9);
    });

    test('busca ignora acentos e maiúsculas', () async {
      final result = await CatalogService.instance.getProducts(query: 'COLEIRA');
      expect(result.map((p) => p.id), ['2']);
      final plush = await CatalogService.instance.getProducts(query: 'pelucia');
      expect(plush.map((p) => p.id), ['4']);
      expect(await CatalogService.instance.getProducts(query: 'xyz'), isEmpty);
    });

    test('ordena por preço', () async {
      final result = await CatalogService.instance.getProducts(sort: ProductSort.lowestPrice);
      final prices = result.map((p) => p.price).toList();
      expect(prices, [...prices]..sort());
    });

    test('imagem do backend vira URL completa', () async {
      final feeder = (await CatalogService.instance.getProducts()).firstWhere((p) => p.id == '1');
      expect(feeder.imageUrl, endsWith('/uploads/comedouro.png'));
      expect(feeder.imageUrl, startsWith('http'));
    });
  });

  group('Carrinho', () {
    setUp(loginTestUser);

    test('soma quantidades do mesmo produto e grava no banco', () async {
      await cartAdd('1');
      await cartAdd('3', quantity: 2);
      await cartAdd('3');

      expect(CartController.items.value.length, 2);
      expect(CartController.itemCount, 4);
      expect(CartController.subtotal, closeTo(175 + 39.9 * 3, 0.001));
      expect(backend.carts[1]![3]!.quantity, 3);
    });

    test('quantidade zero remove o item', () async {
      await cartAdd('3', quantity: 2);
      await CartController.setQuantity('3', 5);
      expect(backend.carts[1]![3]!.quantity, 5);
      await CartController.setQuantity('3', 0);
      expect(CartController.items.value, isEmpty);
      expect(backend.carts[1], isEmpty);
    });

    test('falha no backend volta ao que está no banco', () async {
      final ghost = (await CatalogService.instance.getProducts()).first;
      backend.products.clear();
      await CartController.add(ghost);
      expect(CartController.items.value, isEmpty);
    });
  });

  group('Favoritos', () {
    setUp(loginTestUser);

    test('alterna e envia ao backend', () async {
      expect(FavoritesController.toggle('2'), isTrue);
      expect(FavoritesController.toggle('1'), isFalse);
      await Future<void>.delayed(Duration.zero);
      await Future<void>.delayed(Duration.zero);
      expect(backend.favorites[1], {2});
    });
  });

  group('Pedidos e cupons', () {
    setUp(loginTestUser);

    test('cupom com pedido mínimo é recusado abaixo do valor', () async {
      await expectLater(CouponService.instance.validate('AMIGOSNOUTS', 50), throwsA(isA<ServiceException>()));
      final coupon = await CouponService.instance.validate(' amigosnouts ', 200);
      expect(coupon.discountFor(200), 20);
    });

    test('finaliza no backend com o frete do tipo de entrega', () async {
      await cartAdd('3', quantity: 3);
      final address = (await AddressService.instance.getAddresses()).first;
      final order = await OrderService.instance.placeOrder(
        items: CartController.items.value,
        address: address,
        paymentMethodCode: 'pix',
        deliveryType: 'rapida',
      );

      expect(order.subtotal, closeTo(119.7, 0.001));
      expect(order.freight, 20);
      expect(order.total, closeTo(139.7, 0.001));
      expect(order.status, OrderStatus.recebido);
      expect(order.paymentDescription, 'Pix');
      expect(order.payment!.status, PaymentStatus.pendente);
      expect(order.payment!.pixOpen, isTrue);
      expect(order.history, hasLength(1));
      expect(backend.carts[1], isEmpty);

      final cancelled = await OrderService.instance.cancel(order.id);
      expect(cancelled.status, OrderStatus.cancelado);
      expect(cancelled.payment!.status, PaymentStatus.cancelado);
      await expectLater(OrderService.instance.cancel(order.id), throwsA(isA<ServiceException>()));
    });

    test('formas de pagamento vêm do backend', () async {
      final methods = await PaymentService.instance.getMethods();
      expect(methods.map((m) => m.code), ['pix', 'cartao_credito', 'cartao_debito', 'boleto']);
      expect(methods.firstWhere((m) => m.code == 'cartao_credito').maxInstallments, 3);
      expect(methods.firstWhere((m) => m.code == 'cartao_debito').usesCard, isTrue);
    });

    test('crédito parcelado é aprovado e fica estornado ao cancelar', () async {
      final card = await PaymentService.instance.addCard(brand: 'Visa', last4: '4242', holderName: 'teste');
      await cartAdd('1');
      final address = (await AddressService.instance.getAddresses()).first;
      final order = await OrderService.instance.placeOrder(
        items: CartController.items.value,
        address: address,
        paymentMethodCode: 'cartao_credito',
        cardId: card.id,
        installments: 2,
        deliveryType: 'normal',
      );

      expect(backend.orders.last['pagamento']['cartao']['id_cartao'], int.parse(card.id));
      expect(order.payment!.status, PaymentStatus.aprovado);
      expect(order.payment!.installments, 2);
      expect(order.payment!.description, 'Cartão de crédito • Visa •••• 4242 • 2x sem juros');
      expect(order.payment!.paidAt, isNotNull);

      final cancelled = await OrderService.instance.cancel(order.id);
      expect(cancelled.payment!.status, PaymentStatus.estornado);
    });

    test('débito não aceita parcelas', () async {
      final card = await PaymentService.instance.addCard(brand: 'Elo', last4: '1111', holderName: 'teste');
      await cartAdd('1');
      final address = (await AddressService.instance.getAddresses()).first;
      await expectLater(
        OrderService.instance.placeOrder(
          items: CartController.items.value,
          address: address,
          paymentMethodCode: 'cartao_debito',
          cardId: card.id,
          installments: 2,
          deliveryType: 'normal',
        ),
        throwsA(isA<ServiceException>()),
      );
    });

    test('não aceita pedido vazio', () async {
      final address = (await AddressService.instance.getAddresses()).first;
      await expectLater(
        OrderService.instance.placeOrder(
          items: const [],
          address: address,
          paymentMethodCode: 'pix',
          deliveryType: 'normal',
        ),
        throwsA(isA<ServiceException>()),
      );
    });
  });

  group('Cartões e endereços', () {
    setUp(loginTestUser);

    test('cartão envia só os 4 últimos dígitos e a bandeira', () async {
      final card = await PaymentService.instance.addCard(brand: 'Mastercard', last4: '4444', holderName: 'teste');
      expect(card.last4, '4444');
      expect(card.brand, 'Mastercard');
      final saved = backend.cards.last;
      expect(saved['ultimos_digitos'], '4444');
      expect(saved['nome_titular'], 'TESTE');
      await expectLater(
        PaymentService.instance.addCard(brand: 'Mastercard', last4: '4444', holderName: 'teste'),
        throwsA(isA<ServiceException>()),
      );
    });

    test('apenas um endereço fica como atual', () async {
      final saved = await AddressService.instance.save(
        const Address(
          id: '',
          street: 'Rua Nova',
          number: '10',
          neighborhood: 'B',
          city: 'C',
          state: 'sp',
          cep: '00000-000',
          isCurrent: true,
        ),
      );
      final list = await AddressService.instance.getAddresses();
      expect(list.where((a) => a.isCurrent).length, 1);
      expect(list.first.id, saved.id);
      expect(list.first.state, 'SP');
    });

    test('excluir o endereço atual passa o padrão para outro', () async {
      final other = await AddressService.instance.save(
        const Address(
          id: '',
          street: 'Rua B',
          number: '1',
          neighborhood: 'B',
          city: 'C',
          state: 'SP',
          cep: '00000-000',
        ),
      );
      await AddressService.instance.delete('10');
      final list = await AddressService.instance.getAddresses();
      expect(list.single.id, other.id);
      expect(list.single.isCurrent, isTrue);
    });
  });

  group('Pets e agenda', () {
    setUp(loginTestUser);

    test('cria pet no backend e guarda os dados extras no aparelho', () async {
      final saved = await PetService.instance.save(
        Pet(
          id: '',
          name: 'Luna',
          breed: 'Siamês',
          species: 'Gato',
          sex: 'Fêmea',
          weightKg: 4.5,
          birthDate: DateTime(DateTime.now().year - 3, 1, 1),
          vaccinesUpToDate: true,
        ),
      );
      expect(backend.pets.last['nome_pet'], 'Luna');
      expect(backend.pets.last['idade_pet'], 3);
      expect(saved.species, 'Gato');
      expect(saved.vaccinesUpToDate, isTrue);
      expect(saved.weightKg, 4.5);

      final pets = await PetService.instance.getPets();
      expect(pets.map((p) => p.name), containsAll(['Thor', 'Mel', 'Luna']));
      expect(pets.firstWhere((p) => p.name == 'Thor').age, '2 anos');
      expect(pets.firstWhere((p) => p.name == 'Thor').hasTracker, isTrue);
    });

    test('agenda cria, edita e remove lembretes no backend', () async {
      final tomorrow = DateTime.now().add(const Duration(days: 1));
      final event = await CareEventService.instance.save(
        CareEvent(
          id: '',
          date: DateTime(tomorrow.year, tomorrow.month, tomorrow.day),
          type: CareType.banhoETosa,
          title: 'Banho',
          petId: '31',
          petName: 'Mel',
          time: '10:30',
        ),
      );
      expect(backend.reminders.last['tipo'], 'banho');
      expect(backend.reminders.last['data_hora'], DateTime(tomorrow.year, tomorrow.month, tomorrow.day, 10, 30));

      final events = await CareEventService.instance.getEvents(petId: '31');
      expect(events.single.title, 'Banho');
      expect(events.single.time, '10:30');
      expect(events.single.type, CareType.banhoETosa);

      final upcoming = await CareEventService.instance.getUpcoming();
      expect(upcoming.map((e) => e.title), containsAll(['Banho', 'Vacina V10']));

      await CareEventService.instance.delete(event.id);
      expect(await CareEventService.instance.getEvents(petId: '31'), isEmpty);
    });

    test('blog carrega a lista e o post completo', () async {
      final posts = await BlogService.instance.getPosts();
      expect(posts.single.hasFullContent, isFalse);
      final full = await BlogService.instance.getPost(posts.single.id);
      expect(full.content, startsWith('Comecei a ir com calma:'));
      expect(full.author, 'julia_bubu');
    });
  });

  test('sem conexão a mensagem é amigável', () async {
    ApiClient.instance.httpClient = FakeBackendOffline.client;
    await expectLater(
      CatalogService.instance.getProducts(),
      throwsA(isA<ServiceException>().having((e) => e.message, 'message', contains('Não foi possível conectar'))),
    );
  });

  group('Fotos e dispositivos', () {
    test('foto de perfil é enviada pelo /upload e gravada no cliente', () async {
      await loginTestUser();
      await SessionController.updatePhoto(photo);
      final saved = backend.users.first['foto_url'] as String;
      expect(saved, startsWith('/uploads/'));
      expect(SessionController.currentUser.value!.avatarUrl, endsWith(saved));
    });

    test('cadastro com foto envia a foto depois de criar a conta', () async {
      await SessionController.register(
        RegistrationData(
          fullName: 'João Pedro Lima',
          username: 'joao',
          birthDate: '01/01/2000',
          cpf: '529.982.247-25',
          phone: '(11) 9 8888-7777',
          email: 'joao@exemplo.com',
          password: 'segredo1',
          photo: photo,
        ),
      );
      expect(backend.users.last['foto_url'], startsWith('/uploads/'));
    });

    test('pet com foto e conexão de dispositivo', () async {
      await loginTestUser();
      final mel = (await PetService.instance.getPets()).firstWhere((p) => p.name == 'Mel');
      final saved = await PetService.instance.save(mel, photo: photo);
      expect(saved.imageUrl, contains('/uploads/'));

      await PetService.instance.connectDevice(mel, collar: false, deviceCode: 55);
      final updated = await PetService.instance.getPet(mel.id);
      expect(updated.feederId, '55');
      expect(updated.collarId, isNull);
    });
  });

  group('Área do funcionário', () {
    test('o mesmo login reconhece funcionário e não carrega dados de cliente', () async {
      final kind = await SessionController.login(FakeBackend.employeeEmail, 'admin123');
      expect(kind, SessionKind.employee);
      expect(SessionController.isEmployee, isTrue);
      expect(SessionController.isLoggedIn, isFalse);
      expect(SessionController.employeeName.value, 'Ana Funcionária');

      // A sessão de funcionário também é reaberta ao abrir o app.
      SessionController.employeeName.value = null;
      ApiClient.instance.token = null;
      await SessionController.restore();
      expect(SessionController.isEmployee, isTrue);
    });

    test('senha errada de funcionário é recusada', () async {
      await expectLater(
        SessionController.login(FakeBackend.employeeEmail, 'errada'),
        throwsA(isA<ServiceException>().having((e) => e.message, 'message', 'E-mail ou senha incorretos.')),
      );
    });

    test('cadastra, edita e desativa produto', () async {
      await SessionController.login(FakeBackend.employeeEmail, 'admin123');
      final categories = await AdminService.instance.getCategories();
      expect(categories.map((c) => c.name), ['Acessórios', 'Alimentação', 'Brinquedos', 'Higiene']);
      expect(categories.first.emoji, '🐾'); // ícone antigo em arquivo vira a patinha

      await expectLater(
        AdminService.instance.saveProduct(
          name: 'Sem foto',
          description: 'Produto sem imagem',
          price: 10,
          categoryId: 4,
          currentImagePath: '',
        ),
        throwsA(isA<ServiceException>()),
      );
      await AdminService.instance.saveProduct(
        name: 'Shampoo neutro',
        description: 'Shampoo para cães e gatos',
        price: 30,
        promoPrice: 25.5,
        categoryId: 4,
        currentImagePath: '',
        photo: photo,
      );
      var products = await AdminService.instance.getProducts();
      final shampoo = products.firstWhere((p) => p.name == 'Shampoo neutro');
      expect(shampoo.onSale, isTrue);
      expect(shampoo.category, 'Higiene');
      expect(shampoo.imagePath, startsWith('/uploads/'));

      await AdminService.instance.deactivateProduct(shampoo.id);
      products = await AdminService.instance.getProducts();
      expect(products.last.active, isFalse); // desativados vão para o fim
      final store = await CatalogService.instance.getProducts();
      expect(store.any((p) => p.name == 'Shampoo neutro'), isFalse);
    });

    test('categoria com produtos não pode ser excluída', () async {
      await SessionController.login(FakeBackend.employeeEmail, 'admin123');
      await expectLater(AdminService.instance.deleteCategory(3), throwsA(isA<ServiceException>()));
      await AdminService.instance.saveCategory(name: 'Petiscos', icon: '🦴');
      final created = (await AdminService.instance.getCategories()).firstWhere((c) => c.name == 'Petiscos');
      await AdminService.instance.deleteCategory(created.id);
      expect((await AdminService.instance.getCategories()).any((c) => c.name == 'Petiscos'), isFalse);
    });

    test('cliente não acessa rotas do painel', () async {
      await loginTestUser();
      await expectLater(AdminService.instance.getProducts(), throwsA(isA<ServiceException>()));
    });
  });

  group('Recuperar senha', () {
    test('troca a senha com o código recebido por e-mail', () async {
      await AuthService.instance.requestPasswordReset(FakeBackend.email);
      expect(backend.resetCodes[FakeBackend.email], '123456');
      await expectLater(
        AuthService.instance.verifyResetCode(FakeBackend.email, '000000'),
        throwsA(isA<ServiceException>()),
      );
      await AuthService.instance.verifyResetCode(FakeBackend.email, '123456');
      await AuthService.instance.resetPassword(FakeBackend.email, '123456', 'novaSenha1');
      await expectLater(
        SessionController.login(FakeBackend.email, FakeBackend.password),
        throwsA(isA<ServiceException>()),
      );
      expect(await SessionController.login(FakeBackend.email, 'novaSenha1'), SessionKind.client);
    });

    test('e-mail desconhecido recebe a mesma resposta (não revela contas)', () async {
      await AuthService.instance.requestPasswordReset('ninguem@exemplo.com');
      expect(backend.resetCodes, isEmpty);
    });
  });

  group('Acompanhamento do pedido', () {
    test('funcionário avança o status e o cliente é avisado', () async {
      await loginTestUser();
      await cartAdd('1');
      final address = (await AddressService.instance.getAddresses()).first;
      final order = await OrderService.instance.placeOrder(
        items: CartController.items.value,
        address: address,
        paymentMethodCode: 'pix',
        deliveryType: 'normal',
      );
      expect(order.nextStatuses, contains(OrderStatus.emPreparacao));
      await expectLater(
        OrderService.instance.updatePaymentStatus(order.id, PaymentStatus.aprovado),
        throwsA(isA<ServiceException>()),
      );

      await SessionController.login(FakeBackend.employeeEmail, 'admin123');
      expect(order.payment!.nextStatuses, contains(PaymentStatus.aprovado));
      final paid = await OrderService.instance.updatePaymentStatus(order.id, PaymentStatus.aprovado);
      expect(paid.payment!.status, PaymentStatus.aprovado);
      expect(paid.payment!.paidAt, isNotNull);
      expect(paid.payment!.nextStatuses, [PaymentStatus.estornado]);
      await expectLater(
        OrderService.instance.updatePaymentStatus(order.id, PaymentStatus.pendente),
        throwsA(isA<ServiceException>()),
      );
      final all = await OrderService.instance.getAllOrders();
      expect(all.single.customerName, 'Lays Christine Cintra Silva');
      final summary = await OrderService.instance.getSummary();
      expect(summary.byStatus[OrderStatus.recebido], 1);
      await expectLater(
        OrderService.instance.updateStatus(order.id, OrderStatus.entregue),
        throwsA(isA<ServiceException>()),
      );
      await OrderService.instance.updateStatus(order.id, OrderStatus.emPreparacao);
      final sent = await OrderService.instance.updateStatus(
        order.id,
        OrderStatus.enviado,
        trackingCode: 'BR123',
        note: 'Saiu hoje',
      );
      expect(sent.status, OrderStatus.enviado);
      expect(sent.trackingCode, 'BR123');
      expect(sent.history.map((e) => e.status), [OrderStatus.recebido, OrderStatus.emPreparacao, OrderStatus.enviado]);

      await loginTestUser();
      final mine = await OrderService.instance.getOrders();
      expect(mine.single.status, OrderStatus.enviado);
      await expectLater(OrderService.instance.cancel(order.id), throwsA(isA<ServiceException>()));
      await NotificationService.instance.refresh();
      // pedido recebido + pagamento aprovado + 2 etapas
      expect(NotificationService.instance.unreadCount.value, 4);
      await NotificationService.instance.markAllRead();
      expect(backend.notifications.every((n) => n['lida'] == 1), isTrue);
    });

    test('salvar avisa as telas abertas (atualização imediata)', () async {
      await loginTestUser();
      var pets = 0;
      void listener() => pets++;
      AppEvents.of(DataTopic.pets).addListener(listener);
      addTearDown(() => AppEvents.of(DataTopic.pets).removeListener(listener));
      await PetService.instance.save(const Pet(id: '', name: 'Bolinha', breed: 'Poodle'));
      expect(pets, 1);
      expect((await PetService.instance.getPets()).any((p) => p.name == 'Bolinha'), isTrue);
    });
  });

  group('Fale conosco', () {
    test('cliente envia, funcionário responde e o cliente vê a resposta', () async {
      await loginTestUser();
      await expectLater(
        SupportService.instance.sendMessage(subject: 'Dúvida', message: 'curta'),
        throwsA(isA<ServiceException>()),
      );
      final protocol = await SupportService.instance.sendMessage(
        subject: 'Pedido',
        message: 'Quando chega meu pedido?',
      );
      expect(protocol, startsWith('#'));

      await SessionController.login(FakeBackend.employeeEmail, 'admin123');
      final inbox = await SupportService.instance.getAllMessages();
      expect(inbox.single.status, MessageStatus.aberta);
      await SupportService.instance.reply(inbox.single.id, 'Chega amanhã!');

      await loginTestUser();
      final mine = await SupportService.instance.getMyMessages();
      expect(mine.single.status, MessageStatus.respondida);
      expect(mine.single.reply, 'Chega amanhã!');
      expect(mine.single.employee, 'Ana Funcionária');
    });
  });

  group('Blog', () {
    test('cliente publica, filtra "meus posts" e remove', () async {
      await loginTestUser();
      final categories = await BlogService.instance.getCategories();
      expect(categories.map((c) => c.name), containsAll(['Saúde', 'Alimentação']));
      final id = await BlogService.instance.savePost(
        categoryId: categories.first.id,
        title: 'Meu cão adora cenoura',
        content: 'Cenoura crua é um ótimo petisco para cães, em pouca quantidade.',
      );
      final mine = await BlogService.instance.getPosts(mine: true);
      expect(mine.single.id, id);
      expect((await BlogService.instance.getPosts(search: 'cenoura')).single.title, 'Meu cão adora cenoura');
      await BlogService.instance.deletePost(id);
      expect(await BlogService.instance.getPosts(mine: true), isEmpty);
    });
  });

  group('Comedouro', () {
    test('próxima refeição considera o horário atual', () {
      const feeder = Feeder(
        name: 'x',
        isConnected: false,
        batteryPercent: 0,
        schedule: [
          FeedingSchedule(time: '08:00', portions: 1, grams: 90),
          FeedingSchedule(time: '18:00', portions: 2, grams: 180),
        ],
      );
      final morning = feeder.nextMeal(DateTime(2026, 1, 1, 9, 0))!;
      expect(morning.meal.time, '18:00');
      expect(morning.isToday, isTrue);
      final night = feeder.nextMeal(DateTime(2026, 1, 1, 22, 0))!;
      expect(night.meal.time, '08:00');
      expect(night.isToday, isFalse);
    });
  });
}
