import 'package:happysnouts/models/product.dart';
import 'package:happysnouts/services/api_client.dart';

enum ProductSort { relevance, lowestPrice, highestPrice }

extension ProductSortLabel on ProductSort {
  String get label {
    switch (this) {
      case ProductSort.relevance:
        return 'Relevância';
      case ProductSort.lowestPrice:
        return 'Menor preço';
      case ProductSort.highestPrice:
        return 'Maior preço';
    }
  }
}

/// Catálogo de produtos (GET /produtos, público: só produtos ativos).
/// A busca e a ordenação são feitas aqui, como no site.
class CatalogService {
  CatalogService._();
  static final CatalogService instance = CatalogService._();

  Future<List<Product>> getProducts({String query = '', ProductSort sort = ProductSort.relevance}) async {
    final data = await ApiClient.instance.get('/produtos');
    final normalized = _normalize(query);
    final result = Json.list(data).map(productFromJson).where((product) {
      if (normalized.isEmpty) return true;
      return _normalize(product.name).contains(normalized) ||
          _normalize(product.description).contains(normalized) ||
          _normalize(product.category).contains(normalized);
    }).toList();

    switch (sort) {
      case ProductSort.relevance:
        break;
      case ProductSort.lowestPrice:
        result.sort((a, b) => a.price.compareTo(b.price));
        break;
      case ProductSort.highestPrice:
        result.sort((a, b) => b.price.compareTo(a.price));
        break;
    }
    return result;
  }

  Future<List<Product>> getFeaturedProducts() async {
    final products = await getProducts();
    return products.take(8).toList();
  }

  Future<List<Product>> getProductsByIds(Set<String> ids) async {
    final products = await getProducts();
    return products.where((p) => ids.contains(p.id)).toList();
  }

  /// Mesmo formato do normalizarProduto() do site (frontend/src/lib/api.js).
  static Product productFromJson(Map<String, dynamic> json) {
    final price = Json.toDouble(json['preco']) ?? 0;
    final promo = Json.toDouble(json['preco_promocional']);
    return Product(
      id: Json.text(json['id_produto']),
      name: Json.text(json['nome']),
      description: Json.text(json['descricao']),
      price: promo ?? price,
      oldPrice: promo != null && promo < price ? price : null,
      imageUrl: ApiClient.imageUrl(json['imagem_url'] as String?),
      category: json['categoria'] == null ? 'Outros' : Json.text(json['categoria']),
      isActive: json['ativo'] == null || Json.toBool(json['ativo']),
      rating: Json.toDouble(json['avaliacao_media']) ?? 0,
      reviewCount: Json.toInt(json['qnt_avaliacoes']) ?? 0,
    );
  }

  /// Busca sem acentos e sem diferenciar maiúsculas ("coleira" acha "Coléira").
  static String _normalize(String text) {
    const from = 'áàâãäéèêëíìîïóòôõöúùûüç';
    const to = 'aaaaaeeeeiiiiooooouuuuc';
    var result = text.toLowerCase().trim();
    for (var i = 0; i < from.length; i++) {
      result = result.replaceAll(from[i], to[i]);
    }
    return result;
  }
}
