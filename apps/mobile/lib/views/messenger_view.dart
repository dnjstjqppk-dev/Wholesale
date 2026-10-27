import 'package:flutter/material.dart';
import '../core/api_client.dart';

class MessengerScreen extends StatefulWidget {
  final bool isSupplier;
  const MessengerScreen({super.key, this.isSupplier = false});

  @override
  State<MessengerScreen> createState() => _MessengerScreenState();
}

class _MessengerScreenState extends State<MessengerScreen> {
  final ApiClient _apiClient = ApiClient();
  List<dynamic> _threads = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchThreads();
  }

  Future<void> _fetchThreads() async {
    setState(() => _isLoading = true);
    try {
      final res = await _apiClient.get('/inquiries');
      if (res != null && res['inquiries'] is List) {
        setState(() {
          _threads = res['inquiries'] as List<dynamic>;
          _isLoading = false;
        });
      } else {
        setState(() {
          _threads = [];
          _isLoading = false;
        });
      }
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  void _openChatDialog(dynamic thread) {
    final msgController = TextEditingController();
    final threadId = thread['id']?.toString() ?? 'inq-001';
    final messages = (thread['messages'] as List<dynamic>?) ?? [];
    final partnerName = widget.isSupplier
        ? (thread['buyer_name']?.toString() ?? '바이어')
        : (thread['supplier_name']?.toString() ?? '공급사');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setSheetState) => Container(
          height: MediaQuery.of(context).size.height * 0.85,
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: Column(
            children: [
              // Chat Header
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: const BoxDecoration(
                  color: Color(0xFF173A5E),
                  borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.forum, color: Colors.white, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(partnerName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                          Text(thread['listing_title']?.toString() ?? thread['subject']?.toString() ?? '문의 품목',
                              style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white, size: 20),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),
              // Message List
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: messages.length,
                  itemBuilder: (_, idx) {
                    final msg = messages[idx];
                    final isBuyerSender = msg['sender_role']?.toString().startsWith('BUYER') ?? true;
                    final isMine = widget.isSupplier ? !isBuyerSender : isBuyerSender;

                    return Align(
                      alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.symmetric(vertical: 4),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                        decoration: BoxDecoration(
                          color: isMine ? const Color(0xFFFFF7ED) : Colors.white,
                          border: Border.all(color: isMine ? const Color(0xFFFED7AA) : const Color(0xFFE2E8F0)),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(msg['sender_name']?.toString() ?? '담당자',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: Color(0xFF64748B))),
                            const SizedBox(height: 2),
                            Text(msg['content']?.toString() ?? '', style: const TextStyle(fontSize: 13, color: Color(0xFF0F172A))),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              // Chat Input Bar
              Container(
                padding: const EdgeInsets.all(12),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: msgController,
                        decoration: const InputDecoration(
                          hintText: '기술 사양, 납기, 단가 협상 메시지 입력...',
                          hintStyle: TextStyle(fontSize: 12),
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFC2410C),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                      onPressed: () async {
                        final text = msgController.text.trim();
                        if (text.isEmpty) return;
                        msgController.clear();
                        try {
                          await _apiClient.post('/inquiries/$threadId/messages', {
                            'content': text,
                          });
                        } catch (_) {}
                        setSheetState(() {
                          messages.add({
                            'id': 'msg-${DateTime.now().millisecondsSinceEpoch}',
                            'sender_name': widget.isSupplier ? '공급사 영업팀' : '구매사 조달팀',
                            'sender_role': widget.isSupplier ? 'SUPPLIER_SALES' : 'BUYER_PURCHASER',
                            'content': text,
                            'sent_at': DateTime.now().toIso8601String(),
                          });
                        });
                      },
                      child: const Icon(Icons.send, size: 18),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFFC2410C)));
    }

    return RefreshIndicator(
      onRefresh: _fetchThreads,
      color: const Color(0xFFC2410C),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDF4),
              border: Border.all(color: const Color(0xFF86EFAC)),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Row(
              children: [
                Icon(Icons.lock, color: Color(0xFF15803D), size: 18),
                SizedBox(width: 8),
                Expanded(
                  child: Text('알리바바 무역 보안 센터: 모든 1:1 상담 및 견적 대화록은 공증 보관됩니다.',
                      style: TextStyle(fontSize: 11, color: Color(0xFF166534), fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          if (_threads.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: Text('진행 중인 1:1 문의 대화가 없습니다.\n상품 상세 또는 카탈로그에서 문의를 시작하세요.',
                    textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF64748B), height: 1.5)),
              ),
            )
          else
            ..._threads.map((t) {
              final title = widget.isSupplier
                  ? (t['buyer_name']?.toString() ?? '바이어')
                  : (t['supplier_name']?.toString() ?? '공급사');
              final subject = t['listing_title']?.toString() ?? t['subject']?.toString() ?? '도매 문의';
              final status = t['status']?.toString() ?? 'OPEN';
              final msgs = (t['messages'] as List<dynamic>?) ?? [];
              final lastMsg = msgs.isNotEmpty ? msgs.last['content']?.toString() ?? '' : subject;

              return Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: const Color(0xFF173A5E),
                    child: Text(title.isNotEmpty ? title[0] : 'B', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                  title: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(child: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14))),
                      Chip(
                        label: Text(status, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF15803D))),
                        backgroundColor: const Color(0xFFDCFCE7),
                        padding: EdgeInsets.zero,
                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ],
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 2),
                      Text(subject, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFFC2410C))),
                      const SizedBox(height: 2),
                      Text(lastMsg, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)), maxLines: 1, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFF94A3B8)),
                  onTap: () => _openChatDialog(t),
                ),
              );
            }),
        ],
      ),
    );
  }
}
