import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../models/product.dart';

class BuyerCatalogScreen extends StatefulWidget {
  const BuyerCatalogScreen({super.key});

  @override
  State<BuyerCatalogScreen> createState() => _BuyerCatalogScreenState();
}

class _BuyerCatalogScreenState extends State<BuyerCatalogScreen> {
  final ApiClient _apiClient = ApiClient();
  List<Product> _products = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchListings();
  }

  Future<void> _fetchListings() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await _apiClient.get('/catalog/listings');
      if (res != null && res['items'] is List) {
        final items = (res['items'] as List)
            .map((item) => Product.fromJson(item as Map<String, dynamic>))
            .toList();
        setState(() {
          _products = items;
          _isLoading = false;
        });
      } else {
        setState(() {
          _products = [];
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = '카탈로그 서버 연결 오류: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFFC2410C)));
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 48),
              const SizedBox(height: 12),
              Text(_errorMessage!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _fetchListings,
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFC2410C), foregroundColor: Colors.white),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchListings,
      color: const Color(0xFFC2410C),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            decoration: InputDecoration(
              hintText: '상품명, 카테고리, 공급사 검색...',
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              filled: true,
              fillColor: Colors.white,
            ),
          ),
          const SizedBox(height: 16),
          if (_products.isEmpty)
            const Center(child: Padding(padding: EdgeInsets.all(32), child: Text('등록된 도매 상품이 없습니다.')))
          else
            ..._products.map((p) => _ProductCard(product: p)),
        ],
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  final Product product;
  const _ProductCard({required this.product});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (product.isVerifiedSupplier)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text('Verified Supplier',
                        style: TextStyle(fontSize: 11, color: Color(0xFF15803D), fontWeight: FontWeight.bold)),
                  ),
                Text('MOQ: ${product.moq} ${product.unit}',
                    style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
              ],
            ),
            const SizedBox(height: 8),
            Text(product.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text('공급사: ${product.supplierName}', style: const TextStyle(fontSize: 13, color: Color(0xFF475569))),
            const Divider(height: 24),
            const Text('수량 구간별 도매 공급단가표 (USD):', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: product.priceTiers
                  .map((t) => _TierColumn(
                        range: '${t.minQuantity} ~ ${t.maxQuantity ?? '+'} ${product.unit}',
                        price: '\$${t.unitPrice}',
                      ))
                  .toList(),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFC2410C), foregroundColor: Colors.white),
                onPressed: () {
                  _showOrderBottomSheet(context, product);
                },
                child: const Text('도매 발주 / 견적 요청'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showOrderBottomSheet(BuildContext context, Product product) {
    int qty = product.moq;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            String unitPrice = product.priceTiers.isNotEmpty ? product.priceTiers.first.unitPrice : '10.00';
            for (final tier in product.priceTiers) {
              final min = tier.minQuantity;
              final max = tier.maxQuantity;
              if (qty >= min && (max == null || qty <= max)) {
                unitPrice = tier.unitPrice;
                break;
              }
            }
            final total = (double.tryParse(unitPrice) ?? 0) * qty;

            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(product.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text('공급사: ${product.supplierName}', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                  const Divider(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('발주 수량 설정:', style: TextStyle(fontWeight: FontWeight.w600)),
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline),
                            onPressed: qty > product.moq
                                ? () => setModalState(() => qty -= 10)
                                : null,
                          ),
                          Text('$qty ${product.unit}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          IconButton(
                            icon: const Icon(Icons.add_circle_outline),
                            onPressed: () => setModalState(() => qty += 10),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('적용 구간 단가:'),
                      Text('\$$unitPrice / ${product.unit}', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFC2410C))),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('총 견적 금액 (Total):', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                      Text('\$${total.toStringAsFixed(2)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF15803D))),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFC2410C),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onPressed: () {
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('[${product.title}] $qty ${product.unit} 도매 발주가 접수되었습니다.'),
                            backgroundColor: const Color(0xFF15803D),
                          ),
                        );
                      },
                      child: const Text('🛡️ Trade Assurance 안전 발주 확정'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

class _TierColumn extends StatelessWidget {
  final String range;
  final String price;
  const _TierColumn({required this.range, required this.price});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(range, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
        Text(price, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
      ],
    );
  }
}
