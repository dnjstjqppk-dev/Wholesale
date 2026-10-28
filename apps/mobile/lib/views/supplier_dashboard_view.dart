import 'package:flutter/material.dart';
import '../core/api_client.dart';

class SupplierDashboardScreen extends StatefulWidget {
  const SupplierDashboardScreen({super.key});

  @override
  State<SupplierDashboardScreen> createState() => _SupplierDashboardScreenState();
}

class _SupplierDashboardScreenState extends State<SupplierDashboardScreen> {
  final ApiClient _api = ApiClient();
  Map<String, dynamic>? _data;
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
      final res = await _api.get('/partner/dashboard');
      setState(() {
        _data = res is Map<String, dynamic> ? res : null;
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
      appBar: AppBar(title: const Text('공급사 대시보드')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _data == null
                  ? const Center(child: Text('데이터 없음'))
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('총 GMV: ${_data!['summary']?['total_gmv_minor'] ?? '-'}'),
                          Text('활성 주문: ${_data!['summary']?['active_orders_count'] ?? '-'}'),
                          Text('인증 공급사: ${_data!['summary']?['verified_suppliers_count'] ?? '-'}'),
                          Text('대기 실사: ${_data!['summary']?['pending_verifications_count'] ?? '-'}'),
                        ],
                      ),
                    ),
    );
  }
}