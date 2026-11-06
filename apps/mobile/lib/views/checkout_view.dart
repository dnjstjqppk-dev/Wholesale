import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/ws_theme.dart';

class CheckoutScreen extends StatefulWidget {
  final String? productId;
  final int quantity;
  const CheckoutScreen({super.key, this.productId, this.quantity = 1});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final ApiClient _api = ApiClient();
  bool _submitting = false;
  String? _error;
  String? _orderId;

  Future<void> _createOrder() async {
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final res = await _api.post('/trade/orders', {
        'listing_id': widget.productId ?? '',
        'quantity': widget.quantity,
        'incoterm': 'FOB',
      });
      setState(() {
        _orderId = (res is Map ? res['id']?.toString() : null);
        _submitting = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _submitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('체크아웃')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const WsSectionHead('발주 품목 확인'),
                    const SizedBox(height: 8),
                    _FactRow(label: '상품 ID', value: widget.productId ?? '-'),
                    _FactRow(label: '발주 수량', value: '${widget.quantity}'),
                    _FactRow(label: '인도 조건', value: 'FOB'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            if (_orderId != null) WsBanner.ok('주문 생성 완료: $_orderId'),
            if (_error != null) WsBanner.bad(_error!),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: _submitting ? null : _createOrder,
              child: Text(_submitting ? '주문 생성 중...' : '주문 생성·계약서 발급'),
            ),
          ],
        ),
      ),
    );
  }
}

class _FactRow extends StatelessWidget {
  final String label;
  final String value;
  const _FactRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, color: WsColors.muted)),
          Text(value,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}
