import 'package:flutter/material.dart';
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
        title: Text(_isSupplierRole ? 'Wholesale Partner (공급사)' : 'Wholesale Buyer (구매사)'),
        actions: [
          Row(
            children: [
              Text(_isSupplierRole ? '공급사' : '구매사', style: const TextStyle(fontSize: 12)),
              Switch(
                value: _isSupplierRole,
                activeThumbColor: const Color(0xFFC2410C),
                onChanged: (val) => setState(() {
                  _isSupplierRole = val;
                  _currentIndex = 0;
                }),
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
                BottomNavigationBarItem(icon: Icon(Icons.forum_outlined), label: '메시지'),
                BottomNavigationBarItem(icon: Icon(Icons.person), label: '설정'),
              ]
            : const [
                BottomNavigationBarItem(icon: Icon(Icons.search), label: '상품 탐색'),
                BottomNavigationBarItem(icon: Icon(Icons.request_quote), label: '내 RFQ'),
                BottomNavigationBarItem(icon: Icon(Icons.shopping_bag), label: '발주 관리'),
                BottomNavigationBarItem(icon: Icon(Icons.forum_outlined), label: '메시지'),
                BottomNavigationBarItem(icon: Icon(Icons.person), label: '기업 설정'),
              ],
      ),
    );
  }
}
