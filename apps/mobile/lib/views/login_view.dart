import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/ws_theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final ApiClient _api = ApiClient();
  final _emailCtrl = TextEditingController(text: 'buyer@wholesale.internal');
  final _passCtrl = TextEditingController(text: 'Password123!');
  bool _submitting = false;
  String? _error;

  Future<void> _login() async {
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final res = await _api.post('/auth/login', {
        'email': _emailCtrl.text,
        'password': _passCtrl.text,
      });
      if (res != null) {
        // Token stored by caller; here just notify
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('로그인 성공: ${res['user']?['full_name'] ?? ''}')),
          );
        }
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('기업 로그인')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: WsColors.navyInk,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('WHOLESALE',
                      style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.3,
                          color: Colors.white)),
                  SizedBox(height: 4),
                  Text('계약 신뢰 위에 서는 B2B 도매 무역',
                      style: TextStyle(fontSize: 13, color: Color(0xFFC3CEDE))),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextField(
                      controller: _emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(labelText: '기업 이메일'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _passCtrl,
                      obscureText: true,
                      decoration: const InputDecoration(labelText: '비밀번호'),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      WsBanner.bad(_error!),
                    ],
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _submitting ? null : _login,
                      child: Text(_submitting ? '인증 중...' : '보안 로그인'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            const WsBanner.info('에스크로·전자계약·직무분리(SoD)로 모든 거래를 확정합니다.'),
          ],
        ),
      ),
    );
  }
}
