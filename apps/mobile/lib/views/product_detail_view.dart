import 'package:flutter/material.dart';
import '../core/api_client.dart';

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
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _product == null
                  ? const Center(child: Text('상품을 찾을 수 없습니다.'))
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (_product!['thumbnail'] != null ||
                              (_product!['images'] is List &&
                                  (_product!['images'] as List).isNotEmpty))
                            Image.network(
                              (_product!['thumbnail'] ??
                                      (_product!['images'] as List).first)
                                  .toString(),
                              height: 220,
                              fit: BoxFit.cover,
                            ),
                          const SizedBox(height: 12),
                          Text(
                            _product!['title']?.toString() ?? '',
                            style: const TextStyle(
                                fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 8),
                          Text('MOQ: ${_product!['moq'] ?? '-'}'),
                          Text('단위: ${_product!['unit'] ?? 'pcs'}'),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: () {},
                            child: const Text('도매 장바구니 담기'),
                          ),
                        ],
                      ),
                    ),
    );
  }
}