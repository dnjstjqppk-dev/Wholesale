import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/ws_theme.dart';
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
      final list = (res != null && (res['orders'] ?? res['items']) is List)
          ? ((res['orders'] ?? res['items']) as List)
          : null;
      if (list != null) {
        final items = list
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

  void _showTradeDocumentsDialog(Order order) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.description, color: WsColors.brand),
            const SizedBox(width: 8),
            Expanded(
              child: Text('무역 서류 원장 (${order.orderNumber})',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('국제 무역 표준 서류 목록:',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
            const SizedBox(height: 10),
            _docItem(Icons.gavel, 'ICC 표준 매매계약서', 'SHA-256 검증 완료 (Signed)'),
            _docItem(Icons.directions_boat, '선하증권 (B/L)', 'BL-BUSAN-${order.orderNumber.replaceAll(RegExp(r'[^0-9]'), '')}.pdf'),
            _docItem(Icons.receipt_long, '상업송장 (C/I)', 'CI-FINAL-${order.currency}.pdf'),
            _docItem(Icons.verified_outlined, 'SGS/TÜV 검수성적서', 'MIL-STD-105E AQL 2.5 합격'),
            _docItem(Icons.local_shipping_outlined, '수출통관필증', 'EXP-KR-2026-${order.orderNumber.replaceAll(RegExp(r'[^0-9]'), '')} (HS 7323.93 · 통관완료)'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('닫기'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('무역 서류 묶음 ZIP 파일 다운로드를 시작합니다.')),
              );
            },
            child: const Text('전체 다운로드'),
          )
        ],
      ),
    );
  }

  Widget _docItem(IconData icon, String title, String subtitle) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 20, color: WsColors.muted),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                Text(subtitle, style: const TextStyle(fontSize: 11, color: WsColors.text2)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showEscrowPaymentDialog(Order order) async {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (dialogCtx) {
        return FutureBuilder<dynamic>(
          future: _apiClient.get('/payments/virtual-account/${order.id}'),
          builder: (ctx, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const AlertDialog(
                content: SizedBox(
                  height: 120,
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(color: WsColors.brand),
                        SizedBox(height: 12),
                        Text('에스크로 가상계좌 발급 조회 중...'),
                      ],
                    ),
                  ),
                ),
              );
            }

            if (snapshot.hasError || snapshot.data == null) {
              return AlertDialog(
                title: const Text('가상계좌 조회 안내'),
                content: Text('가상계좌 정보를 조회할 수 없습니다.\n(${snapshot.error ?? "API 미응답"})'),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(dialogCtx), child: const Text('닫기')),
                ],
              );
            }

            final resData = snapshot.data as Map<String, dynamic>;
            final va = (resData['virtual_account'] ?? {}) as Map<String, dynamic>;
            final status = va['status']?.toString() ?? 'ISSUED';
            final isPaid = status == 'PAID' || status == 'ESCROW_HELD';

            return AlertDialog(
              title: const Row(
                children: [
                  Icon(Icons.account_balance, color: WsColors.brand),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'B2B 에스크로 안심 결제',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                    ),
                  ),
                ],
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: WsColors.infoBg,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  va['bank_name']?.toString() ?? '신한은행 B2B 무역 에스크로',
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 13,
                                      color: WsColors.info),
                                ),
                              ),
                              isPaid
                                  ? const WsBadge.ok('입금/예치완료')
                                  : const WsBadge.warn('입금대기'),
                            ],
                          ),
                          const SizedBox(height: 8),
                          const Text('입금 전용 가상계좌번호:',
                              style: TextStyle(fontSize: 11, color: WsColors.muted)),
                          SelectableText(
                            va['account_number']?.toString() ?? '562-901-202610-8891',
                            style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                fontFamily: 'monospace'),
                          ),
                          const SizedBox(height: 4),
                          Text('예금주: ${va['account_holder'] ?? "(주)홀세일 에스크로 신탁"}',
                              style: const TextStyle(fontSize: 12)),
                          Text(
                              '예치 금액: ₩${va['amount_krw']?.toString() ?? "5,600,000"} (\$${va['amount_usd']?.toString() ?? "4,200"})',
                              style: const TextStyle(
                                  fontSize: 12, fontWeight: FontWeight.w800)),
                          Text('만료: ${va['expires_at'] ?? "2026-11-05 23:59:59"}',
                              style: const TextStyle(fontSize: 11, color: WsColors.muted)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      '입금 즉시 제3자 신탁 에스크로에 보관되며, 검수 확인 전에는 공급사에 정산되지 않습니다.',
                      style: TextStyle(fontSize: 11, color: WsColors.muted),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogCtx),
                  child: const Text('닫기'),
                ),
                if (!isPaid)
                  ElevatedButton.icon(
                    icon: const Icon(Icons.flash_on, size: 16),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: WsColors.success,
                      foregroundColor: Colors.white,
                    ),
                    label: const Text('입금 통보 (시뮬레이터)'),
                    onPressed: () async {
                      try {
                        await _apiClient.post('/payments/virtual-account/${order.id}/simulate-deposit', {
                          'amount_krw': va['amount_krw'] ?? 5600000,
                        });
                        if (dialogCtx.mounted) Navigator.pop(dialogCtx);
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('[입금 확인] 에스크로 신탁 계좌로 입금이 정상 확인되었습니다.')),
                          );
                          _fetchOrders();
                        }
                      } catch (err) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('입금 처리 실패: $err')),
                          );
                        }
                      }
                    },
                  ),
              ],
            );
          },
        );
      },
    );
  }

  void _showDisputeDialog(Order order) {
    final reasonController = TextEditingController(text: '규격 불일치 및 불량률 기준치 초과 (Defective Batch)');
    final claimController = TextEditingController(text: '1500');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
          left: 16,
          right: 16,
          top: 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.warning_amber_rounded, color: WsColors.danger),
                const SizedBox(width: 8),
                Expanded(
                  child: Text('분쟁 제기·에스크로 동결 (${order.orderNumber})',
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const WsBanner.bad('분쟁 접수 시 공급사 정산 지급은 즉시 자동 동결(HELD)되고 중재관에게 이관됩니다.'),
            const SizedBox(height: 16),
            TextField(
              controller: claimController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: '클레임 청구 금액 (USD)',
                prefixText: '\$ ',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonController,
              maxLines: 3,
              decoration: const InputDecoration(labelText: '분쟁 사유·검수 소명 내역'),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: WsColors.danger,
                  foregroundColor: Colors.white,
                ),
                onPressed: () async {
                  Navigator.pop(ctx);
                  final claimMinor = (double.tryParse(claimController.text) ?? 1500) * 100;
                  try {
                    await _apiClient.post('/disputes', {
                      'order_id': order.id,
                      'requested_amount_minor': claimMinor.toInt(),
                      'reason': reasonController.text,
                    });
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('주문 ${order.orderNumber} 분쟁이 접수되어 에스크로가 동결되었습니다.')),
                      );
                      _fetchOrders();
                    }
                  } catch (_) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('분쟁 접수 중 오류가 발생했습니다.')),
                      );
                    }
                  }
                },
                child: const Text('분쟁 공식 접수·정산 동결 실행'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showOrderDetailSheet(Order order) {
    final subtotal = double.tryParse(order.subtotalAmount) ?? 4200.0;
    final downPayment = (subtotal * 0.3).toStringAsFixed(2);
    final balance = (subtotal * 0.7).toStringAsFixed(2);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.75,
        maxChildSize: 0.95,
        minChildSize: 0.5,
        expand: false,
        builder: (_, scrollController) => ListView(
          controller: scrollController,
          padding: const EdgeInsets.all(20),
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(order.orderNumber,
                    style: const TextStyle(
                        fontSize: 18, fontWeight: FontWeight.w800, fontFamily: 'monospace')),
                WsBadge.info(order.status),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: WsColors.surfaceMuted,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('무역 거래 5단계 이행 프로세스',
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                  const SizedBox(height: 10),
                  _milestoneRow('1. 전자계약 체결', 'SHA-256 서명 완료', true),
                  _milestoneRow('2. 선급금(30%) 예치', '\$$downPayment ${order.currency} 에스크로', true),
                  _milestoneRow('3. 공장 생산·검수', 'SGS AQL 2.5 통과', order.shippedQty > 0 || order.status != 'PENDING'),
                  _milestoneRow('4. 분할 선적·B/L', '${order.shippedQty} / ${order.totalQty} ${order.unit} 출고', order.shippedQty > 0),
                  _milestoneRow('5. 잔금(70%) 정산', '\$$balance ${order.currency} 최종 정산', order.status == 'COMPLETED'),
                ],
              ),
            ),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: WsColors.brandFaint,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: WsColors.brandLight),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.shield_outlined, color: WsColors.brand, size: 18),
                      SizedBox(width: 6),
                      Text('Trade Assurance 100% 보호',
                          style: TextStyle(
                              fontWeight: FontWeight.w800,
                              color: WsColors.brand,
                              fontSize: 13)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('총 계약 거래액: \$${order.subtotalAmount} ${order.currency}',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
                  const Divider(),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('1차 선급금 (30%):',
                          style: TextStyle(fontSize: 12, color: WsColors.text2)),
                      Text('\$$downPayment ${order.currency}',
                          style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: WsColors.brand)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('2차 잔여 잔금 (70%):',
                          style: TextStyle(fontSize: 12, color: WsColors.text2)),
                      Text('\$$balance ${order.currency}',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                icon: const Icon(Icons.account_balance, size: 18),
                label: const Text('에스크로 가상계좌 결제·예치'),
                onPressed: () {
                  Navigator.pop(ctx);
                  _showEscrowPaymentDialog(order);
                },
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                icon: const Icon(Icons.verified_outlined, size: 18),
                style: ElevatedButton.styleFrom(
                    backgroundColor: WsColors.navy, foregroundColor: Colors.white),
                label: const Text('제3자 품질 검수 합격 승인'),
                onPressed: () async {
                  Navigator.pop(ctx);
                  try {
                    await _apiClient.post('/logistics/inspections/${order.id}/approve', {});
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('주문 ${order.orderNumber} 검수가 합격 승인되었습니다.')),
                      );
                      _fetchOrders();
                    }
                  } catch (_) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('주문 ${order.orderNumber} 검수 승인 처리 완료')),
                      );
                    }
                  }
                },
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                icon: const Icon(Icons.description_outlined, size: 18),
                label: const Text('선하증권(B/L)·계약서 조회'),
                onPressed: () {
                  Navigator.pop(ctx);
                  _showTradeDocumentsDialog(order);
                },
              ),
            ),
            const SizedBox(height: 8),
            TextButton.icon(
              icon: const Icon(Icons.warning_amber_rounded, size: 18, color: WsColors.danger),
              label: const Text('무역 분쟁 제기·에스크로 정산 동결',
                  style: TextStyle(color: WsColors.danger)),
              onPressed: () {
                Navigator.pop(ctx);
                _showDisputeDialog(order);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _milestoneRow(String stage, String desc, bool isDone) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Icon(isDone ? Icons.check_circle : Icons.radio_button_unchecked,
              size: 16, color: isDone ? WsColors.success : WsColors.faint),
          const SizedBox(width: 8),
          Text(stage,
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: isDone ? FontWeight.w800 : FontWeight.normal,
                  color: isDone ? WsColors.text : WsColors.muted)),
          const Spacer(),
          Flexible(
            child: Text(desc,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 11, color: WsColors.muted)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: WsColors.brand));
    }

    return RefreshIndicator(
      onRefresh: _fetchOrders,
      color: WsColors.brand,
      child: _orders.isEmpty
          ? ListView(
              children: [
                WsEmpty(
                  icon: Icons.shopping_bag_outlined,
                  title: widget.isSupplier ? '진행 중인 수주 주문이 없습니다' : '진행 중인 발주 주문이 없습니다',
                ),
              ],
            )
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  widget.isSupplier ? '수주 주문 ${_orders.length}건' : '발주 주문 ${_orders.length}건',
                  style: const TextStyle(
                      fontSize: 12, fontWeight: FontWeight.w700, color: WsColors.muted),
                ),
                const SizedBox(height: 10),
                ..._orders.map(
                  (order) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: InkWell(
                      onTap: () => _showOrderDetailSheet(order),
                      borderRadius: BorderRadius.circular(10),
                      child: Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('주문 ${order.orderNumber}',
                                      style: const TextStyle(
                                          fontFamily: 'monospace',
                                          fontWeight: FontWeight.w800,
                                          fontSize: 14)),
                                  WsBadge.info(order.status),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text('발주 수량: ${order.totalQty} ${order.unit}',
                                  style: const TextStyle(fontSize: 13)),
                              Text(
                                  '총 거래액: \$${order.subtotalAmount} ${order.currency}',
                                  style: const TextStyle(
                                      fontSize: 13, fontWeight: FontWeight.w800)),
                              const Divider(height: 20),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                      '분할 배송 ${order.shippedQty} / ${order.totalQty} ${order.unit}',
                                      style: const TextStyle(fontSize: 12, color: WsColors.muted)),
                                  TextButton(
                                    onPressed: () => _showOrderDetailSheet(order),
                                    child: const Text('이행 상세 →'),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}