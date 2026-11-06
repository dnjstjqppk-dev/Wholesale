import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/ws_theme.dart';

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
        backgroundColor: WsColors.success,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: WsColors.brand));
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Corporate Profile Card
        Card(
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
                        _profile?['legal_name'] ?? 'Metro Wholesale Imports LLC',
                        style: const TextStyle(
                            fontSize: 17, fontWeight: FontWeight.w800, letterSpacing: -0.2),
                      ),
                    ),
                    WsBadge.ok('${_profile?['tax_exemption_status'] ?? 'VERIFIED'}',
                        icon: Icons.check),
                  ],
                ),
                const SizedBox(height: 6),
                Text('사업자 번호: ${_profile?['business_number'] ?? '987-65-43210'}',
                    style: const TextStyle(fontSize: 13, color: WsColors.muted)),
                Text('연방 EIN / VAT: ${_profile?['ein_vat'] ?? 'US-987654321'}',
                    style: const TextStyle(fontSize: 13, color: WsColors.muted)),
                Text('업종: ${_profile?['primary_industry'] ?? '산업 유통 및 글로벌 수입'}',
                    style: const TextStyle(fontSize: 13, color: WsColors.muted)),
                const Divider(height: 24),
                const Text('역할 분리(SoD)·결재 권한 전환',
                    style: TextStyle(
                        fontSize: 12, fontWeight: FontWeight.w800, color: WsColors.text2)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ChoiceChip(
                      label: const Text('구매 담당'),
                      selected: _currentRole == 'BUYER_PURCHASER',
                      selectedColor: WsColors.brandLight,
                      onSelected: (_) => _switchRole('BUYER_PURCHASER'),
                    ),
                    ChoiceChip(
                      label: const Text('승인권자'),
                      selected: _currentRole == 'BUYER_APPROVER',
                      selectedColor: WsColors.warningBg,
                      onSelected: (_) => _switchRole('BUYER_APPROVER'),
                    ),
                    ChoiceChip(
                      label: const Text('재무/에스크로'),
                      selected: _currentRole == 'BUYER_FINANCE',
                      selectedColor: WsColors.successBg,
                      onSelected: (_) => _switchRole('BUYER_FINANCE'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Compliance & Security Card
        Card(
          child: Column(
            children: [
              const ListTile(
                leading: Icon(Icons.shield_outlined, color: WsColors.brand),
                title: Text('Trade Assurance 에스크로',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                subtitle: Text('선급금 30%·잔금 70% 분할 안전 결제 보호',
                    style: TextStyle(fontSize: 12)),
                trailing: Icon(Icons.check_circle, color: WsColors.success, size: 20),
              ),
              const Divider(height: 1),
              const ListTile(
                leading: Icon(Icons.verified_outlined, color: WsColors.info),
                title: Text('Verified Supplier 공장 실사 연계',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                subtitle: Text('SGS / TÜV 제3자 현장 실사·ISO 9001 인증',
                    style: TextStyle(fontSize: 12)),
                trailing: Icon(Icons.check_circle, color: WsColors.success, size: 20),
              ),
              const Divider(height: 1),
              const ListTile(
                leading: Icon(Icons.vpn_key_outlined, color: WsColors.text2),
                title: Text('HMAC-SHA256 디지털 보안 서명',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                subtitle: Text('전자계약서 SHA-256 해시 무결성 검증',
                    style: TextStyle(fontSize: 12)),
                trailing: Icon(Icons.lock_outline, color: WsColors.muted, size: 20),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Cloud Network & Diagnostics
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('글로벌 엣지 API 게이트웨이 상태',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Cloudflare Workers Edge:',
                        style: TextStyle(fontSize: 13, color: WsColors.muted)),
                    Text(_apiHealthStatus ?? '정상',
                        style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: WsColors.success)),
                  ],
                ),
                const SizedBox(height: 4),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('엔드포인트 URL:',
                        style: TextStyle(fontSize: 13, color: WsColors.muted)),
                    Text('wholesale-api.workers.dev',
                        style: TextStyle(fontSize: 12, fontFamily: 'monospace')),
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
