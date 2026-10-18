import 'package:flutter/material.dart';

class SupplierDashboardScreen extends StatelessWidget {
  const SupplierDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('정산 대기 잔액', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                SizedBox(height: 8),
                Text('₩ 45,820,000', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                SizedBox(height: 4),
                Text('보류(검수 및 분쟁) 잔액: ₩ 0', style: TextStyle(fontSize: 12, color: Color(0xFF15803D))),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        const Card(
          child: ListTile(
            leading: Icon(Icons.inventory, color: Color(0xFF173A5E)),
            title: Text('실시간 가용 재고 모니터링'),
            subtitle: Text('보유 10,000 pcs · 예약 600 pcs · 가용 9,400 pcs'),
          ),
        ),
      ],
    );
  }
}
