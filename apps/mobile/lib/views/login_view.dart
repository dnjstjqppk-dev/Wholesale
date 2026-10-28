import 'package:flutter/material.dart';
import '../core/api_client.dart';

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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('로그인 성공: ${res['user']?['full_name'] ?? ''}')),
        );
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
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _emailCtrl,
              decoration: const InputDecoration(labelText: '기업 이메일'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _passCtrl,
              obscureText: true,
              decoration: const InputDecoration(labelText: '비밀번호'),
            ),
            const SizedBox(height: 16),
            if (_error != null)
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ElevatedButton(
              onPressed: _submitting ? null : _login,
              child: Text(_submitting ? '인증 중...' : '보안 로그인'),
            ),
          ],
        ),
      ),
    );
  }
}