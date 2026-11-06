import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/ws_theme.dart';

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
          ? const Center(child: CircularProgressIndicator(color: WsColors.brand))
          : _error != null
              ? WsEmpty(
                  icon: Icons.error_outline,
                  title: 'RFQ를 불러오지 못했습니다',
                  body: _error,
                  actionLabel: '다시 시도',
                  onAction: _load,
                )
              : _rfqs.isEmpty
                  ? const WsEmpty(
                      icon: Icons.local_offer_outlined,
                      title: '진행 중인 RFQ가 없습니다',
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(12),
                      itemCount: _rfqs.length,
                      itemBuilder: (ctx, i) {
                        final r = _rfqs[i];
                        return Card(
                          margin: const EdgeInsets.symmetric(vertical: 5),
                          child: ListTile(
                            title: Text(
                              r['title']?.toString() ?? 'RFQ',
                              style: const TextStyle(
                                  fontWeight: FontWeight.w800, fontSize: 14),
                            ),
                            subtitle: Text(
                              '수량 ${r['quantity'] ?? '-'} · ${r['status'] ?? ''}',
                              style: const TextStyle(
                                  fontSize: 12, color: WsColors.muted),
                            ),
                            trailing: const Icon(Icons.arrow_forward_ios,
                                size: 14, color: WsColors.faint),
                          ),
                        );
                      },
                    ),
    );
  }
}
