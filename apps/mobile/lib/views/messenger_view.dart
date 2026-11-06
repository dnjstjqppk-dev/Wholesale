import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/ws_theme.dart';

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
                  color: WsColors.navyInk,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: WsColors.brand,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        partnerName.isNotEmpty ? partnerName[0] : '?',
                        style: const TextStyle(
                            color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(partnerName,
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 14)),
                          Text(thread['listing_title']?.toString() ?? thread['subject']?.toString() ?? '문의 품목',
                              style: const TextStyle(color: Color(0xFF93A4BC), fontSize: 11),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis),
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
                    final isQuoteCard = msg['message_type'] == 'QUOTE_OFFER' || msg['quote_card'] != null;
                    final isContractCard = msg['message_type'] == 'CONTRACT_SIGN' || msg['contract_card'] != null;
                    final isPaymentCard = msg['message_type'] == 'PAYMENT_REQUEST' || msg['payment_card'] != null;

                    return Align(
                      alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.symmetric(vertical: 4),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
                        decoration: BoxDecoration(
                          color: isMine ? WsColors.navy : Colors.white,
                          border: Border.all(
                              color: isMine ? WsColors.navy : WsColors.borderSubtle),
                          borderRadius: BorderRadius.only(
                            topLeft: const Radius.circular(12),
                            topRight: const Radius.circular(12),
                            bottomLeft: Radius.circular(isMine ? 12 : 4),
                            bottomRight: Radius.circular(isMine ? 4 : 12),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(msg['sender_name']?.toString() ?? '담당자',
                                style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 10,
                                    color: isMine ? Colors.white70 : WsColors.muted)),
                            const SizedBox(height: 4),
                            if (isQuoteCard) ...[
                              _TradeCard(
                                badge: const WsBadge.brand('견적 제안', icon: Icons.tag),
                                lines: [
                                  '제안 단가: \$${msg['quote_card']?['unit_price'] ?? '2.15'} / pc',
                                  '발주 수량: ${msg['quote_card']?['quantity'] ?? '1,000'} pcs',
                                  '인도 조건: ${msg['quote_card']?['incoterms'] ?? 'FOB Busan Port'}',
                                ],
                              ),
                            ] else if (isContractCard) ...[
                              _TradeCard(
                                badge: const WsBadge.ok('전자계약 (ICC)', icon: Icons.description_outlined),
                                lines: [
                                  '계약총액: \$${msg['contract_card']?['total_amount'] ?? '4,200.00'} USD',
                                ],
                              ),
                            ] else if (isPaymentCard) ...[
                              _TradeCard(
                                badge: const WsBadge.info('에스크로 예치 청구', icon: Icons.shield_outlined),
                                lines: [
                                  '선급금(30%): \$${msg['payment_card']?['amount_usd'] ?? '1,260.00'} USD',
                                ],
                              ),
                            ] else ...[
                              Text(
                                msg['translated_text']?.toString() ?? msg['content']?.toString() ?? '',
                                style: TextStyle(
                                    fontSize: 13, color: isMine ? Colors.white : WsColors.text),
                              ),
                              const SizedBox(height: 6),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  InkWell(
                                    onTap: () async {
                                      if (msg['translated_text'] != null) {
                                        setSheetState(() {
                                          msg.remove('translated_text');
                                        });
                                        return;
                                      }
                                      try {
                                        final res = await _apiClient.post('/inquiries/translate', {
                                          'text': msg['content'] ?? '',
                                          'target_lang': 'ko',
                                        });
                                        if (res != null && res['translated_text'] != null) {
                                          setSheetState(() {
                                            msg['translated_text'] = res['translated_text'];
                                          });
                                        }
                                      } catch (_) {}
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: isMine
                                            ? Colors.white.withValues(alpha: 0.15)
                                            : WsColors.surfaceMuted,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.translate,
                                              size: 11,
                                              color: isMine ? Colors.white : WsColors.info),
                                          const SizedBox(width: 3),
                                          Text(
                                            msg['translated_text'] != null ? '원본 보기' : 'AI 번역',
                                            style: TextStyle(
                                                fontSize: 10,
                                                color: isMine ? Colors.white : WsColors.info,
                                                fontWeight: FontWeight.w700),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                  if (msg['translated_text'] != null) ...[
                                    const SizedBox(width: 6),
                                    const WsBadge.ok('AI 번역됨'),
                                  ],
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              // Quick Negotiation Action Bar
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: const BoxDecoration(
                  color: WsColors.brandFaint,
                  border: Border(
                    top: BorderSide(color: WsColors.brandLight),
                    bottom: BorderSide(color: WsColors.brandLight),
                  ),
                ),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.bolt, size: 13, color: WsColors.brand),
                          SizedBox(width: 2),
                          Text('무역 협상:',
                              style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: WsColors.brand)),
                        ],
                      ),
                      const SizedBox(width: 8),
                      _QuickAction(
                        icon: Icons.tag,
                        label: '견적 카드 송부',
                        color: WsColors.brand,
                        onTap: () async {
                          final quoteOffer = {
                            'unit_price_usd': '3.95',
                            'qty': 1000,
                            'total_usd': '3,950.00',
                            'incoterms': 'FOB Busan',
                            'lead_time_days': 14,
                            'status': 'OFFERED',
                          };
                          try {
                            await _apiClient.post('/inquiries/$threadId/messages', {
                              'content': '공식 견적서 제안 카드를 송부합니다.',
                              'message_type': 'QUOTE_OFFER',
                              'quote_card': quoteOffer,
                            });
                          } catch (_) {}
                          setSheetState(() {
                            messages.add({
                              'id': 'msg-${DateTime.now().millisecondsSinceEpoch}',
                              'sender_name': widget.isSupplier ? '공급사 영업팀' : '구매사 조달팀',
                              'sender_role': widget.isSupplier ? 'SUPPLIER_SALES' : 'BUYER_PURCHASER',
                              'content': '공식 견적서 제안 카드를 송부합니다.',
                              'message_type': 'QUOTE_OFFER',
                              'quote_card': quoteOffer,
                              'sent_at': DateTime.now().toIso8601String(),
                            });
                          });
                        },
                      ),
                      const SizedBox(width: 6),
                      _QuickAction(
                        icon: Icons.description_outlined,
                        label: '전자계약서 송부',
                        color: WsColors.info,
                        onTap: () async {
                          final contractCard = {
                            'contract_no': 'CTR-2026-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
                            'title': '국제 표준 B2B 수출입 물품 매매계약서',
                            'incoterms': 'FOB Busan',
                            'sha256_hash': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                            'status': 'AWAITING_SIGNATURE',
                          };
                          try {
                            await _apiClient.post('/inquiries/$threadId/messages', {
                              'content': 'ICC 표준 전자계약서 서명 요청 카드를 송부합니다.',
                              'message_type': 'CONTRACT_SIGN',
                              'contract_card': contractCard,
                            });
                          } catch (_) {}
                          setSheetState(() {
                            messages.add({
                              'id': 'msg-${DateTime.now().millisecondsSinceEpoch}',
                              'sender_name': widget.isSupplier ? '공급사 영업팀' : '구매사 조달팀',
                              'sender_role': widget.isSupplier ? 'SUPPLIER_SALES' : 'BUYER_PURCHASER',
                              'content': 'ICC 표준 전자계약서 서명 요청 카드를 송부합니다.',
                              'message_type': 'CONTRACT_SIGN',
                              'contract_card': contractCard,
                              'sent_at': DateTime.now().toIso8601String(),
                            });
                          });
                        },
                      ),
                      const SizedBox(width: 6),
                      _QuickAction(
                        icon: Icons.shield_outlined,
                        label: '에스크로 청구서 송부',
                        color: WsColors.success,
                        onTap: () async {
                          final paymentCard = {
                            'escrow_no': 'ESC-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
                            'amount_usd': '1,185.00',
                            'total_order_usd': '3,950.00',
                            'deposit_ratio': '30%',
                            'status': 'PENDING_DEPOSIT',
                          };
                          try {
                            await _apiClient.post('/inquiries/$threadId/messages', {
                              'content': '30% 선급금 안전결제(에스크로) 예치 청구서를 송부합니다.',
                              'message_type': 'PAYMENT_REQUEST',
                              'payment_card': paymentCard,
                            });
                          } catch (_) {}
                          setSheetState(() {
                            messages.add({
                              'id': 'msg-${DateTime.now().millisecondsSinceEpoch}',
                              'sender_name': widget.isSupplier ? '공급사 영업팀' : '구매사 조달팀',
                              'sender_role': widget.isSupplier ? 'SUPPLIER_SALES' : 'BUYER_PURCHASER',
                              'content': '30% 선급금 안전결제(에스크로) 예치 청구서를 송부합니다.',
                              'message_type': 'PAYMENT_REQUEST',
                              'payment_card': paymentCard,
                              'sent_at': DateTime.now().toIso8601String(),
                            });
                          });
                        },
                      ),
                    ],
                  ),
                ),
              ),
              // Chat Input Bar
              Container(
                padding: const EdgeInsets.all(12),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  border: Border(top: BorderSide(color: WsColors.borderSubtle)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: msgController,
                        decoration: const InputDecoration(
                          hintText: '기술 사양·납기·단가 협상 메시지 입력...',
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
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
      return const Center(child: CircularProgressIndicator(color: WsColors.brand));
    }

    return RefreshIndicator(
      onRefresh: _fetchThreads,
      color: WsColors.brand,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const WsBanner.ok('무역 보안 센터: 모든 1:1 상담·견적 대화록은 공증 보관됩니다.'),
          const SizedBox(height: 12),
          if (_threads.isEmpty)
            const WsEmpty(
              icon: Icons.forum_outlined,
              title: '진행 중인 1:1 문의 대화가 없습니다',
              body: '상품 상세 또는 카탈로그에서 문의를 시작하세요.',
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

              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Card(
                  child: ListTile(
                    contentPadding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    leading: Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: WsColors.navy,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      alignment: Alignment.center,
                      child: Text(title.isNotEmpty ? title[0] : 'B',
                          style: const TextStyle(
                              color: Colors.white, fontWeight: FontWeight.w800, fontSize: 17)),
                    ),
                    title: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                            child: Text(title,
                                style: const TextStyle(
                                    fontWeight: FontWeight.w800, fontSize: 14))),
                        WsBadge.ok(status),
                      ],
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 2),
                        Text(subject,
                            style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: WsColors.brand)),
                        const SizedBox(height: 2),
                        Text(lastMsg,
                            style: const TextStyle(fontSize: 11, color: WsColors.muted),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis),
                      ],
                    ),
                    trailing: const Icon(Icons.arrow_forward_ios,
                        size: 14, color: WsColors.faint),
                    onTap: () => _openChatDialog(t),
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }
}

class _TradeCard extends StatelessWidget {
  final WsBadge badge;
  final List<String> lines;
  const _TradeCard({required this.badge, required this.lines});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          badge,
          const SizedBox(height: 6),
          ...lines.map((l) => Padding(
                padding: const EdgeInsets.only(bottom: 2),
                child: Text(l,
                    style: const TextStyle(fontSize: 12, color: WsColors.text)),
              )),
        ],
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _QuickAction(
      {required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: WsColors.border),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 13, color: color),
            const SizedBox(width: 4),
            Text(label,
                style: TextStyle(
                    fontSize: 11, color: color, fontWeight: FontWeight.w800)),
          ],
        ),
      ),
    );
  }
}
