import 'package:flutter/material.dart';
import '../core/api_client.dart';
import 'contract_sign_view.dart';

class OrderDetailScreen extends StatefulWidget {
  final String orderId;
  const OrderDetailScreen({super.key, required this.orderId});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  final ApiClient _api = ApiClient();
  Map<String, dynamic>? _order;
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
      final res = await _api.get('/trade/orders/${widget.orderId}');
      setState(() {
        _order = res is Map<String, dynamic> ? res : null;
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
      appBar: AppBar(title: const Text('주문 상세')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _order == null
                  ? const Center(child: Text('주문을 찾을 수 없습니다.'))
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('주문 ID: ${_order!['id'] ?? widget.orderId}',
                              style: const TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          Text('상태: ${_order!['order_status'] ?? '-'}'),
                          Text('결제: ${_order!['payment_status'] ?? '-'}'),
                          Text('총액: ${_order!['total_amount_minor'] ?? '-'}'),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) =>
                                    ContractSignScreen(orderId: widget.orderId),
                              ),
                            ),
                            child: const Text('계약서 서명'),
                          ),
                        ],
                      ),
                    ),
    );
  }
}