import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../models/order.dart';

class OrdersScreen extends StatefulWidget {
  final bool isSupplier;
  const OrdersScreen({super.key, required this.isSupplier});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  final ApiClient _apiClient = ApiClient();
  List<Order> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchOrders();
  }

  Future<void> _fetchOrders() async {
    setState(() => _isLoading = true);
    try {
      final res = await _apiClient.get('/trade/orders');
      if (res != null && res['items'] is List) {
        final items = (res['items'] as List)
            .map((o) => Order.fromJson(o as Map<String, dynamic>))
            .toList();
        setState(() {
          _orders = items;
          _isLoading = false;
        });
      } else {
        setState(() {
          _orders = [];
          _isLoading = false;
        });
      }
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFFC2410C)));
    }

    return RefreshIndicator(
      onRefresh: _fetchOrders,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_orders.isEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    Text(
                      widget.isSupplier ? '진행 중인 수주 주문이 없습니다.' : '진행 중인 발주 주문이 없습니다.',
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            )
          else
            ..._orders.map(
              (order) => Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('주문번호: ${order.orderNumber}',
                              style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold)),
                          Chip(
                            label: Text(
                              order.status,
                              style: const TextStyle(fontSize: 11, color: Color(0xFF1D4ED8)),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text('발주 수량: ${order.totalQty} ${order.unit}'),
                      Text('총 거래액: \$${order.subtotalAmount} ${order.currency}'),
                      const Divider(),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('분할 배송: ${order.shippedQty} / ${order.totalQty} ${order.unit}',
                              style: const TextStyle(fontSize: 12)),
                          TextButton(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(widget.isSupplier ? '출고 등록 화면으로 이동' : '검수 및 배송추적 화면으로 이동'),
                                ),
                              );
                            },
                            child: Text(widget.isSupplier ? '출고 등록' : '검수 및 배송조회'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
