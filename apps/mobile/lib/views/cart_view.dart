import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/ws_theme.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final ApiClient _api = ApiClient();
  List<dynamic> _items = [];
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
      final res = await _api.get('/cart');
      setState(() {
        _items = (res is Map && res['items'] is List)
            ? res['items'] as List<dynamic>
            : (res is List ? res : []);
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _removeItem(String id) async {
    try {
      await _api.post('/cart/items/$id', {}); // placeholder; real DELETE via http
      await _load();
    } catch (_) {
      // ignore
    }
  }

  double _total() {
    double sum = 0;
    for (final it in _items) {
      final q = double.tryParse(it['quantity']?.toString() ?? '0') ?? 0;
      final p = double.tryParse(it['unit_price']?.toString() ?? '0') ?? 0;
      sum += q * p;
    }
    return sum;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('도매 장바구니')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: WsColors.brand))
          : _error != null
              ? WsEmpty(
                  icon: Icons.error_outline,
                  title: '장바구니를 불러오지 못했습니다',
                  body: _error,
                  actionLabel: '다시 시도',
                  onAction: _load,
                )
              : _items.isEmpty
                  ? const WsEmpty(
                      icon: Icons.shopping_cart_outlined,
                      title: '장바구니가 비어 있습니다',
                      body: '도매 카탈로그에서 상품을 담아보세요.',
                    )
                  : Column(
                      children: [
                        Expanded(
                          child: ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _items.length,
                            itemBuilder: (ctx, i) {
                              final it = _items[i];
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: Card(
                                  child: ListTile(
                                    contentPadding: const EdgeInsets.symmetric(
                                        horizontal: 14, vertical: 6),
                                    title: Text(
                                      it['title']?.toString() ?? '상품',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w800, fontSize: 14),
                                    ),
                                    subtitle: Text(
                                      '수량 ${it['quantity']} · 단가 \$${it['unit_price']}',
                                      style: const TextStyle(
                                          fontSize: 12, color: WsColors.muted),
                                    ),
                                    trailing: IconButton(
                                      icon: const Icon(Icons.delete_outline,
                                          color: WsColors.danger),
                                      onPressed: () =>
                                          _removeItem(it['id']?.toString() ?? ''),
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: const BoxDecoration(
                            color: WsColors.surface,
                            border: Border(top: BorderSide(color: WsColors.borderSubtle)),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('총 발주 공급가액',
                                      style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: WsColors.muted)),
                                  Text('\$${_total().toStringAsFixed(2)}',
                                      style: const TextStyle(
                                          fontSize: 20,
                                          fontWeight: FontWeight.w900,
                                          color: WsColors.brand)),
                                ],
                              ),
                              ElevatedButton(
                                onPressed: () {},
                                child: const Text('체크아웃'),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
    );
  }
}
