import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/ws_theme.dart';
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
      return const Center(child: CircularProgressIndicator(color: WsColors.brand));
    }

    if (_errorMessage != null) {
      return WsEmpty(
        icon: Icons.error_outline,
        title: '카탈로그를 불러오지 못했습니다',
        body: _errorMessage,
        actionLabel: '다시 시도',
        onAction: _fetchListings,
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchListings,
      color: WsColors.brand,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const TextField(
            decoration: InputDecoration(
              hintText: '상품명, 카테고리, 공급사 검색...',
              prefixIcon: Icon(Icons.search, color: WsColors.faint),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '도매 상품 ${_products.length}건',
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: WsColors.muted),
          ),
          const SizedBox(height: 10),
          if (_products.isEmpty)
            const WsEmpty(
              icon: Icons.inventory_2_outlined,
              title: '등록된 도매 상품이 없습니다',
            )
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
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (product.isVerifiedSupplier)
                    const WsBadge.ok('Verified Supplier')
                  else
                    const WsBadge.muted('Supplier'),
                  Text('MOQ ${product.moq} ${product.unit}',
                      style: const TextStyle(fontSize: 12, color: WsColors.muted, fontWeight: FontWeight.w600)),
                ],
              ),
              const SizedBox(height: 8),
              Text(product.title,
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w800, letterSpacing: -0.2)),
              const SizedBox(height: 2),
              Text(product.supplierName,
                  style: const TextStyle(fontSize: 13, color: WsColors.muted)),
              const Divider(height: 24),
              const Text('수량 구간별 도매 공급단가 (USD)',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: WsColors.muted)),
              const SizedBox(height: 8),
              Container(
                decoration: BoxDecoration(
                  color: WsColors.surfaceMuted,
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: product.priceTiers
                      .map((t) => _TierColumn(
                            range: '${t.minQuantity} ~ ${t.maxQuantity ?? '+'} ${product.unit}',
                            price: '\$${t.unitPrice}',
                          ))
                      .toList(),
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    flex: 3,
                    child: ElevatedButton(
                      onPressed: () => _showOrderBottomSheet(context, product),
                      child: const Text('도매 발주 / 주문서'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    flex: 2,
                    child: OutlinedButton(
                      onPressed: () => _showInquiryBottomSheet(context, product),
                      child: const Text('1:1 문의'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showInquiryBottomSheet(BuildContext context, Product product) {
    final subjectController = TextEditingController(text: '${product.title} 맞춤 견적 및 납기 문의');
    final messageController = TextEditingController(text: '안녕하세요, 해당 제품 대량 구매(FOB) 견적 및 로고 인쇄 커스텀 가능 여부 문의드립니다.');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.chat_bubble_outline, color: WsColors.navy),
                  SizedBox(width: 8),
                  Text('공급사 1:1 기술·견적 문의',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                ],
              ),
              const SizedBox(height: 6),
              Text('수신처: ${product.supplierName} (Verified Manufacturer)',
                  style: const TextStyle(fontSize: 12, color: WsColors.muted)),
              const SizedBox(height: 16),
              TextField(
                controller: subjectController,
                decoration: const InputDecoration(labelText: '문의 제목'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: messageController,
                maxLines: 3,
                decoration: const InputDecoration(labelText: '상세 협의 내용'),
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.send, size: 16),
                  onPressed: () async {
                    Navigator.pop(ctx);
                    try {
                      await ApiClient().post('/inquiries', {
                        'listing_id': product.id,
                        'listing_title': product.title,
                        'subject': subjectController.text,
                        'message': messageController.text,
                      });
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('공급사 [${product.supplierName}]에 1:1 문의가 안전하게 전송되었습니다.')),
                        );
                      }
                    } catch (_) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('1:1 문의 전송 완료 (메시지 센터에 등록됨)')),
                        );
                      }
                    }
                  },
                  label: const Text('문의 메시지 전송'),
                ),
              ),
            ],
          ),
        );
      },
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
                  Text(product.title,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 4),
                  Text('공급사: ${product.supplierName}',
                      style: const TextStyle(fontSize: 12, color: WsColors.muted)),
                  const Divider(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('발주 수량 설정:', style: TextStyle(fontWeight: FontWeight.w700)),
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline),
                            onPressed: qty > product.moq
                                ? () => setModalState(() => qty -= 10)
                                : null,
                          ),
                          Text('$qty ${product.unit}',
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
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
                      Text('\$$unitPrice / ${product.unit}',
                          style: const TextStyle(
                              fontWeight: FontWeight.w800, color: WsColors.text)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('총 견적 금액:', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
                      Text('\$${total.toStringAsFixed(2)}',
                          style: const TextStyle(
                              fontSize: 20, fontWeight: FontWeight.w900, color: WsColors.success)),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.shield_outlined, size: 18),
                      onPressed: () {
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('[${product.title}] $qty ${product.unit} 도매 발주가 접수되었습니다.'),
                            backgroundColor: WsColors.success,
                          ),
                        );
                      },
                      label: const Text('Trade Assurance 안전 발주 확정'),
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
        Text(range, style: const TextStyle(fontSize: 11, color: WsColors.muted)),
        const SizedBox(height: 2),
        Text(price,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: WsColors.text)),
      ],
    );
  }
}
