import 'package:flutter/material.dart';
import '../core/api_client.dart';

class RfqMarketScreen extends StatefulWidget {
  const RfqMarketScreen({super.key});

  @override
  State<RfqMarketScreen> createState() => _RfqMarketScreenState();
}

class _RfqMarketScreenState extends State<RfqMarketScreen> {
  final ApiClient _api = ApiClient();
  List<dynamic> _rfqs = [];
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
      final res = await _api.get('/sourcing/rfqs');
      setState(() {
        _rfqs = (res is Map && res['rfqs'] is List)
            ? res['rfqs'] as List<dynamic>
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
      appBar: AppBar(title: const Text('RFQ 시장')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _rfqs.isEmpty
                  ? const Center(child: Text('진행 중인 RFQ가 없습니다.'))
                  : ListView.builder(
                      itemCount: _rfqs.length,
                      itemBuilder: (ctx, i) {
                        final r = _rfqs[i];
                        return Card(
                          margin: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          child: ListTile(
                            title: Text(r['title']?.toString() ?? 'RFQ'),
                            subtitle: Text(
                                '수량: ${r['quantity'] ?? '-'} | ${r['status'] ?? ''}'),
                            trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                          ),
                        );
                      },
                    ),
    );
  }
}