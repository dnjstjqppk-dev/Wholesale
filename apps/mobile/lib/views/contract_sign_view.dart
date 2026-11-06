import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/ws_theme.dart';

class ContractSignScreen extends StatefulWidget {
  final String orderId;
  const ContractSignScreen({super.key, required this.orderId});

  @override
  State<ContractSignScreen> createState() => _ContractSignScreenState();
}

class _ContractSignScreenState extends State<ContractSignScreen> {
  final ApiClient _api = ApiClient();
  Map<String, dynamic>? _contract;
  bool _loading = true;
  String? _error;
  bool _signing = false;

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
      final res = await _api.get('/trade/orders/${widget.orderId}/contract');
      setState(() {
        _contract = res is Map<String, dynamic> ? res : null;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _sign() async {
    setState(() => _signing = true);
    try {
      await _api.post('/trade/orders/${widget.orderId}/contract/sign', {
        'signature': 'mobile_signature_${DateTime.now().millisecondsSinceEpoch}',
      });
      await _load();
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _signing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('계약서 서명')),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: WsColors.brand))
          : _error != null
              ? WsEmpty(
                  icon: Icons.error_outline,
                  title: '계약서를 불러오지 못했습니다',
                  body: _error,
                  actionLabel: '다시 시도',
                  onAction: _load,
                )
              : _contract == null
                  ? const WsEmpty(
                      icon: Icons.description_outlined,
                      title: '계약 정보를 찾을 수 없습니다',
                    )
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Card(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const WsSectionHead('국제 B2B 표준 계약서'),
                                  const SizedBox(height: 8),
                                  Text('주문 ID: ${widget.orderId}',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w800, fontSize: 14)),
                                  const SizedBox(height: 8),
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: WsColors.surfaceMuted,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      'SHA-256: ${_contract!['contract_hash'] ?? '-'}',
                                      style: const TextStyle(
                                          fontSize: 11, fontFamily: 'monospace'),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      const Text('상태: ',
                                          style: TextStyle(
                                              fontSize: 13, color: WsColors.muted)),
                                      WsBadge.info('${_contract!['status'] ?? '-'}'),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          const WsBanner.info('전자서명 완료 후 계약 조건 변조는 원천 차단됩니다.'),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: _signing ? null : _sign,
                            child: Text(_signing ? '서명 중...' : '전자서명 완료'),
                          ),
                        ],
                      ),
                    ),
    );
  }
}
