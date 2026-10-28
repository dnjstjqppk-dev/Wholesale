import 'package:flutter/material.dart';
import '../core/api_client.dart';

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
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('상품 ID: ${widget.productId ?? '-'}'),
            Text('수량: ${widget.quantity}'),
            const SizedBox(height: 16),
            if (_orderId != null)
              Text('주문 생성 완료: $_orderId',
                  style: const TextStyle(
                      color: Colors.green, fontWeight: FontWeight.bold)),
            if (_error != null)
              Text(_error!, style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _submitting ? null : _createOrder,
              child: Text(_submitting ? '주문 생성 중...' : '주문 생성'),
            ),
          ],
        ),
      ),
    );
  }
}