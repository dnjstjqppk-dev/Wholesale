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
                          title: Text(rfq.title),
                          subtitle: Text('수량: ${rfq.requestedQty} ${rfq.unit} · 상태: ${rfq.status}'),
                          trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                        ),
                      ),
                    ),
                ],
              ),
            ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFFC2410C),
        child: const Icon(Icons.add, color: Colors.white),
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('신규 RFQ 작성 폼을 호출합니다.')));
        },
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
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFC2410C),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            ),
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('RFQ [${rfq.title}] 견적서 제출 폼으로 이동')),
                              );
                            },
                            child: const Text('견적 제출 (Submit Quote)'),
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
