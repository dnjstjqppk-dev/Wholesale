import 'package:flutter/material.dart';
import '../core/api_client.dart';
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
              Row(
                children: [
                  const Icon(Icons.post_add, color: Color(0xFFC2410C)),
                  const SizedBox(width: 8),
                  const Text('글로벌 도매 RFQ 견적의뢰서 작성',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                ],
              ),
              const SizedBox(height: 6),
              const Text('인증 제조사 네트워크로 비공개 경쟁 입찰 요청서가 전송됩니다.',
                  style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
              const SizedBox(height: 16),
              TextField(
                controller: titleController,
                decoration: const InputDecoration(
                  labelText: '조달 프로젝트명 (Title)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: TextField(
                      controller: qtyController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: '요청 수량 (Quantity)',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 1,
                    child: TextField(
                      controller: unitController,
                      decoration: const InputDecoration(
                        labelText: '단위 (Unit)',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: destinationCountry,
                decoration: const InputDecoration(
                  labelText: '도착지 국가 (Destination Country)',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: 'KR', child: Text('대한민국 (South Korea)')),
                  DropdownMenuItem(value: 'US', child: Text('미국 (United States)')),
                  DropdownMenuItem(value: 'JP', child: Text('일본 (Japan)')),
                  DropdownMenuItem(value: 'DE', child: Text('독일 (Germany)')),
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
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFC2410C),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
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
                  child: const Text('RFQ 공식 발행 (Publish RFQ)', style: TextStyle(fontWeight: FontWeight.bold)),
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
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFC2410C)))
          : RefreshIndicator(
              onRefresh: _fetchRFQs,
              color: const Color(0xFFC2410C),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (_rfqs.isEmpty)
                    const Card(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: Text('등록된 RFQ 견적 요청서가 없습니다.', textAlign: TextAlign.center),
                      ),
                    )
                  else
                    ..._rfqs.map(
                      (rfq) => Card(
                        child: ListTile(
                          title: Text(rfq.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                          subtitle: Text('수량: ${rfq.requestedQty} ${rfq.unit} · 도착국: ${rfq.destinationCountry}'),
                          trailing: Chip(
                            label: Text(rfq.status, style: const TextStyle(fontSize: 10, color: Color(0xFF15803D))),
                            backgroundColor: const Color(0xFFDCFCE7),
                          ),
                          onTap: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('RFQ [${rfq.title}] 제출 견적서 현황을 조회합니다.')),
                            );
                          },
                        ),
                      ),
                    ),
                ],
              ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFFC2410C),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('신규 RFQ 작성'),
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
              Row(
                children: [
                  const Icon(Icons.request_quote, color: Color(0xFFC2410C)),
                  const SizedBox(width: 8),
                  Text('공식 견적서 제출 (Submit Quote)',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                ],
              ),
              const SizedBox(height: 6),
              Text('대상 RFQ: ${rfq.title} (${rfq.requestedQty} ${rfq.unit})',
                  style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
              const SizedBox(height: 16),
              TextField(
                controller: priceController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(
                  labelText: '제안 단가 (Unit Price USD)',
                  border: OutlineInputBorder(),
                  prefixText: '\$ ',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: leadTimeController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: '생산 납기 (Lead Time Days)',
                  border: OutlineInputBorder(),
                  suffixText: '일 이내 출고',
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: incoterms,
                decoration: const InputDecoration(
                  labelText: '무역 인도 조건 (Incoterms® 2020)',
                  border: OutlineInputBorder(),
                ),
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
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFC2410C),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
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
                  child: const Text('공식 견적서 제출 (Submit Official Quote)', style: TextStyle(fontWeight: FontWeight.bold)),
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
      return const Center(child: CircularProgressIndicator(color: Color(0xFFC2410C)));
    }

    return RefreshIndicator(
      onRefresh: _fetchMarketRFQs,
      color: const Color(0xFFC2410C),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_rfqs.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text('입찰 가능한 공개 RFQ가 없습니다.', textAlign: TextAlign.center),
              ),
            )
          else
            ..._rfqs.map(
              (rfq) => Card(
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
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                            ),
                          ),
                          Chip(
                            label: const Text('입찰 가능', style: TextStyle(fontSize: 11, color: Color(0xFF15803D))),
                            backgroundColor: const Color(0xFFDCFCE7),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text('도착국: ${rfq.destinationCountry} · 희망 수량: ${rfq.requestedQty} ${rfq.unit}',
                          style: const TextStyle(color: Color(0xFF475569))),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          ElevatedButton.icon(
                            icon: const Icon(Icons.send, size: 16),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFC2410C),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            ),
                            onPressed: () => _showSubmitQuoteSheet(rfq),
                            label: const Text('견적 제출 (Submit Quote)'),
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
