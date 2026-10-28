import 'package:flutter/material.dart';
import '../core/api_client.dart';

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
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _contract == null
                  ? const Center(child: Text('계약 정보를 찾을 수 없습니다.'))
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('주문 ID: ${widget.orderId}',
                              style: const TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          Text('해시: ${_contract!['contract_hash'] ?? '-'}'),
                          const SizedBox(height: 8),
                          Text('상태: ${_contract!['status'] ?? '-'}'),
                          const SizedBox(height: 16),
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