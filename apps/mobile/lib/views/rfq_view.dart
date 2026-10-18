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
      if (res != null && res['items'] is List) {
        final items = (res['items'] as List)
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

class SupplierRFQMarketScreen extends StatelessWidget {
  const SupplierRFQMarketScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        Card(
          child: ListTile(
            title: Text('[신규 입찰] 식품 포장용 크라프트 파우치 20,000개'),
            subtitle: Text('도착국: KR · 납기: 30일 이내 · 목표단가 협의'),
            trailing: Chip(label: Text('견적 작성', style: TextStyle(fontSize: 11))),
          ),
        ),
      ],
    );
  }
}
