class PriceTier {
  final int minQuantity;
  final int? maxQuantity;
  final String unitPrice;

  PriceTier({
    required this.minQuantity,
    this.maxQuantity,
    required this.unitPrice,
  });

  factory PriceTier.fromJson(Map<String, dynamic> json) {
    return PriceTier(
      minQuantity: int.tryParse(json['min_quantity'].toString()) ?? 1,
      maxQuantity: json['max_quantity'] != null ? int.tryParse(json['max_quantity'].toString()) : null,
      unitPrice: json['unit_price']?.toString() ?? '0.00',
    );
  }

  Map<String, dynamic> toJson() => {
    'min_quantity': minQuantity,
    'max_quantity': maxQuantity,
    'unit_price': unitPrice,
  };
}

class Product {
  final String id;
  final String skuId;
  final String title;
  final String categoryName;
  final String supplierName;
  final bool isVerifiedSupplier;
  final int moq;
  final int quantityStep;
  final String unit;
  final int leadTimeDays;
  final List<PriceTier> priceTiers;

  Product({
    required this.id,
    required this.skuId,
    required this.title,
    required this.categoryName,
    required this.supplierName,
    required this.isVerifiedSupplier,
    required this.moq,
    required this.quantityStep,
    required this.unit,
    required this.leadTimeDays,
    required this.priceTiers,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id']?.toString() ?? '',
      skuId: json['sku_id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      categoryName: json['category_name']?.toString() ?? json['category']?.toString() ?? '산업기계',
      supplierName: json['supplier_name']?.toString() ?? 'Verified Supplier',
      isVerifiedSupplier: json['is_verified_supplier'] == true,
      moq: int.tryParse(json['moq'].toString()) ?? 100,
      quantityStep: int.tryParse(json['quantity_step'].toString()) ?? 10,
      unit: json['unit']?.toString() ?? 'pcs',
      leadTimeDays: int.tryParse(json['lead_time_days'].toString()) ?? 14,
      priceTiers: (json['price_tiers'] as List<dynamic>?)
              ?.map((t) => PriceTier.fromJson(t as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'sku_id': skuId,
    'title': title,
    'category_name': categoryName,
    'supplier_name': supplierName,
    'is_verified_supplier': isVerifiedSupplier,
    'moq': moq,
    'quantity_step': quantityStep,
    'unit': unit,
    'lead_time_days': leadTimeDays,
    'price_tiers': priceTiers.map((t) => t.toJson()).toList(),
  };
}
