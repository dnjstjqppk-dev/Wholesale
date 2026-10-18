import 'package:flutter/material.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: const [
        ListTile(leading: Icon(Icons.business), title: Text('기업 프로필 및 사업자 정보')),
        ListTile(leading: Icon(Icons.verified_user), title: Text('Verified Supplier 인증 신청 및 관리')),
        ListTile(leading: Icon(Icons.security), title: Text('보안 및 2차 인증 (MFA)')),
        ListTile(leading: Icon(Icons.help), title: Text('B2B 도매 거래 가이드 & 고객센터')),
      ],
    );
  }
}
