class RFQ {
  final String id;
  final String title;
  final String destinationCountry;
  final String status;
  final int requestedQty;
  final String unit;
  final DateTime createdAt;

  RFQ({
    required this.id,
    required this.title,
    required this.destinationCountry,
    required this.status,
    required this.requestedQty,
    required this.unit,
    required this.createdAt,
  });

  factory RFQ.fromJson(Map<String, dynamic> json) {
    return RFQ(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      destinationCountry: json['destination_country']?.toString() ?? 'KR',
      status: json['status']?.toString() ?? 'PUBLISHED',
      requestedQty: int.tryParse(json['requested_qty']?.toString() ?? '1000') ?? 1000,
      unit: json['unit']?.toString() ?? 'pcs',
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'destination_country': destinationCountry,
    'status': status,
    'requested_qty': requestedQty,
    'unit': unit,
    'created_at': createdAt.toIso8601String(),
  };
}
