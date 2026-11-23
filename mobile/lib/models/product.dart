class Product {
  final String id;
  final String name;

  /// Preço que o cliente paga (o promocional, quando houver; mesma regra do backend).
  final double price;

  final double? oldPrice;

  final String imageUrl;
  final String category;
  final bool isActive;
  final double rating;
  final int reviewCount;
  final String description;
  final List<String> features;

  const Product({
    required this.id,
    required this.name,
    required this.price,
    required this.imageUrl,
    this.oldPrice,
    this.category = '',
    this.isActive = true,
    this.rating = 0.0,
    this.reviewCount = 0,
    this.description = '',
    this.features = const [],
  });
}
