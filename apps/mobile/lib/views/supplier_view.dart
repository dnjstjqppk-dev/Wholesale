import 'package:flutter/material.dart';
import '../core/api_client.dart';

class SupplierDashboardScreen extends StatefulWidget {
  const SupplierDashboardScreen({super.key});

  @override
  State<SupplierDashboardScreen> createState() => _SupplierDashboardScreenState();
}

class _SupplierDashboardScreenState extends State<SupplierDashboardScreen> {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = true;
  Map<String, dynamic>? _stats;
  List<dynamic> _inventory = [];

  @override
  void initState() {
    super.initState();
    _fetchDashboard();
  }

  Future<void> _fetchDashboard() async {
    setState(() => _isLoading = true);
    try {
      final res = await _apiClient.get('/partner/dashboard');
      if (res != null) {
        setState(() {
          _stats = res['stats'] as Map<String, dynamic>?;
          _inventory = (res['available_inventory'] as List<dynamic>?) ?? [];
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
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

    final escrowPendingMinor = _stats?['escrow_pending_minor'] ?? 399000;
    final escrowEligibleMinor = _stats?['escrow_release_eligible_minor'] ?? 399000;
    final activeListings = _stats?['active_listings_count'] ?? 25;
    final openRfqs = _stats?['open_rfqs_count'] ?? 1;
    final inProd = _stats?['in_production_orders_count'] ?? 1;

    final pendingUsd = ((escrowPendingMinor as num) / 100.0).toStringAsFixed(2);
    final eligibleUsd = ((escrowEligibleMinor as num) / 100.0).toStringAsFixed(2);

    return RefreshIndicator(
      onRefresh: _fetchDashboard,
      color: const Color(0xFFC2410C),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            elevation: 2,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('에스크로 정산 대기 잔액 (Pending Escrow)',
                      style: TextStyle(fontSize: 13, color: Color(0xFF64748B), fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Text('\$$pendingUsd USD',
                      style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Color(0xFF173A5E))),
                  const SizedBox(height: 6),
                  Text('출금 가능(검수 완료) 잔액: \$$eligibleUsd USD',
                      style: const TextStyle(fontSize: 13, color: Color(0xFF15803D), fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('등록 상품', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                        const SizedBox(height: 4),
                        Text('$activeListings개', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('입찰 가능 RFQ', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                        const SizedBox(height: 4),
                        Text('$openRfqs건', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFFC2410C))),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('수주 진행', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                        const SizedBox(height: 4),
                        Text('$inProd건', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.inventory_2, color: Color(0xFF173A5E)),
                      SizedBox(width: 8),
                      Text('실시간 창고 재고 원장 모니터링', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const Divider(),
                  if (_inventory.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(12.0),
                      child: Text('조회된 재고 원장 데이터가 없습니다.'),
                    )
                  else
                    ..._inventory.map((inv) {
                      final skuCode = inv['sku_code']?.toString() ?? 'SKU';
                      final wh = inv['warehouse_name']?.toString() ?? '창고';
                      final onHand = inv['on_hand']?.toString() ?? '0';
                      final available = inv['available']?.toString() ?? '0';
                      final unit = inv['unit']?.toString() ?? 'pcs';
                      return ListTile(
                        dense: true,
                        title: Text('$skuCode ($wh)'),
                        subtitle: Text('실물: $onHand $unit · 가용: $available $unit'),
                        trailing: const Icon(Icons.check_circle_outline, color: Color(0xFF15803D), size: 18),
                      );
                    }),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
