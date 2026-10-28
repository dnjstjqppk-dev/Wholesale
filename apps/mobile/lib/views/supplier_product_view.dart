import 'package:flutter/material.dart';
import '../core/api_client.dart';

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
        onPressed: () {},
        child: const Icon(Icons.add),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _products.isEmpty
                  ? const Center(child: Text('등록된 상품이 없습니다.'))
                  : ListView.builder(
                      itemCount: _products.length,
                      itemBuilder: (ctx, i) {
                        final p = _products[i];
                        return Card(
                          margin: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          child: ListTile(
                            leading: p['thumbnail'] != null
                                ? Image.network(p['thumbnail'].toString(),
                                    width: 48, height: 48, fit: BoxFit.cover)
                                : const Icon(Icons.image),
                            title: Text(p['title']?.toString() ?? '상품'),
                            subtitle: Text('MOQ: ${p['moq'] ?? '-'}'),
                            trailing: const Icon(Icons.edit),
                          ),
                        );
                      },
                    ),
    );
  }
}