import 'package:flutter/material.dart';
import '../core/api_client.dart';

class SupplierProductEditScreen extends StatefulWidget {
  final String? productId;
  const SupplierProductEditScreen({super.key, this.productId});

  @override
  State<SupplierProductEditScreen> createState() =>
      _SupplierProductEditScreenState();
}

class _SupplierProductEditScreenState extends State<SupplierProductEditScreen> {
  final ApiClient _api = ApiClient();
  final _titleCtrl = TextEditingController();
  final _moqCtrl = TextEditingController(text: '100');
  final _imageUrlCtrl = TextEditingController();
  bool _submitting = false;
  String? _error;

  Future<void> _submit() async {
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final body = {
        'title': _titleCtrl.text,
        'moq': _moqCtrl.text,
        'images': [_imageUrlCtrl.text],
        'quantity_step': '10',
        'unit': 'pcs',
        'trade_assurance': true,
      };
      if (widget.productId == null) {
        await _api.post('/catalog/listings', body);
      } else {
        await _api.post('/catalog/listings/${widget.productId}', body);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('상품이 저장되었습니다.')),
        );
        Navigator.pop(context);
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
      appBar: AppBar(
          title: Text(widget.productId == null ? '상품 등록' : '상품 수정')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _titleCtrl,
              decoration: const InputDecoration(labelText: '상품명'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _moqCtrl,
              decoration: const InputDecoration(labelText: 'MOQ'),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _imageUrlCtrl,
              decoration: const InputDecoration(labelText: '이미지 URL'),
            ),
            const SizedBox(height: 16),
            if (_error != null)
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ElevatedButton(
              onPressed: _submitting ? null : _submit,
              child: Text(_submitting ? '저장 중...' : '저장'),
            ),
          ],
        ),
      ),
    );
  }
}