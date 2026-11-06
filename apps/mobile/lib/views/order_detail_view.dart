import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/ws_theme.dart';
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
          ? const Center(child: CircularProgressIndicator(color: WsColors.brand))
          : _error != null
              ? WsEmpty(
                  icon: Icons.error_outline,
                  title: '주문을 불러오지 못했습니다',
                  body: _error,
                  actionLabel: '다시 시도',
                  onAction: _load,
                )
              : _order == null
                  ? const WsEmpty(
                      icon: Icons.shopping_bag_outlined,
                      title: '주문을 찾을 수 없습니다',
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
                                  Text('주문 ${_order!['id'] ?? widget.orderId}',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 16,
                                          fontFamily: 'monospace')),
                                  const SizedBox(height: 12),
                                  _StatusRow(
                                      label: '주문 상태',
                                      value: '${_order!['order_status'] ?? '-'}'),
                                  _StatusRow(
                                      label: '결제 상태',
                                      value: '${_order!['payment_status'] ?? '-'}'),
                                  const Divider(height: 20),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text('총 계약 금액',
                                          style: TextStyle(
                                              fontSize: 13, color: WsColors.muted)),
                                      Text('\$${_order!['total_amount_minor'] ?? '-'}',
                                          style: const TextStyle(
                                              fontSize: 18,
                                              fontWeight: FontWeight.w900,
                                              color: WsColors.brand)),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
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

class _StatusRow extends StatelessWidget {
  final String label;
  final String value;
  const _StatusRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, color: WsColors.muted)),
          WsBadge.info(value),
        ],
      ),
    );
  }
}
