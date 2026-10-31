<template>
  <div class="messenger-page">
    <div class="messenger-header">
      <div>
        <h2>💬 글로벌 B2B 메신저 & 1:1 견적 문의 센터 (Alibaba Message Center)</h2>
        <p class="subtitle">인증 제조사와 실시간 기술 협의, 도면 공유 및 맞춤형 견적 카드를 주고받으세요.</p>
      </div>
      <span class="encryption-badge">🔒 TLS 1.3 & Trade Assurance 대화 기록 보관</span>
    </div>

    <div class="messenger-layout">
      <!-- Left: Thread List -->
      <aside class="thread-sidebar">
        <div class="sidebar-top">
          <h3>전체 대화 스레드 ({{ threads.length }})</h3>
          <button class="btn-refresh" @click="loadInquiries">↻</button>
        </div>

        <div v-if="loading" class="thread-empty">대화 목록 불러오는 중...</div>
        <div v-else-if="threads.length === 0" class="thread-empty">
          진행 중인 1:1 문의 내역이 없습니다.<br />상품 상세 또는 카탈로그에서 문의를 시작하세요.
        </div>
        <div v-else class="thread-list">
          <div
            v-for="t in threads"
            :key="t.id"
            class="thread-item"
            :class="{ active: activeThread?.id === t.id }"
            @click="selectThread(t)"
          >
            <div class="thread-row-top">
              <strong class="sup-name">🏭 {{ t.supplier_name }}</strong>
              <span class="status-pill" :class="t.status.toLowerCase()">{{ t.status }}</span>
            </div>
            <div class="thread-subject">{{ t.listing_title || t.subject }}</div>
            <div class="thread-preview">
              {{ t.messages?.[t.messages.length - 1]?.content || t.subject }}
            </div>
          </div>
        </div>
      </aside>

      <!-- Right: Active Conversation -->
      <section class="chat-panel">
        <div v-if="!activeThread" class="chat-placeholder">
          <p>좌측 목록에서 공급사 대화방을 선택하세요.</p>
        </div>
        <template v-else>
          <div class="chat-head">
            <div>
              <h3>{{ activeThread.supplier_name }}</h3>
              <span class="chat-sub">문의 품목: {{ activeThread.listing_title || activeThread.subject }}</span>
            </div>
            <router-link
              v-if="activeThread.listing_id"
              :to="`/${currentLocale}/${currentCurrency}/products/${activeThread.listing_id}`"
              class="btn-view-prod"
            >
              상품 상세 보기 →
            </router-link>
          </div>

          <div class="chat-messages">
            <div
              v-for="msg in activeThread.messages"
              :key="msg.id"
              class="msg-bubble-row"
              :class="{ mine: msg.sender_role?.startsWith('BUYER') }"
            >
              <div class="msg-bubble" :class="{ 'card-bubble': msg.message_type && msg.message_type !== 'TEXT' }">
                <div class="msg-meta">
                  <strong>{{ msg.sender_name }}</strong>
                  <span class="role-chip">{{ msg.sender_role }}</span>
                  <span class="time">{{ formatTime(msg.sent_at) }}</span>
                </div>

                <!-- 1. Interactive Quote Offer Card (TradeManager Standard) -->
                <div v-if="msg.message_type === 'QUOTE_OFFER' || msg.quote_card" class="interactive-quote-card">
                  <div class="iq-badge">🏷️ 실시간 공식 견적 제안서 (Official Quotation Offer)</div>
                  <h4 class="iq-title">{{ msg.quote_card?.title || activeThread.listing_title || activeThread.subject }}</h4>
                  <div class="iq-grid">
                    <div class="iq-item"><span class="k">제안 단가:</span><strong class="v">${{ msg.quote_card?.unit_price || '2.15' }} / {{ msg.quote_card?.unit || 'pcs' }}</strong></div>
                    <div class="iq-item"><span class="k">발주 수량:</span><strong class="v">{{ msg.quote_card?.quantity || 1000 }} {{ msg.quote_card?.unit || 'pcs' }}</strong></div>
                    <div class="iq-item"><span class="k">인도 조건:</span><strong class="v">{{ msg.quote_card?.incoterms || 'FOB Busan Port' }}</strong></div>
                    <div class="iq-item"><span class="k">생산 납기:</span><strong class="v">{{ msg.quote_card?.lead_time_days || 10 }}일 이내 출고</strong></div>
                  </div>
                  <div class="iq-total-bar">
                    <span>총 제안 공급가액:</span>
                    <strong class="iq-total-val">${{ ((Number(msg.quote_card?.unit_price) || 2.15) * (Number(msg.quote_card?.quantity) || 1000)).toLocaleString() }} USD</strong>
                  </div>
                  <div class="iq-actions">
                    <button class="btn-iq-accept" @click="acceptQuoteAndOrder(msg.quote_card)">
                      ✓ 견적 수락 및 발주서 작성 →
                    </button>
                    <button class="btn-iq-counter" @click="openQuoteComposer(msg.quote_card)">
                      ✕ 조건 수정 반대 제안 (Counter-Offer)
                    </button>
                  </div>
                </div>

                <!-- 2. Interactive Contract Signing Card -->
                <div v-else-if="msg.message_type === 'CONTRACT_SIGN' || msg.contract_card" class="interactive-contract-card">
                  <div class="ic-badge">📜 전자 무역 매매계약서 체결 요청 (ICC Model Contract)</div>
                  <div class="ic-details">
                    <p>계약서 식별 번호: <code>{{ msg.contract_card?.contract_number || 'CTR-2026-001' }}</code></p>
                    <p>총 계약 금액: <strong>${{ msg.contract_card?.total_amount || '4,200.00' }} USD</strong></p>
                    <p class="ic-hash">무결성 SHA-256 서명 해시: <code>{{ msg.contract_card?.sha256_hash || 'c67469723725e6e0d3c03848b1d619997f7bb7fa...' }}</code></p>
                  </div>
                  <router-link
                    :to="`/${currentLocale}/${currentCurrency}/contracts/CTR-2026-001`"
                    class="btn-ic-sign"
                  >
                    ✍️ 계약서 원문 열람 및 인앱 즉시 전자서명
                  </router-link>
                </div>

                <!-- 3. Interactive Escrow Payment Request Card -->
                <div v-else-if="msg.message_type === 'PAYMENT_REQUEST' || msg.payment_card" class="interactive-payment-card">
                  <div class="ip-badge">🛡️ Trade Assurance 에스크로 예치 청구</div>
                  <div class="ip-details">
                    <p>1차 선급금 예치액 (30%): <strong>${{ msg.payment_card?.amount_usd || '1,260.00' }} USD</strong></p>
                    <p>보관 기관: <strong>신한은행 B2B 무역 에스크로 신탁</strong></p>
                  </div>
                  <router-link
                    :to="`/${currentLocale}/${currentCurrency}/orders/ord-20261018-001`"
                    class="btn-ip-pay"
                  >
                    🏛️ 에스크로 가상계좌 입금 및 결제 바로가기 →
                  </router-link>
                </div>

                <!-- 4. Standard Text Message -->
                <div v-else>
                  <p class="msg-text">{{ translatedMessages[msg.id] || msg.content }}</p>
                  <div class="msg-translate-actions">
                    <button
                      type="button"
                      class="btn-translate-pill"
                      :disabled="translatingId === msg.id"
                      @click="toggleTranslate(msg)"
                    >
                      🌐 {{ translatingId === msg.id ? '번역 중...' : (translatedMessages[msg.id] ? '원본 보기' : '실시간 AI 번역') }}
                    </button>
                    <span v-if="translatedMessages[msg.id]" class="translated-meta-tag">
                      ✓ AI 번역됨 (Gemini B2B Neural)
                    </span>
                  </div>
                </div>

                <div v-if="msg.attachment_url" class="msg-attachment">
                  📎 첨부 도면/사양서: <a :href="msg.attachment_url" target="_blank">{{ msg.attachment_url }}</a>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Negotiation Action Bar (TradeManager Bar) -->
          <div class="chat-negotiation-bar">
            <span class="neg-title">⚡ 빠른 무역 협상 도구:</span>
            <button class="btn-neg-tool" @click="openQuoteComposer()">
              🏷️ 맞춤 견적 카드 제안
            </button>
            <button class="btn-neg-tool" @click="sendQuickCard('CONTRACT_SIGN')">
              📜 전자계약서 송부
            </button>
            <button class="btn-neg-tool" @click="sendQuickCard('PAYMENT_REQUEST')">
              🛡️ 에스크로 청구서 송부
            </button>
          </div>

          <div class="chat-input-bar">
            <input
              v-model="attachmentUrl"
              type="text"
              class="input-attach"
              placeholder="첨부 도면/CAD URL (선택)"
            />
            <div class="send-row">
              <input
                v-model="newMessage"
                type="text"
                class="input-msg"
                placeholder="공급사 담당자에게 기술 규격, 납기, 단가 협상 메시지를 입력하세요..."
                @keyup.enter="sendMessage"
              />
              <button class="btn-send" :disabled="sending || !newMessage.trim()" @click="sendMessage">
                {{ sending ? '전송 중...' : '메시지 전송' }}
              </button>
            </div>
          </div>
        </template>
      </section>
    </div>

    <!-- Interactive Quote Offer Composer Modal -->
    <div v-if="showQuoteModal" class="quote-modal-overlay" @click.self="showQuoteModal = false">
      <div class="quote-modal-card">
        <div class="qm-head">
          <h3>🏷️ 1:1 맞춤형 무역 견적 제안서 작성</h3>
          <button class="btn-close" @click="showQuoteModal = false">✕</button>
        </div>
        <div class="qm-body">
          <div class="qm-form-grid">
            <div>
              <label>제안 단가 (USD Unit Price)</label>
              <input v-model.number="quoteForm.unit_price" type="number" step="0.05" />
            </div>
            <div>
              <label>제안 수량 (Order Quantity)</label>
              <input v-model.number="quoteForm.quantity" type="number" step="10" />
            </div>
            <div>
              <label>무역 조건 (Incoterms 2020)</label>
              <select v-model="quoteForm.incoterms">
                <option value="FOB Busan Port">FOB Busan Port (본선인도)</option>
                <option value="CIF Incheon">CIF Incheon (운임보험료포함)</option>
                <option value="EXW Factory">EXW Factory (공장인도)</option>
                <option value="DDP Destination">DDP Destination (관세지급인도)</option>
              </select>
            </div>
            <div>
              <label>예상 생산 납기 (Lead Time)</label>
              <input v-model.number="quoteForm.lead_time_days" type="number" />
            </div>
          </div>
          <div class="qm-total-summary">
            <span>총 제안 거래 공급가:</span>
            <strong class="qm-total-price">${{ (quoteForm.unit_price * quoteForm.quantity).toLocaleString() }} USD</strong>
          </div>
        </div>
        <div class="qm-foot">
          <button class="btn-qm-cancel" @click="showQuoteModal = false">취소</button>
          <button class="btn-qm-submit" :disabled="sending" @click="sendQuoteOfferCard">
            {{ sending ? '전송 중...' : '견적 카드 대화방에 전송' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiRequest, getCurrentUser } from '../api';

const route = useRoute();
const router = useRouter();
const currentLocale = computed(() => (route.params.locale as string) || 'ko');
const currentCurrency = computed(() => (route.params.currency as string) || 'KRW');

const loading = ref(true);
const sending = ref(false);
const threads = ref<any[]>([]);
const activeThread = ref<any>(null);
const newMessage = ref('');
const attachmentUrl = ref('');

const showQuoteModal = ref(false);
const quoteForm = ref({
  unit_price: 2.15,
  quantity: 1000,
  incoterms: 'FOB Busan Port',
  lead_time_days: 10,
});

const translatedMessages = ref<Record<string, string>>({});
const translatingId = ref<string | null>(null);

async function toggleTranslate(msg: any) {
  if (translatedMessages.value[msg.id]) {
    delete translatedMessages.value[msg.id];
    return;
  }
  translatingId.value = msg.id;
  try {
    const res = await apiRequest('/inquiries/translate', {
      method: 'POST',
      body: JSON.stringify({
        text: msg.content,
        target_lang: currentLocale.value === 'ko' ? 'ko' : 'en',
      }),
    });
    translatedMessages.value[msg.id] = res.translated_text;
  } catch (err) {
    console.warn('Translate error:', err);
  } finally {
    translatingId.value = null;
  }
}

function formatTime(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function loadInquiries() {
  loading.value = true;
  try {
    const res = await apiRequest('/inquiries');
    threads.value = res.inquiries || [];
    const targetId = route.query.threadId as string;
    if (targetId) {
      const found = threads.value.find(t => t.id === targetId);
      if (found) activeThread.value = found;
    }
    if (!activeThread.value && threads.value.length > 0) {
      activeThread.value = threads.value[0];
    }
  } catch (e) {
    console.warn('Failed to load inquiries:', e);
  } finally {
    loading.value = false;
  }
}

function selectThread(t: any) {
  activeThread.value = t;
}

function openQuoteComposer(existingQuote?: any) {
  if (existingQuote) {
    quoteForm.value = {
      unit_price: Number(existingQuote.unit_price) || 2.15,
      quantity: Number(existingQuote.quantity) || 1000,
      incoterms: existingQuote.incoterms || 'FOB Busan Port',
      lead_time_days: Number(existingQuote.lead_time_days) || 10,
    };
  }
  showQuoteModal.value = true;
}

async function sendQuoteOfferCard() {
  if (!activeThread.value) return;
  sending.value = true;
  const user = getCurrentUser();
  try {
    const title = activeThread.value.listing_title || activeThread.value.subject || '무역 협상 품목';
    const msg = await apiRequest(`/inquiries/${activeThread.value.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        message_type: 'QUOTE_OFFER',
        content: `[공식 무역 견적 제안] ${title} - $${quoteForm.value.unit_price} / pc (수량: ${quoteForm.value.quantity.toLocaleString()}개, ${quoteForm.value.incoterms})`,
        quote_card: {
          title,
          unit_price: quoteForm.value.unit_price,
          quantity: quoteForm.value.quantity,
          incoterms: quoteForm.value.incoterms,
          lead_time_days: quoteForm.value.lead_time_days,
          unit: 'pcs',
        },
        sender_id: user.id,
        sender_name: user.full_name,
        sender_role: user.role,
      }),
    });
    if (!activeThread.value.messages) activeThread.value.messages = [];
    activeThread.value.messages.push(msg);
    showQuoteModal.value = false;
  } catch (err: any) {
    alert(`견적 카드 전송 실패: ${err.message}`);
  } finally {
    sending.value = false;
  }
}

async function sendQuickCard(type: 'CONTRACT_SIGN' | 'PAYMENT_REQUEST') {
  if (!activeThread.value) return;
  sending.value = true;
  const user = getCurrentUser();
  try {
    const payload: any = {
      message_type: type,
      sender_id: user.id,
      sender_name: user.full_name,
      sender_role: user.role,
    };
    if (type === 'CONTRACT_SIGN') {
      payload.content = '[전자 매매계약서 체결 요청] ICC 국제무역 표준 매매계약서 서명 대기';
      payload.contract_card = {
        contract_number: 'CTR-2026-001',
        total_amount: '4,200.00',
        sha256_hash: 'c67469723725e6e0d3c03848b1d619997f7bb7fae3230c33a92a2a0ff9f1406e',
      };
    } else {
      payload.content = '[Trade Assurance 에스크로 예치 청구서] 1차 선급금(30%) 신탁 가상계좌 보관 청구';
      payload.payment_card = {
        amount_usd: '1,260.00',
        bank_name: '신한은행 B2B 무역 에스크로 신탁',
      };
    }
    const msg = await apiRequest(`/inquiries/${activeThread.value.id}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!activeThread.value.messages) activeThread.value.messages = [];
    activeThread.value.messages.push(msg);
  } catch (err: any) {
    alert(`카드 전송 실패: ${err.message}`);
  } finally {
    sending.value = false;
  }
}

function acceptQuoteAndOrder(quoteCard: any) {
  router.push({
    path: `/${currentLocale.value}/${currentCurrency.value}/checkout`,
    query: {
      listing_id: activeThread.value?.listing_id || '33333333-3333-3333-3333-333333333333',
      quantity: String(quoteCard?.quantity || 1000),
      unit_price: String(quoteCard?.unit_price || '2.15'),
      incoterms: quoteCard?.incoterms || 'FOB Busan Port',
    },
  });
}

async function sendMessage() {
  if (!activeThread.value || !newMessage.value.trim()) return;
  sending.value = true;
  const user = getCurrentUser();
  try {
    const msg = await apiRequest(`/inquiries/${activeThread.value.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content: newMessage.value.trim(),
        attachment_url: attachmentUrl.value.trim() || undefined,
        sender_id: user.id,
        sender_name: user.full_name,
        sender_role: user.role,
      }),
    });
    if (!activeThread.value.messages) activeThread.value.messages = [];
    activeThread.value.messages.push(msg);
    newMessage.value = '';
    attachmentUrl.value = '';
  } catch (err: any) {
    alert(`메시지 전송 실패: ${err.message}`);
  } finally {
    sending.value = false;
  }
}

onMounted(() => {
  loadInquiries();
});
</script>

<style scoped>
.messenger-page { display: flex; flex-direction: column; gap: 20px; }
.messenger-header { display: flex; justify-content: space-between; align-items: center; background: #FFF; padding: 20px 24px; border-radius: 10px; border: 1px solid #E2E8F0; }
.messenger-header h2 { margin: 0 0 4px 0; font-size: 20px; color: #0F172A; }
.subtitle { margin: 0; font-size: 13px; color: #64748B; }
.encryption-badge { background: #F0FDF4; color: #15803D; border: 1px solid #86EFAC; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }

.messenger-layout { display: grid; grid-template-columns: 360px 1fr; gap: 20px; height: 680px; }
.thread-sidebar { background: #FFF; border: 1px solid #E2E8F0; border-radius: 10px; display: flex; flex-direction: column; overflow: hidden; }
.sidebar-top { padding: 16px; border-bottom: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center; background: #F8FAFC; }
.sidebar-top h3 { margin: 0; font-size: 14px; color: #1E293B; }
.btn-refresh { background: #FFF; border: 1px solid #CBD5E1; border-radius: 4px; cursor: pointer; padding: 2px 8px; }
.thread-empty { padding: 32px 16px; text-align: center; color: #64748B; font-size: 13px; }
.thread-list { flex: 1; overflow-y: auto; }
.thread-item { padding: 14px 16px; border-bottom: 1px solid #F1F5F9; cursor: pointer; transition: background 0.15s; }
.thread-item:hover { background: #F8FAFC; }
.thread-item.active { background: #FFF7ED; border-left: 4px solid #D64000; }
.thread-row-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.sup-name { font-size: 13px; color: #0F172A; }
.status-pill { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: #E2E8F0; color: #334155; }
.status-pill.replied { background: #DCFCE7; color: #15803D; }
.thread-subject { font-size: 12px; font-weight: 700; color: #CC3D00; margin-bottom: 4px; }
.thread-preview { font-size: 12px; color: #64748B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.chat-panel { background: #FFF; border: 1px solid #E2E8F0; border-radius: 10px; display: flex; flex-direction: column; overflow: hidden; }
.chat-placeholder { flex: 1; display: flex; align-items: center; justify-content: center; color: #64748B; }
.chat-head { padding: 16px 24px; border-bottom: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center; background: #F8FAFC; }
.chat-head h3 { margin: 0 0 2px 0; font-size: 16px; color: #0F172A; }
.chat-sub { font-size: 12px; color: #64748B; }
.btn-view-prod { font-size: 12px; font-weight: 700; color: #CC3D00; text-decoration: none; background: #FFF7ED; padding: 6px 12px; border-radius: 6px; border: 1px solid #FDBA74; }

.chat-messages { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; background: #F8FAFC; }
.msg-bubble-row { display: flex; justify-content: flex-start; }
.msg-bubble-row.mine { justify-content: flex-end; }
.msg-bubble { max-width: 76%; background: #FFF; border: 1px solid #E2E8F0; padding: 12px 16px; border-radius: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
.msg-bubble-row.mine .msg-bubble { background: #FFF7ED; border-color: #FDBA74; }
.msg-bubble.card-bubble { width: 420px; max-width: 90%; background: #FFFFFF; border: 1px solid #E2E8F0; }
.msg-bubble-row.mine .msg-bubble.card-bubble { background: #FFFDF9; border-color: #FDBA74; }
.msg-meta { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #64748B; margin-bottom: 6px; }
.role-chip { background: #F1F5F9; padding: 1px 6px; border-radius: 4px; font-weight: 600; }
.msg-text { margin: 0; font-size: 13px; color: #1E293B; line-height: 1.5; }
.msg-attachment { margin-top: 8px; padding-top: 6px; border-top: 1px dashed #CBD5E1; font-size: 12px; }

/* Interactive Cards Styling */
.interactive-quote-card {
  background: #FFFFFF;
  border: 1px solid #FED7AA;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.iq-badge {
  background: #FFF7ED;
  color: #C2410C;
  font-size: 11px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 4px;
  display: inline-block;
  width: fit-content;
}
.iq-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #0F172A;
}
.iq-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  font-size: 12px;
  background: #F8FAFC;
  padding: 8px;
  border-radius: 6px;
}
.iq-item .k { color: #64748B; margin-right: 4px; }
.iq-item .v { color: #0F172A; }
.iq-total-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  padding-top: 6px;
  border-top: 1px solid #FED7AA;
}
.iq-total-val {
  font-size: 16px;
  color: #C2410C;
}
.iq-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.btn-iq-accept {
  background: #C2410C;
  color: #FFF;
  border: none;
  padding: 8px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-iq-accept:hover { background: #EA580C; }
.btn-iq-counter {
  background: #FFF;
  color: #475569;
  border: 1px solid #CBD5E1;
  padding: 6px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
}

.interactive-contract-card {
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ic-badge {
  color: #15803D;
  font-weight: 700;
  font-size: 12px;
}
.ic-details { font-size: 12px; color: #1E293B; line-height: 1.6; }
.ic-details p { margin: 2px 0; }
.ic-hash { font-size: 10px; color: #64748B; word-break: break-all; }
.btn-ic-sign {
  background: #15803D;
  color: #FFF;
  text-align: center;
  text-decoration: none;
  padding: 8px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 12px;
}

.interactive-payment-card {
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ip-badge {
  color: #1D4ED8;
  font-weight: 700;
  font-size: 12px;
}
.ip-details { font-size: 12px; color: #1E293B; line-height: 1.6; }
.ip-details p { margin: 2px 0; }
.btn-ip-pay {
  background: #1D4ED8;
  color: #FFF;
  text-align: center;
  text-decoration: none;
  padding: 8px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 12px;
}

.msg-translate-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  padding-top: 4px;
  border-top: 1px dashed rgba(226, 232, 240, 0.8);
}
.btn-translate-pill {
  background: none;
  border: 1px solid #CBD5E1;
  color: #0284C7;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-translate-pill:hover {
  background: #F0F9FF;
  border-color: #38BDF8;
}
.translated-meta-tag {
  font-size: 10px;
  color: #16A34A;
  font-weight: 700;
}

/* Negotiation Tool Bar */
.chat-negotiation-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #FFF7ED;
  border-top: 1px solid #FED7AA;
  font-size: 12px;
  flex-wrap: wrap;
}
.neg-title { font-weight: 700; color: #9A3412; }
.btn-neg-tool {
  background: #FFFFFF;
  border: 1px solid #FDBA74;
  color: #C2410C;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-neg-tool:hover { background: #FFEDD5; }

.chat-input-bar { padding: 12px 16px; border-top: 1px solid #E2E8F0; background: #FFF; display: flex; flex-direction: column; gap: 8px; }
.input-attach { border: 1px solid #E2E8F0; border-radius: 6px; padding: 6px 10px; font-size: 12px; }
.send-row { display: flex; gap: 10px; }
.input-msg { flex: 1; border: 1px solid #CBD5E1; border-radius: 6px; padding: 10px 14px; font-size: 13px; outline: none; }
.input-msg:focus { border-color: #D64000; }
.btn-send { background: #D64000; color: #FFF; border: none; padding: 0 22px; border-radius: 6px; font-weight: 700; cursor: pointer; }

/* Quote Composer Modal */
.quote-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.quote-modal-card {
  background: #FFFFFF;
  border-radius: 10px;
  width: 520px;
  max-width: 90vw;
  box-shadow: 0 20px 40px rgba(0,0,0,0.25);
  overflow: hidden;
}
.qm-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: #FFF7ED;
  border-bottom: 1px solid #FED7AA;
}
.qm-head h3 { margin: 0; font-size: 15px; color: #9A3412; }
.btn-close { background: transparent; border: none; font-size: 16px; cursor: pointer; color: #64748B; }
.qm-body { padding: 18px; display: flex; flex-direction: column; gap: 14px; }
.qm-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.qm-form-grid label {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
  display: block;
  margin-bottom: 4px;
}
.qm-form-grid input, .qm-form-grid select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #CBD5E1;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
}
.qm-total-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #F8FAFC;
  border-radius: 6px;
  font-size: 13px;
}
.qm-total-price { font-size: 18px; color: #C2410C; }
.qm-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 18px;
  border-top: 1px solid #E2E8F0;
  background: #F8FAFC;
}
.btn-qm-cancel {
  background: #FFF;
  border: 1px solid #CBD5E1;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}
.btn-qm-submit {
  background: #C2410C;
  color: #FFF;
  border: none;
  padding: 8px 18px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .messenger-header { flex-direction: column; align-items: flex-start; gap: 10px; padding: 16px; }
  .messenger-layout { grid-template-columns: 1fr; height: auto; }
  .thread-sidebar { max-height: 280px; }
  .chat-panel { min-height: 440px; }
  .chat-head { padding: 12px 16px; }
  .chat-messages { padding: 14px; }
  .msg-bubble { max-width: 90%; }
}
</style>

