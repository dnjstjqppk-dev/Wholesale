import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/ws_theme.dart';

/// Legacy compact supplier dashboard (kept for deep-link compatibility).
/// The primary supplier console is SupplierDashboardScreen in supplier_view.dart;
/// this variant renders the raw platform summary for diagnostics.
class SupplierDashboardLegacyScreen extends StatefulWidget {
  const SupplierDashboardLegacyScreen({super.key});

  @override
  State<SupplierDashboardLegacyScreen> createState() =>
      _SupplierDashboardLegacyScreenState();
}

class _SupplierDashboardLegacyScreenState
    extends State<SupplierDashboardLegacyScreen> {
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
          ? const Center(child: CircularProgressIndicator(color: WsColors.brand))
          : _error != null
              ? WsEmpty(
                  icon: Icons.error_outline,
                  title: '대시보드를 불러오지 못했습니다',
                  body: _error,
                  actionLabel: '다시 시도',
                  onAction: _load,
                )
              : _data == null
                  ? const WsEmpty(
                      icon: Icons.dashboard_outlined,
                      title: '데이터 없음',
                    )
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          WsStatCard(
                            label: '총 GMV (minor)',
                            value:
                                '${_data!['summary']?['total_gmv_minor'] ?? '-'}',
                          ),
                          const SizedBox(height: 8),
                          WsStatCard(
                            label: '활성 주문',
                            value:
                                '${_data!['summary']?['active_orders_count'] ?? '-'}',
                          ),
                          const SizedBox(height: 8),
                          WsStatCard(
                            label: '인증 공급사',
                            value:
                                '${_data!['summary']?['verified_suppliers_count'] ?? '-'}',
                          ),
                          const SizedBox(height: 8),
                          WsStatCard(
                            label: '대기 실사',
                            value:
                                '${_data!['summary']?['pending_verifications_count'] ?? '-'}',
                          ),
                        ],
                      ),
                    ),
    );
  }
}
