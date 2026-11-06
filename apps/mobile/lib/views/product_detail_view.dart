import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/ws_theme.dart';

class ProductDetailScreen extends StatefulWidget {
  final String productId;
  const ProductDetailScreen({super.key, required this.productId});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  final ApiClient _api = ApiClient();
  Map<String, dynamic>? _product;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await _api.get('/catalog/listings/${widget.productId}');
      setState(() {
        _product = res is Map<String, dynamic> ? res : (res['listing'] ?? res);
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('상품 상세')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: WsColors.brand))
          : _error != null
              ? WsEmpty(
                  icon: Icons.error_outline,
                  title: '상품을 불러오지 못했습니다',
                  body: _error,
                  actionLabel: '다시 시도',
                  onAction: _load,
                )
              : _product == null
                  ? const WsEmpty(
                      icon: Icons.inventory_2_outlined,
                      title: '상품을 찾을 수 없습니다',
                    )
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (_product!['thumbnail'] != null ||
                              (_product!['images'] is List &&
                                  (_product!['images'] as List).isNotEmpty))
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.network(
                                (_product!['thumbnail'] ??
                                        (_product!['images'] as List).first)
                                    .toString(),
                                height: 220,
                                width: double.infinity,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Container(
                                  height: 220,
                                  color: WsColors.surfaceMuted,
                                  alignment: Alignment.center,
                                  child: const Icon(Icons.image_outlined,
                                      color: WsColors.faint, size: 40),
                                ),
                              ),
                            ),
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              const WsBadge.ok('Verified', icon: Icons.verified),
                              const SizedBox(width: 6),
                              const WsBadge.brand('Trade Assurance', icon: Icons.shield_outlined),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Text(
                            _product!['title']?.toString() ?? '',
                            style: const TextStyle(
                                fontSize: 19,
                                fontWeight: FontWeight.w800,
                                letterSpacing: -0.2),
                          ),
                          const SizedBox(height: 12),
                          Card(
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                children: [
                                  _FactRow(
                                      label: 'MOQ',
                                      value: '${_product!['moq'] ?? '-'}'),
                                  _FactRow(
                                      label: '단위',
                                      value: '${_product!['unit'] ?? 'pcs'}'),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: () {},
                              child: const Text('도매 장바구니 담기'),
                            ),
                          ),
                        ],
                      ),
                    ),
    );
  }
}

class _FactRow extends StatelessWidget {
  final String label;
  final String value;
  const _FactRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, color: WsColors.muted)),
          Text(value,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}
