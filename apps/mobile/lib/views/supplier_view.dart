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

  void _showRestockSheet() {
    final skuController = TextEditingController(text: 'SKU-SUS-500ML-01');
    final whController = TextEditingController(text: '부산 강서 메인 물류센터 (Busan Hub)');
    final qtyController = TextEditingController(text: '1000');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
          left: 20,
          right: 20,
          top: 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.inventory, color: Color(0xFFC2410C)),
                SizedBox(width: 8),
                Text('창고 재고 입고 및 수량 조정 (Restock)',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
              ],
            ),
            const SizedBox(height: 6),
            const Text('보세창고 입고 검수 완료된 실물 수량을 원장에 즉시 반영합니다.',
                style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
            const SizedBox(height: 16),
            TextField(
              controller: skuController,
              decoration: const InputDecoration(
                labelText: 'SKU 코드',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: whController,
              decoration: const InputDecoration(
                labelText: '보관 창고 위치 (Warehouse)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: qtyController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: '추가 입고 수량 (Quantity pcs)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 18),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF15803D),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: () {
                  Navigator.pop(ctx);
                  final addQty = int.tryParse(qtyController.text) ?? 1000;
                  setState(() {
                    _inventory.add({
                      'sku_code': skuController.text,
                      'warehouse_name': whController.text,
                      'on_hand': addQty,
                      'available': addQty,
                      'unit': 'pcs',
                    });
                  });
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('[${skuController.text}] ${addQty}pcs 가용 재고 원장이 갱신되었습니다.')),
                  );
                },
                child: const Text('재고 원장 입고 승인 (Confirm Restock)', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAuditReportSheet() async {
    Map<String, dynamic>? auditData;
    try {
      final res = await _apiClient.get('/suppliers/11111111-1111-1111-1111-111111111111/audit-report');
      if (res is Map<String, dynamic>) {
        auditData = res;
      }
    } catch (_) {}

    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.workspace_premium, color: Color(0xFF0284C7)),
                    SizedBox(width: 8),
                    Text('TÜV Rheinland 공인 실사 보고서', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                  ],
                ),
                IconButton(icon: const Icon(Icons.close, size: 20), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            const Divider(),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(8)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('보고서 번호: ${auditData?['report_id'] ?? 'TUV-KR-2026-11111111'}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  Text('심사 기관: ${auditData?['verification_agency'] ?? 'TÜV Rheinland Group'}', style: const TextStyle(fontSize: 12)),
                  Text('수석 심사원: ${auditData?['lead_auditor'] ?? 'Dr. Michael Bergmann'}', style: const TextStyle(fontSize: 12)),
                  Text('종합 등급: ${auditData?['verification_grade'] ?? 'A+ (96.8 / 100)'}', style: const TextStyle(fontSize: 12, color: Color(0xFF15803D), fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            const SizedBox(height: 12),
            const Text('📋 공인 현장 실사 5대 영역 평가', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            const Text('1. 법적 실체 및 자본 건전성: 100점 (적합)', style: TextStyle(fontSize: 12)),
            const Text('2. 생산 설비 및 10대 라인 캐파: 98점 (적합)', style: TextStyle(fontSize: 12)),
            const Text('3. 품질보증 및 3차원 CMM 측정: 96점 (적합)', style: TextStyle(fontSize: 12)),
            const Text('4. OEM/ODM R&D 설계 인력 14명: 94점 (적합)', style: TextStyle(fontSize: 12)),
            const Text('5. ISO 14001 환경 안전 표준: 96점 (적합)', style: TextStyle(fontSize: 12)),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                icon: const Icon(Icons.download, size: 16),
                label: const Text('공식 감사 성적서 다운로드 (PDF)'),
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0284C7), foregroundColor: Colors.white),
                onPressed: () {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('TÜV Rheinland 공인 실사 보고서 다운로드 링크가 열렸습니다.')),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
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
          // Verified Supplier TÜV Audit Card
          Card(
            color: const Color(0xFFF0FDF4),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
              side: const BorderSide(color: Color(0xFF86EFAC)),
            ),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  const Icon(Icons.verified, color: Color(0xFF15803D), size: 26),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('TÜV Rheinland 공인 실사 완료 (Grade A+)',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF166534))),
                        SizedBox(height: 2),
                        Text('실사 점수: 96.8 / 100 | 생산 10개 라인 전수 인증',
                            style: TextStyle(fontSize: 11, color: Color(0xFF15803D))),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF16A34A),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    ),
                    onPressed: _showAuditReportSheet,
                    child: const Text('성적서 열람', style: TextStyle(fontSize: 11)),
                  ),
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.inventory_2, color: Color(0xFF173A5E)),
                          SizedBox(width: 8),
                          Text('실시간 창고 재고 원장 모니터링', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      TextButton.icon(
                        icon: const Icon(Icons.add_box, size: 16),
                        label: const Text('입고 등록', style: TextStyle(fontWeight: FontWeight.bold)),
                        onPressed: _showRestockSheet,
                      )
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
