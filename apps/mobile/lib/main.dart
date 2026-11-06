import 'package:flutter/material.dart';
import 'core/ws_theme.dart';
import 'views/home_view.dart';
import 'views/catalog_view.dart';
import 'views/rfq_view.dart';
import 'views/order_view.dart';
import 'views/supplier_view.dart';
import 'views/settings_view.dart';
import 'views/messenger_view.dart';

void main() {
  runApp(const WholesaleApp());
}

class WholesaleApp extends StatelessWidget {
  const WholesaleApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Wholesale B2B',
      theme: wsTheme(),
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
      const HomeScreen(),
      const BuyerCatalogScreen(),
      const BuyerRFQScreen(),
      const OrdersScreen(isSupplier: false),
      const MessengerScreen(isSupplier: false),
      const SettingsScreen(),
    ];

    final supplierTabs = [
      const SupplierDashboardScreen(),
      const SupplierRFQMarketScreen(),
      const OrdersScreen(isSupplier: true),
      const MessengerScreen(isSupplier: true),
      const SettingsScreen(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                color: WsColors.brand,
                borderRadius: BorderRadius.circular(8),
              ),
              alignment: Alignment.center,
              child: const Text('W',
                  style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                      color: Colors.white)),
            ),
            const SizedBox(width: 9),
            Text(_isSupplierRole ? 'WHOLESALE Partner' : 'WHOLESALE Buyer'),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Row(
              children: [
                Text(
                  _isSupplierRole ? '공급사' : '구매사',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                ),
                const SizedBox(width: 6),
                SizedBox(
                  height: 26,
                  child: Switch(
                    value: _isSupplierRole,
                    activeThumbColor: WsColors.brand,
                    onChanged: (val) => setState(() {
                      _isSupplierRole = val;
                      _currentIndex = 0;
                    }),
                  ),
                ),
              ],
            ),
          )
        ],
      ),
      body: _isSupplierRole ? supplierTabs[_currentIndex] : buyerTabs[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: _isSupplierRole
            ? const [
                BottomNavigationBarItem(icon: Icon(Icons.dashboard_outlined), activeIcon: Icon(Icons.dashboard), label: '콘솔'),
                BottomNavigationBarItem(icon: Icon(Icons.local_offer_outlined), activeIcon: Icon(Icons.local_offer), label: 'RFQ 시장'),
                BottomNavigationBarItem(icon: Icon(Icons.assignment_outlined), activeIcon: Icon(Icons.assignment), label: '수주/출고'),
                BottomNavigationBarItem(icon: Icon(Icons.forum_outlined), activeIcon: Icon(Icons.forum), label: '메시지'),
                BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: '설정'),
              ]
            : const [
                BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: '홈'),
                BottomNavigationBarItem(icon: Icon(Icons.search_outlined), activeIcon: Icon(Icons.search), label: '상품 탐색'),
                BottomNavigationBarItem(icon: Icon(Icons.request_quote_outlined), activeIcon: Icon(Icons.request_quote), label: '내 RFQ'),
                BottomNavigationBarItem(icon: Icon(Icons.shopping_bag_outlined), activeIcon: Icon(Icons.shopping_bag), label: '발주 관리'),
                BottomNavigationBarItem(icon: Icon(Icons.forum_outlined), activeIcon: Icon(Icons.forum), label: '메시지'),
                BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: '기업 설정'),
              ],
      ),
    );
  }
}
