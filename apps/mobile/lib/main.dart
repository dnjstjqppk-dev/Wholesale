import 'package:flutter/material.dart';

void main() {
  runApp(const WholesaleApp());
}

class WholesaleApp extends StatelessWidget {
  const WholesaleApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Wholesale B2B',
      theme: ThemeData(
        scaffoldBackgroundColor: const Color(0xFFF6F8FB),
        primaryColor: const Color(0xFF173A5E),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF173A5E),
          primary: const Color(0xFF173A5E),
          secondary: const Color(0xFFC2410C),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF173A5E),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
      ),
      home: const MainNavigationScreen(),
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;
  bool _isSupplierRole = false;

  @override
  Widget build(BuildContext context) {
    final buyerTabs = [
      const BuyerCatalogScreen(),
      const BuyerRFQScreen(),
      const OrdersScreen(isSupplier: false),
      const SettingsScreen(),
    ];

    final supplierTabs = [
      const SupplierDashboardScreen(),
      const SupplierRFQMarketScreen(),
      const OrdersScreen(isSupplier: true),
      const SettingsScreen(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(_isSupplierRole ? 'Wholesale Partner (공급사)' : 'Wholesale Buyer (구매사)'),
        actions: [
          Row(
            children: [
              Text(_isSupplierRole ? '공급사' : '구매사', style: const TextStyle(fontSize: 12)),
              Switch(
                value: _isSupplierRole,
                activeColor: const Color(0xFFC2410C),
                onChanged: (val) {
                  setState(() {
                    _isSupplierRole = val;
                    _currentIndex = 0;
                  });
                },
              ),
            ],
          )
        ],
      ),
      body: _isSupplierRole ? supplierTabs[_currentIndex] : buyerTabs[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        selectedItemColor: const Color(0xFFC2410C),
        unselectedItemColor: const Color(0xFF64748B),
        type: BottomNavigationBarType.fixed,
        items: _isSupplierRole
            ? const [
                BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: '콘솔'),
                BottomNavigationBarItem(icon: Icon(Icons.local_offer), label: 'RFQ 시장'),
                BottomNavigationBarItem(icon: Icon(Icons.assignment), label: '수주/출고'),
                BottomNavigationBarItem(icon: Icon(Icons.person), label: '설정'),
              ]
            : const [
                BottomNavigationBarItem(icon: Icon(Icons.search), label: '상품 탐색'),
                BottomNavigationBarItem(icon: Icon(Icons.request_quote), label: '내 RFQ'),
                BottomNavigationBarItem(icon: Icon(Icons.shopping_bag), label: '발주 관리'),
                BottomNavigationBarItem(icon: Icon(Icons.person), label: '기업 설정'),
              ],
      ),
    );
  }
}

// ----------------------------------------------------------------------------
// BUYER SCREENS
// ----------------------------------------------------------------------------
class BuyerCatalogScreen extends StatelessWidget {
  const BuyerCatalogScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        TextField(
          decoration: InputDecoration(
            hintText: '상품명, SKU, 공급사 검색...',
            prefixIcon: const Icon(Icons.search),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            filled: true,
            fillColor: Colors.white,
          ),
        ),
        const SizedBox(height: 16),
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDCFCE7),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text('Verified Supplier', style: TextStyle(fontSize: 11, color: Color(0xFF15803D), fontWeight: FontWeight.bold)),
                    ),
                    const Text('MOQ: 100 pcs', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                  ],
                ),
                const SizedBox(height: 8),
                const Text('스테인리스 진공 텀블러 벌크팩', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const Text('공급사: Precision Korea (대한민국)', style: TextStyle(fontSize: 13, color: Color(0xFF475569))),
                const Divider(height: 24),
                const Text('수량 구간별 도매 공급단가표 (USD):', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: const [
                    _TierColumn(range: '100 - 499 pcs', price: '\$5.50'),
                    _TierColumn(range: '500 - 999 pcs', price: '\$4.80'),
                    _TierColumn(range: '1,000+ pcs', price: '\$4.20'),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFC2410C), foregroundColor: Colors.white),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('즉시 발주서 생성으로 이동합니다.')));
                    },
                    child: const Text('도매 발주 / 견적 요청'),
                  ),
                )
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _TierColumn extends StatelessWidget {
  final String range;
  final String price;
  const _TierColumn({required this.range, required this.price});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(range, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
        Text(price, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
      ],
    );
  }
}

class BuyerRFQScreen extends StatelessWidget {
  const BuyerRFQScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          Card(
            child: ListTile(
              title: Text('2026 하반기 친환경 패키징 쇼핑백 50,000매'),
              subtitle: Text('상태: PUBLISHED (견적 4건 접수됨) · 마감 D-7'),
              trailing: Icon(Icons.arrow_forward_ios, size: 16),
            ),
          ),
        ],
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

// ----------------------------------------------------------------------------
// SUPPLIER SCREENS
// ----------------------------------------------------------------------------
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

// ----------------------------------------------------------------------------
// SHARED SCREENS
// ----------------------------------------------------------------------------
class OrdersScreen extends StatelessWidget {
  final bool isSupplier;
  const OrdersScreen({super.key, required this.isSupplier});

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
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    Text('주문번호: ORD-20261018-001', style: TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold)),
                    Chip(label: Text('IN_PRODUCTION', style: TextStyle(fontSize: 11, color: Color(0xFF1D4ED8)))),
                  ],
                ),
                const SizedBox(height: 8),
                const Text('텀블러 1,000 pcs (FOB Busan)'),
                const Text('총 거래액: \$4,200.00 (계약금 30% 수납 완료)'),
                const Divider(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('분할 배송: 0 / 1,000 pcs', style: TextStyle(fontSize: 12)),
                    TextButton(
                      onPressed: () {},
                      child: Text(isSupplier ? '출고 등록' : '검수 및 배송조회'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

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

