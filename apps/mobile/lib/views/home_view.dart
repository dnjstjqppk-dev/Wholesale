import 'package:flutter/material.dart';
import '../core/api_client.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiClient _api = ApiClient();
  List<dynamic> _products = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final res = await _api.get('/catalog/listings');
      setState(() {
        _products = (res is Map && res['items'] is List)
            ? res['items'] as List<dynamic>
            : (res is List ? res : []);
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Wholesale'),
        actions: [
          IconButton(icon: const Icon(Icons.search), onPressed: () {}),
          IconButton(icon: const Icon(Icons.shopping_cart), onPressed: () {}),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(12),
              children: [
                // Hero banner
                Container(
                  height: 120,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFD64000), Color(0xFFCC3D00)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Center(
                    child: Text(
                      '글로벌 B2B 도매 마켓플레이스',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                // Category grid
                GridView.count(
                  crossAxisCount: 4,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  children: const [
                    _CatIcon(icon: Icons.precision_manufacturing, label: '산업용'),
                    _CatIcon(icon: Icons.electrical_services, label: '전자'),
                    _CatIcon(icon: Icons.inventory_2, label: '포장'),
                    _CatIcon(icon: Icons.home, label: '홈/리빙'),
                    _CatIcon(icon: Icons.science, label: '화학'),
                    _CatIcon(icon: Icons.local_shipping, label: 'Ready to Ship'),
                    _CatIcon(icon: Icons.card_giftcard, label: '샘플'),
                    _CatIcon(icon: Icons.verified, label: '인증 공급사'),
                  ],
                ),
                const SizedBox(height: 12),
                const Text('추천 상품',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                ..._products.take(10).map((p) => Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: p['thumbnail'] != null
                            ? Image.network(p['thumbnail'].toString(),
                                width: 48, height: 48, fit: BoxFit.cover)
                            : const Icon(Icons.image),
                        title: Text(p['title']?.toString() ?? '상품'),
                        subtitle: Text('MOQ: ${p['moq'] ?? '-'}'),
                        trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                      ),
                    )),
              ],
            ),
    );
  }
}

class _CatIcon extends StatelessWidget {
  final IconData icon;
  final String label;
  const _CatIcon({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        CircleAvatar(
          backgroundColor: const Color(0xFFF0F0F0),
          child: Icon(icon, color: const Color(0xFFD64000)),
        ),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 11)),
      ],
    );
  }
}