import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/ws_theme.dart';

class SupplierProductScreen extends StatefulWidget {
  const SupplierProductScreen({super.key});

  @override
  State<SupplierProductScreen> createState() => _SupplierProductScreenState();
}

class _SupplierProductScreenState extends State<SupplierProductScreen> {
  final ApiClient _api = ApiClient();
  List<dynamic> _products = [];
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
      final res = await _api.get('/catalog/listings');
      setState(() {
        _products = (res is Map && res['items'] is List)
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('상품 관리')),
      floatingActionButton: FloatingActionButton(
        backgroundColor: WsColors.brand,
        foregroundColor: Colors.white,
        onPressed: () {},
        child: const Icon(Icons.add),
      ),
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
              : _products.isEmpty
                  ? const WsEmpty(
                      icon: Icons.inventory_2_outlined,
                      title: '등록된 상품이 없습니다',
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(12),
                      itemCount: _products.length,
                      itemBuilder: (ctx, i) {
                        final p = _products[i];
                        return Card(
                          margin: const EdgeInsets.symmetric(vertical: 5),
                          child: ListTile(
                            leading: p['thumbnail'] != null
                                ? ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: Image.network(
                                      p['thumbnail'].toString(),
                                      width: 48,
                                      height: 48,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => Container(
                                        width: 48,
                                        height: 48,
                                        color: WsColors.surfaceMuted,
                                        child: const Icon(Icons.image_outlined,
                                            color: WsColors.faint),
                                      ),
                                    ),
                                  )
                                : Container(
                                    width: 48,
                                    height: 48,
                                    decoration: BoxDecoration(
                                      color: WsColors.surfaceMuted,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Icon(Icons.image_outlined,
                                        color: WsColors.faint),
                                  ),
                            title: Text(
                              p['title']?.toString() ?? '상품',
                              style: const TextStyle(
                                  fontWeight: FontWeight.w800, fontSize: 14),
                            ),
                            subtitle: Text(
                              'MOQ ${p['moq'] ?? '-'}',
                              style: const TextStyle(
                                  fontSize: 12, color: WsColors.muted),
                            ),
                            trailing: const Icon(Icons.edit_outlined,
                                size: 18, color: WsColors.muted),
                          ),
                        );
                      },
                    ),
    );
  }
}
