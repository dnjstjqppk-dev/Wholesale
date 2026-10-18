class Order {
  final String id;
  final String orderNumber;
  final String status;
  final int totalQty;
  final String unit;
  final String subtotalAmount;
  final String currency;
  final int shippedQty;

  Order({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.totalQty,
    required this.unit,
    required this.subtotalAmount,
    required this.currency,
    required this.shippedQty,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id']?.toString() ?? '',
      orderNumber: json['order_number']?.toString() ?? 'ORD-000',
      status: json['status']?.toString() ?? 'IN_PRODUCTION',
      totalQty: int.tryParse(json['total_qty']?.toString() ?? '1000') ?? 1000,
      unit: json['unit']?.toString() ?? 'pcs',
      subtotalAmount: json['subtotal_amount']?.toString() ?? '4200.00',
      currency: json['currency']?.toString() ?? 'USD',
      shippedQty: int.tryParse(json['shipped_qty']?.toString() ?? '0') ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'order_number': orderNumber,
    'status': status,
    'total_qty': totalQty,
    'unit': unit,
    'subtotal_amount': subtotalAmount,
    'currency': currency,
    'shipped_qty': shippedQty,
  };
}
