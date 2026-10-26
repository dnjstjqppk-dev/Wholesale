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
    String subtotal;
    if (json['total_amount_minor'] != null) {
      final minor = int.tryParse(json['total_amount_minor'].toString()) ?? 0;
      subtotal = (minor / 100.0).toStringAsFixed(2);
    } else {
      subtotal = json['subtotal_amount']?.toString() ?? '4200.00';
    }

    return Order(
      id: json['id']?.toString() ?? '',
      orderNumber: json['order_number']?.toString() ?? 'ORD-000',
      status: json['order_status']?.toString() ?? json['status']?.toString() ?? 'IN_PRODUCTION',
      totalQty: int.tryParse(json['ordered_quantity']?.toString() ?? json['total_qty']?.toString() ?? '1000') ?? 1000,
      unit: json['unit']?.toString() ?? 'pcs',
      subtotalAmount: subtotal,
      currency: json['currency']?.toString() ?? 'USD',
      shippedQty: int.tryParse(json['shipped_quantity']?.toString() ?? json['shipped_qty']?.toString() ?? '0') ?? 0,
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
