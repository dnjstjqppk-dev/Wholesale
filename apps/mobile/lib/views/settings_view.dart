import 'package:flutter/material.dart';
import '../core/api_client.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final ApiClient _apiClient = ApiClient();
  bool _isLoading = true;
  String _currentRole = 'BUYER_PURCHASER';
  Map<String, dynamic>? _profile;
  String? _apiHealthStatus;

  @override
  void initState() {
    super.initState();
    _loadProfileAndHealth();
  }

  Future<void> _loadProfileAndHealth() async {
    setState(() => _isLoading = true);
    try {
      final prof = await _apiClient.get('/auth/profile');
      final health = await _apiClient.get('/health');
      setState(() {
        _profile = prof as Map<String, dynamic>?;
        _apiHealthStatus = health != null ? '정상 가동 (Cloudflare Edge)' : '연결 확인';
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _profile = {
          'legal_name': 'Metro Wholesale Imports LLC',
          'business_number': '987-65-43210',
          'ein_vat': 'US-987654321',
          'tax_exemption_status': 'VERIFIED',
          'primary_industry': 'Industrial Distribution & Global Import',
          'annual_purchasing_volume_usd': '\$5,000,000 - \$10,000,000',
        };
        _apiHealthStatus = '로컬 안전 모드';
        _isLoading = false;
      });
    }
  }

  void _switchRole(String newRole) {
    setState(() {
      _currentRole = newRole;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('접속 역할이 [$newRole](으)로 전환되었습니다.'),
        backgroundColor: const Color(0xFF15803D),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFFC2410C)));
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Corporate Profile Card
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 1,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _profile?['legal_name'] ?? 'Metro Wholesale Imports LLC',
                      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDCFCE7),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '✓ ${_profile?['tax_exemption_status'] ?? 'VERIFIED'}',
                        style: const TextStyle(fontSize: 11, color: Color(0xFF15803D), fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text('사업자 번호: ${_profile?['business_number'] ?? '987-65-43210'}',
                    style: const TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                Text('연방 EIN / VAT: ${_profile?['ein_vat'] ?? 'US-987654321'}',
                    style: const TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                Text('업종: ${_profile?['primary_industry'] ?? '산업 유통 및 글로벌 수입'}',
                    style: const TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                const Divider(height: 24),
                const Text('역할 분리(SoD) 및 결재 권한 전환:',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF334155))),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ChoiceChip(
                      label: const Text('구매 담당 (Purchaser)'),
                      selected: _currentRole == 'BUYER_PURCHASER',
                      selectedColor: const Color(0xFFFFEDD5),
                      onSelected: (_) => _switchRole('BUYER_PURCHASER'),
                    ),
                    ChoiceChip(
                      label: const Text('승인권자 (Approver)'),
                      selected: _currentRole == 'BUYER_APPROVER',
                      selectedColor: const Color(0xFFFEF3C7),
                      onSelected: (_) => _switchRole('BUYER_APPROVER'),
                    ),
                    ChoiceChip(
                      label: const Text('재무/에스크로 (Finance)'),
                      selected: _currentRole == 'BUYER_FINANCE',
                      selectedColor: const Color(0xFFDCFCE7),
                      onSelected: (_) => _switchRole('BUYER_FINANCE'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Compliance & Security Card
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 1,
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.shield, color: Color(0xFFC2410C)),
                title: const Text('Trade Assurance 무역 에스크로'),
                subtitle: const Text('선급금 30% 및 잔금 70% 분할 안전 결제 보호'),
                trailing: const Icon(Icons.check_circle, color: Colors.green, size: 20),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.verified, color: Color(0xFF0284C7)),
                title: const Text('Verified Supplier 공장 실사 연계'),
                subtitle: const Text('SGS / TÜV 제3자 현장 실사 및 ISO 9001 인증'),
                trailing: const Icon(Icons.check_circle, color: Colors.green, size: 20),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.vpn_key, color: Color(0xFF475569)),
                title: const Text('HMAC-SHA256 디지털 보안 서명'),
                subtitle: const Text('전자계약서 SHA-256 해시 무결성 검증'),
                trailing: const Icon(Icons.lock, color: Colors.blueGrey, size: 20),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Cloud Network & Diagnostics
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 1,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('글로벌 엣지 API 게이트웨이 상태',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Cloudflare Workers Edge:', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                    Text(_apiHealthStatus ?? '정상',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF15803D))),
                  ],
                ),
                const SizedBox(height: 4),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('엔드포인트 URL:', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                    Text('wholesale-api.workers.dev', style: TextStyle(fontSize: 12, fontFamily: 'monospace')),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: _loadProfileAndHealth,
                    child: const Text('네트워크 헬스체크 재조회'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
