import 'package:happysnouts/models/picked_photo.dart';
import 'package:happysnouts/services/api_client.dart';
import 'package:happysnouts/services/app_events.dart';
import 'package:happysnouts/services/service_exception.dart';
import 'package:happysnouts/widgets/category_icon.dart';

class AdminProduct {
  final int id;
  final String name;
  final String description;
  final double price;
  final double? promoPrice;
  final int? categoryId;
  final String category;

  final String imagePath;
  final String imageUrl;
  final bool active;

  const AdminProduct({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.promoPrice,
    required this.categoryId,
    required this.category,
    required this.imagePath,
    required this.imageUrl,
    required this.active,
  });

  bool get onSale => promoPrice != null && promoPrice! < price;
}

class ProductCategory {
  final int id;
  final String name;
  final String icon;

  const ProductCategory({required this.id, required this.name, required this.icon});

  /// Emoji para textos. Ícones de imagem ("/uploads/...") e nomes de arquivo
  /// antigos ("brinquedo.png") viram a patinha; use CategoryIcon para desenhar.
  String get emoji => CategoryIcon.emojiOf(icon);
}

class AdminService {
  AdminService._();
  static final AdminService instance = AdminService._();

  final _api = ApiClient.instance;

  Future<List<AdminProduct>> getProducts() async {
    final data = await _api.get('/produtos/tudo');
    return Json.list(data).map((json) {
        final path = Json.text(json['imagem_url']);
        return AdminProduct(
          id: Json.toInt(json['id_produto']) ?? 0,
          name: Json.text(json['nome']),
          description: Json.text(json['descricao']),
          price: Json.toDouble(json['preco']) ?? 0,
          promoPrice: Json.toDouble(json['preco_promocional']),
          categoryId: Json.toInt(json['id_categoria']),
          category: Json.text(json['categoria']),
          imagePath: path,
          imageUrl: ApiClient.imageUrl(path),
          active: Json.toBool(json['ativo']),
        );
      }).toList()
      // Ativos primeiro, mais novos no topo (como no site).
      ..sort((a, b) {
        if (a.active != b.active) return a.active ? -1 : 1;
        return b.id - a.id;
      });
  }

  Future<void> saveProduct({
    int? id,
    required String name,
    required String description,
    required double price,
    double? promoPrice,
    required int categoryId,
    required String currentImagePath,
    PickedPhoto? photo,
  }) async {
    final imagePath = photo == null
        ? currentImagePath
        : await _api.uploadImage(photo.bytes, fileName: photo.fileName, mimeType: photo.mimeType);
    if (imagePath.isEmpty) throw const ServiceException('Escolha uma imagem para o produto.');
    final body = {
      'nome': name,
      'descricao': description,
      'preco': double.parse(price.toStringAsFixed(2)),
      'preco_promocional': promoPrice == null ? null : double.parse(promoPrice.toStringAsFixed(2)),
      'id_categoria': categoryId,
      'imagem_url': imagePath,
    };
    if (id == null) {
      await _api.post('/produtos', body);
    } else {
      await _api.put('/produtos/$id', body);
    }
    AppEvents.changed(DataTopic.products);
  }

  /// DELETE /produtos/:id: o backend só desativa (some da loja).
  Future<void> deactivateProduct(int id) async {
    await _api.delete('/produtos/$id');
    AppEvents.changed(DataTopic.products);
  }

  Future<List<ProductCategory>> getCategories() async {
    final data = await _api.get('/categoriaProduto');
    return Json.list(data)
        .map(
          (json) => ProductCategory(
            id: Json.toInt(json['id_categoria']) ?? 0,
            name: Json.text(json['nome']),
            icon: Json.text(json['icone']),
          ),
        )
        .toList()
      ..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
  }

  /// Cria ou edita a categoria. O ícone é um emoji ou, com [iconPhoto], uma
  /// imagem enviada pelo funcionário (vira "/uploads/...").
  Future<void> saveCategory({int? id, required String name, required String icon, PickedPhoto? iconPhoto}) async {
    final finalIcon = iconPhoto == null
        ? icon
        : await _api.uploadImage(iconPhoto.bytes, fileName: iconPhoto.fileName, mimeType: iconPhoto.mimeType);
    final body = {'nome': name, 'icone': finalIcon};
    if (id == null) {
      await _api.post('/categoriaProduto', body);
    } else {
      await _api.put('/categoriaProduto/$id', body);
    }
    AppEvents.changed(DataTopic.categories);
    AppEvents.changed(DataTopic.products);
  }

  /// O backend recusa (409) quando ainda há produtos na categoria.
  Future<void> deleteCategory(int id) async {
    await _api.delete('/categoriaProduto/$id');
    AppEvents.changed(DataTopic.categories);
  }
}
