import 'package:flutter/material.dart';
import '../core/api_client.dart';

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
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _items.isEmpty
                  ? const Center(child: Text('장바구니가 비어 있습니다.'))
                  : Column(
                      children: [
                        Expanded(
                          child: ListView.builder(
                            itemCount: _items.length,
                            itemBuilder: (ctx, i) {
                              final it = _items[i];
                              return ListTile(
                                title: Text(it['title']?.toString() ?? '상품'),
                                subtitle: Text(
                                    '수량: ${it['quantity']}  단가: ${it['unit_price']}'),
                                trailing: IconButton(
                                  icon: const Icon(Icons.delete),
                                  onPressed: () =>
                                      _removeItem(it['id']?.toString() ?? ''),
                                ),
                              );
                            },
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('합계: ${_total().toStringAsFixed(2)}',
                                  style: const TextStyle(
                                      fontSize: 18, fontWeight: FontWeight.bold)),
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