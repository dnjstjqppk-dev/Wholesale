import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/ws_theme.dart';
import 'catalog_view.dart';

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
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: WsColors.brand));
    }
    return RefreshIndicator(
      color: WsColors.brand,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Hero
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: WsColors.navyInk,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.shield_outlined, size: 13, color: Color(0xFFFBBF24)),
                    SizedBox(width: 6),
                    Text(
                      'TRADE ASSURANCE 보안 연동',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.8,
                        color: Color(0xFFFBBF24),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                const Text(
                  '글로벌 무역 안심 거래',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.3,
                    color: Colors.white,
                    height: 1.25,
                  ),
                ),
                const Text(
                  '선급금 30% 에스크로 보호',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.3,
                    color: Color(0xFFFB923C),
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  '전자계약 · 제3자 검수 · 선하증권 확인까지',
                  style: TextStyle(fontSize: 13, color: Color(0xFFC3CEDE)),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const BuyerCatalogScreen()),
                        ),
                        child: const Text('카탈로그 탐색'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // Category tiles
          GridView.count(
            crossAxisCount: 4,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: 0.92,
            children: const [
              _CatTile(icon: Icons.precision_manufacturing, label: '산업용'),
              _CatTile(icon: Icons.electrical_services, label: '전자'),
              _CatTile(icon: Icons.inventory_2, label: '포장'),
              _CatTile(icon: Icons.home_outlined, label: '홈/리빙'),
              _CatTile(icon: Icons.science_outlined, label: '화학'),
              _CatTile(icon: Icons.local_shipping_outlined, label: '즉시출고'),
              _CatTile(icon: Icons.card_giftcard, label: '샘플'),
              _CatTile(icon: Icons.verified_outlined, label: '인증사'),
            ],
          ),
          const SizedBox(height: 20),
          const WsSectionHead('추천 상품'),
          const SizedBox(height: 10),
          ..._products.take(10).map((p) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Card(
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    leading: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: p['thumbnail'] != null
                          ? Image.network(
                              p['thumbnail'].toString(),
                              width: 52,
                              height: 52,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(
                                width: 52,
                                height: 52,
                                color: WsColors.surfaceMuted,
                                child: const Icon(Icons.image_outlined, color: WsColors.faint),
                              ),
                            )
                          : Container(
                              width: 52,
                              height: 52,
                              color: WsColors.surfaceMuted,
                              child: const Icon(Icons.image_outlined, color: WsColors.faint),
                            ),
                    ),
                    title: Text(
                      p['title']?.toString() ?? '상품',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                    ),
                    subtitle: Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        'MOQ ${p['moq'] ?? '-'}',
                        style: const TextStyle(fontSize: 12, color: WsColors.muted),
                      ),
                    ),
                    trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: WsColors.faint),
                  ),
                ),
              )),
        ],
      ),
    );
  }
}

class _CatTile extends StatelessWidget {
  final IconData icon;
  final String label;
  const _CatTile({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: WsColors.brandFaint,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: WsColors.brand, size: 20),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
            ),
          ],
        ),
      ),
    );
  }
}
