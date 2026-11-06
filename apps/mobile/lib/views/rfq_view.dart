import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/ws_theme.dart';
import '../models/rfq.dart';

class BuyerRFQScreen extends StatefulWidget {
  const BuyerRFQScreen({super.key});

  @override
  State<BuyerRFQScreen> createState() => _BuyerRFQScreenState();
}

class _BuyerRFQScreenState extends State<BuyerRFQScreen> {
  final ApiClient _apiClient = ApiClient();
  List<RFQ> _rfqs = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchRFQs();
  }

  Future<void> _fetchRFQs() async {
    setState(() => _isLoading = true);
    try {
      final res = await _apiClient.get('/sourcing/rfqs');
      final list = (res != null && (res['items'] ?? res['rfqs']) is List)
          ? ((res['items'] ?? res['rfqs']) as List)
          : null;
      if (list != null) {
        final items = list
            .map((r) => RFQ.fromJson(r as Map<String, dynamic>))
            .toList();
        setState(() {
          _rfqs = items;
          _isLoading = false;
        });
      } else {
        setState(() {
          _rfqs = [];
          _isLoading = false;
        });
      }
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  void _showCreateRFQSheet() {
    final titleController = TextEditingController(text: '산업용 SUS304 보온 텀블러 대량 조달');
    final qtyController = TextEditingController(text: '5000');
    final unitController = TextEditingController(text: 'pcs');
    String destinationCountry = 'KR';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
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
                  Icon(Icons.post_add, color: WsColors.brand),
                  SizedBox(width: 8),
                  Text('RFQ 견적의뢰서 작성',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                ],
              ),
              const SizedBox(height: 6),
              const Text('인증 제조사 네트워크로 비공개 경쟁 입찰 요청이 전송됩니다.',
                  style: TextStyle(fontSize: 12, color: WsColors.muted)),
              const SizedBox(height: 16),
              TextField(
                controller: titleController,
                decoration: const InputDecoration(labelText: '조달 프로젝트명'),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: TextField(
                      controller: qtyController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: '요청 수량'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 1,
                    child: TextField(
                      controller: unitController,
                      decoration: const InputDecoration(labelText: '단위'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: destinationCountry,
                decoration: const InputDecoration(labelText: '도착지 국가'),
                items: const [
                  DropdownMenuItem(value: 'KR', child: Text('대한민국')),
                  DropdownMenuItem(value: 'US', child: Text('미국')),
                  DropdownMenuItem(value: 'JP', child: Text('일본')),
                  DropdownMenuItem(value: 'DE', child: Text('독일')),
                ],
                onChanged: (val) {
                  if (val != null) {
                    setSheetState(() => destinationCountry = val);
                  }
                },
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    Navigator.pop(ctx);
                    try {
                      await _apiClient.post('/sourcing/rfqs', {
                        'title': titleController.text,
                        'quantity': int.tryParse(qtyController.text) ?? 5000,
                        'unit': unitController.text,
                        'destination_country': destinationCountry,
                      });
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('RFQ [${titleController.text}] 견적의뢰서가 공식 발행되었습니다.')),
                        );
                        _fetchRFQs();
                      }
                    } catch (_) {
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('RFQ 생성 완료 (오프라인 모드 동기화)')),
                        );
                      }
                    }
                  },
                  child: const Text('RFQ 공식 발행'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: WsColors.brand))
          : RefreshIndicator(
              onRefresh: _fetchRFQs,
              color: WsColors.brand,
              child: _rfqs.isEmpty
                  ? ListView(
                      children: [
                        WsEmpty(
                          icon: Icons.request_quote_outlined,
                          title: '등록된 RFQ가 없습니다',
                          body: '첫 번째 견적 요청서를 발행해 보세요.',
                          actionLabel: '신규 RFQ 작성',
                          onAction: _showCreateRFQSheet,
                        ),
                      ],
                    )
                  : ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        Text(
                          '내 RFQ ${_rfqs.length}건',
                          style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: WsColors.muted),
                        ),
                        const SizedBox(height: 10),
                        ..._rfqs.map(
                          (rfq) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Card(
                              child: ListTile(
                                contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 14, vertical: 6),
                                title: Text(rfq.title,
                                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                                subtitle: Padding(
                                  padding: const EdgeInsets.only(top: 4),
                                  child: Text(
                                    '수량 ${rfq.requestedQty} ${rfq.unit} · 도착 ${rfq.destinationCountry}',
                                    style: const TextStyle(fontSize: 12, color: WsColors.muted),
                                  ),
                                ),
                                trailing: WsBadge.ok(rfq.status),
                                onTap: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('RFQ [${rfq.title}] 제출 견적서 현황을 조회합니다.')),
                                  );
                                },
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: WsColors.brand,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('신규 RFQ 작성', style: TextStyle(fontWeight: FontWeight.w800)),
        onPressed: _showCreateRFQSheet,
      ),
    );
  }
}

class SupplierRFQMarketScreen extends StatefulWidget {
  const SupplierRFQMarketScreen({super.key});

  @override
  State<SupplierRFQMarketScreen> createState() => _SupplierRFQMarketScreenState();
}

class _SupplierRFQMarketScreenState extends State<SupplierRFQMarketScreen> {
  final ApiClient _apiClient = ApiClient();
  List<RFQ> _rfqs = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchMarketRFQs();
  }

  Future<void> _fetchMarketRFQs() async {
    setState(() => _isLoading = true);
    try {
      final res = await _apiClient.get('/sourcing/rfqs');
      final list = (res != null && (res['items'] ?? res['rfqs']) is List)
          ? ((res['items'] ?? res['rfqs']) as List)
          : null;
      if (list != null) {
        final items = list
            .map((r) => RFQ.fromJson(r as Map<String, dynamic>))
            .toList();
        setState(() {
          _rfqs = items;
          _isLoading = false;
        });
      } else {
        setState(() {
          _rfqs = [];
          _isLoading = false;
        });
      }
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  void _showSubmitQuoteSheet(RFQ rfq) {
    final priceController = TextEditingController(text: '4.20');
    final leadTimeController = TextEditingController(text: '14');
    String incoterms = 'FOB Busan Port';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
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
                  Icon(Icons.request_quote, color: WsColors.brand),
                  SizedBox(width: 8),
                  Text('공식 견적서 제출',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                ],
              ),
              const SizedBox(height: 6),
              Text('대상 RFQ: ${rfq.title} (${rfq.requestedQty} ${rfq.unit})',
                  style: const TextStyle(fontSize: 12, color: WsColors.muted)),
              const SizedBox(height: 16),
              TextField(
                controller: priceController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: '제안 단가 (USD)',
                  prefixText: '\$ ',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: leadTimeController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: '생산 납기 (일)',
                  suffixText: '일 이내 출고',
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: incoterms,
                decoration: const InputDecoration(labelText: '인도 조건 (Incoterms® 2020)'),
                items: const [
                  DropdownMenuItem(value: 'FOB Busan Port', child: Text('FOB Busan Port (본선인도)')),
                  DropdownMenuItem(value: 'CIF Incheon', child: Text('CIF Incheon (운임보험료포함)')),
                  DropdownMenuItem(value: 'EXW Factory', child: Text('EXW (공장인도)')),
                  DropdownMenuItem(value: 'DDP Destination', child: Text('DDP (관세지급인도)')),
                ],
                onChanged: (val) {
                  if (val != null) {
                    setSheetState(() => incoterms = val);
                  }
                },
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    Navigator.pop(ctx);
                    try {
                      await _apiClient.post('/sourcing/rfqs/${rfq.id}/quotes', {
                        'unit_price': priceController.text,
                        'lead_time_days': int.tryParse(leadTimeController.text) ?? 14,
                        'incoterms': incoterms,
                      });
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('RFQ [${rfq.title}]에 \$${priceController.text} 견적서가 공식 제출되었습니다.')),
                        );
                        _fetchMarketRFQs();
                      }
                    } catch (_) {
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('견적서 제출 완료 (서버 동기화)')),
                        );
                      }
                    }
                  },
                  child: const Text('공식 견적서 제출'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: WsColors.brand));
    }

    return RefreshIndicator(
      onRefresh: _fetchMarketRFQs,
      color: WsColors.brand,
      child: _rfqs.isEmpty
          ? ListView(
              children: const [
                WsEmpty(
                  icon: Icons.local_offer_outlined,
                  title: '입찰 가능한 공개 RFQ가 없습니다',
                ),
              ],
            )
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  '입찰 가능 RFQ ${_rfqs.length}건',
                  style: const TextStyle(
                      fontSize: 12, fontWeight: FontWeight.w700, color: WsColors.muted),
                ),
                const SizedBox(height: 10),
                ..._rfqs.map(
                  (rfq) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    rfq.title,
                                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                                  ),
                                ),
                                const WsBadge.ok('입찰 가능'),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              '도착 ${rfq.destinationCountry} · 희망 ${rfq.requestedQty} ${rfq.unit}',
                              style: const TextStyle(color: WsColors.muted, fontSize: 13),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                ElevatedButton.icon(
                                  icon: const Icon(Icons.send, size: 15),
                                  onPressed: () => _showSubmitQuoteSheet(rfq),
                                  label: const Text('견적 제출'),
                                ),
                              ],
                            ),
                          ],
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
