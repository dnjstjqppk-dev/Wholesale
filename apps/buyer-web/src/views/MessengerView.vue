<template>
  <div class="ws-page ws-page-wide">
    <div class="ws-page-head">
      <p class="ws-eyebrow">Message Center</p>
      <div class="ws-page-head-row">
        <h1 class="ws-page-title">B2B 메신저·1:1 문의 센터</h1>
        <span class="ws-badge ws-badge-success"><WsIcon name="lock" :size="12" /> TLS 1.3 · 대화 기록 보관</span>
      </div>
      <p class="ws-page-sub">인증 제조사와 실시간 기술 협의, 도면 공유, 맞춤형 견적 카드를 주고받으세요.</p>
    </div>

    <div class="msg-grid">
      <aside class="ws-card ws-card-pad-sm threads">
        <div class="ws-card-head">
          <h3>대화 스레드 ({{ threads.length }})</h3>
          <button class="ws-icon-btn" aria-label="새로고침" @click="loadInquiries"><WsIcon name="refresh" :size="15" /></button>
        </div>
        <div v-if="loading" class="ws-stack-sm">
          <div class="ws-skeleton" style="height: 64px"></div>
          <div class="ws-skeleton" style="height: 64px"></div>
        </div>
        <div v-else-if="threads.length === 0" class="ws-empty" style="padding: 28px 12px">
          <h3>진행 중인 문의가 없습니다</h3>
          <p>상품 상세·카탈로그에서 문의를 시작하세요.</p>
        </div>
        <div v-else class="thread-list">
          <button
            v-for="t in threads"
            :key="t.id"
            class="thread"
            :class="{ active: activeThread?.id === t.id }"
            @click="selectThread(t)"
          >
            <span class="thread-top">
              <b><WsIcon name="factory" :size="14" /> {{ t.supplier_name }}</b>
              <span class="ws-badge ws-badge-outline">{{ t.status }}</span>
            </span>
            <span class="thread-sub">{{ t.listing_title || t.subject }}</span>
            <span class="thread-prev">{{ t.messages?.[t.messages.length - 1]?.content || t.subject }}</span>
          </button>
        </div>
      </aside>

      <section class="ws-card chat">
        <div v-if="!activeThread" class="ws-empty">
          <span class="ws-empty-icon"><WsIcon name="chat" :size="24" /></span>
          <h3>대화방을 선택하세요</h3>
          <p>좌측 목록에서 공급사 대화방을 선택하세요.</p>
        </div>
        <template v-else>
          <div class="ws-card-head chat-head">
            <div>
              <h3>{{ activeThread.supplier_name }}</h3>
              <p class="ws-small ws-muted" style="margin: 2px 0 0">문의 품목: {{ activeThread.listing_title || activeThread.subject }}</p>
            </div>
            <router-link
              v-if="activeThread.listing_id"
              :to="`/${currentLocale}/${currentCurrency}/products/${activeThread.listing_id}`"
              class="ws-btn ws-btn-secondary ws-btn-sm"
            >
              상품 상세 보기 →
            </router-link>
          </div>

          <div class="ws-chat chat-body">
            <template v-for="msg in activeThread.messages" :key="msg.id">
              <div class="ws-chat-msg" :class="msg.sender_role?.startsWith('BUYER') ? 'ws-chat-me' : 'ws-chat-them'">
                <p class="msg-meta"><b>{{ msg.sender_name }}</b> · {{ msg.sender_role }} · {{ formatTime(msg.sent_at) }}</p>

                <div v-if="msg.message_type === 'QUOTE_OFFER' || msg.quote_card" class="q-card">
                  <p class="q-badge"><WsIcon name="tag" :size="13" /> 공식 견적 제안서</p>
                  <b>{{ msg.quote_card?.title || activeThread.listing_title || activeThread.subject }}</b>
                  <dl>
                    <div><dt>제안 단가</dt><dd class="ws-price ws-figure">${{ msg.quote_card?.unit_price || '2.15' }} / {{ msg.quote_card?.unit || 'pcs' }}</dd></div>
                    <div><dt>발주 수량</dt><dd class="ws-figure">{{ msg.quote_card?.quantity || 1000 }} {{ msg.quote_card?.unit || 'pcs' }}</dd></div>
                    <div><dt>인도 조건</dt><dd>{{ msg.quote_card?.incoterms || 'FOB Busan Port' }}</dd></div>
                    <div><dt>생산 납기</dt><dd>{{ msg.quote_card?.lead_time_days || 10 }}일 이내 출고</dd></div>
                  </dl>
                  <p class="q-total">총 제안 공급가액 <b class="ws-figure">${{ ((Number(msg.quote_card?.unit_price) || 2.15) * (Number(msg.quote_card?.quantity) || 1000)).toLocaleString() }} USD</b></p>
                  <div class="q-actions">
                    <button class="ws-btn ws-btn-primary ws-btn-sm" @click="acceptQuoteAndOrder(msg.quote_card)">견적 수락·발주서 작성 →</button>
                    <button class="ws-btn ws-btn-secondary ws-btn-sm" @click="openQuoteComposer(msg.quote_card)">조건 수정 반대 제안</button>
                  </div>
                </div>

                <div v-else-if="msg.message_type === 'CONTRACT_SIGN' || msg.contract_card" class="q-card">
                  <p class="q-badge"><WsIcon name="file" :size="13" /> 전자계약 체결 요청 (ICC)</p>
                  <p class="ws-small">계약 번호 <code>{{ msg.contract_card?.contract_number || 'CTR-2026-001' }}</code></p>
                  <p class="ws-small">총 계약 금액 <b class="ws-figure">${{ msg.contract_card?.total_amount || '4,200.00' }} USD</b></p>
                  <p class="ws-small ws-muted hash-line">SHA-256 <code>{{ msg.contract_card?.sha256_hash || 'c67469723725e6e0d3c03848b1d619997f7bb7fa...' }}</code></p>
                  <router-link :to="`/${currentLocale}/${currentCurrency}/contracts/CTR-2026-001`" class="ws-btn ws-btn-navy ws-btn-sm">
                    <WsIcon name="pencil" :size="13" /> 원문 열람·인앱 전자서명
                  </router-link>
                </div>

                <div v-else-if="msg.message_type === 'PAYMENT_REQUEST' || msg.payment_card" class="q-card">
                  <p class="q-badge"><WsIcon name="shield" :size="13" /> 에스크로 예치 청구</p>
                  <p class="ws-small">1차 선급금 (30%) <b class="ws-price ws-figure">${{ msg.payment_card?.amount_usd || '1,260.00' }} USD</b></p>
                  <p class="ws-small">보관 기관 <b>신한은행 B2B 무역 에스크로 신탁</b></p>
                  <router-link :to="`/${currentLocale}/${currentCurrency}/orders/ord-20261018-001`" class="ws-btn ws-btn-primary ws-btn-sm">
                    <WsIcon name="building" :size="13" /> 가상계좌 입금·결제 바로가기 →
                  </router-link>
                </div>

                <div v-else>
                  <p class="msg-text">{{ translatedMessages[msg.id] || msg.content }}</p>
                  <p class="translate-row">
                    <button type="button" class="ws-btn ws-btn-ghost ws-btn-sm" :disabled="translatingId === msg.id" @click="toggleTranslate(msg)">
                      <WsIcon name="globe" :size="13" /> {{ translatingId === msg.id ? '번역 중...' : (translatedMessages[msg.id] ? '원본 보기' : 'AI 번역') }}
                    </button>
                    <span v-if="translatedMessages[msg.id]" class="ws-badge ws-badge-success">AI 번역됨</span>
                  </p>
                </div>

                <p v-if="msg.attachment_url" class="attach-line">
                  <WsIcon name="file" :size="13" /> 첨부 도면/사양서: <a :href="msg.attachment_url" target="_blank">{{ msg.attachment_url }}</a>
                </p>
              </div>
            </template>
          </div>

          <div class="neg-bar">
            <span class="ws-small ws-strong"><WsIcon name="bolt" :size="14" class="neg-ico" /> 빠른 무역 협상</span>
            <button class="ws-btn ws-btn-secondary ws-btn-sm" @click="openQuoteComposer()"><WsIcon name="tag" :size="13" /> 견적 카드 제안</button>
            <button class="ws-btn ws-btn-secondary ws-btn-sm" @click="sendQuickCard('CONTRACT_SIGN')"><WsIcon name="file" :size="13" /> 전자계약서 송부</button>
            <button class="ws-btn ws-btn-secondary ws-btn-sm" @click="sendQuickCard('PAYMENT_REQUEST')"><WsIcon name="shield" :size="13" /> 에스크로 청구서 송부</button>
          </div>

          <div class="composer">
            <input v-model="attachmentUrl" type="text" class="ws-input" placeholder="첨부 도면/CAD URL (선택)" />
            <div class="composer-row">
              <input v-model="newMessage" type="text" class="ws-input" placeholder="기술 규격·납기·단가 협상 메시지를 입력하세요..." @keyup.enter="sendMessage" />
              <button class="ws-btn ws-btn-primary" :disabled="sending || !newMessage.trim()" @click="sendMessage">
                {{ sending ? '전송 중...' : '전송' }}
              </button>
            </div>
          </div>
        </template>
      </section>
    </div>

    <div v-if="showQuoteModal" class="ws-modal-backdrop" @click.self="showQuoteModal = false">
      <div class="ws-modal" role="dialog" aria-modal="true">
        <div class="ws-modal-head">
          <h3>맞춤형 견적 제안서 작성</h3>
          <button class="ws-icon-btn" aria-label="닫기" @click="showQuoteModal = false"><WsIcon name="x" :size="15" /></button>
        </div>
        <div class="ws-modal-body">
          <div class="ws-grid-2">
            <div class="ws-field"><label>제안 단가 (USD)</label><input v-model.number="quoteForm.unit_price" type="number" step="0.05" /></div>
            <div class="ws-field"><label>제안 수량</label><input v-model.number="quoteForm.quantity" type="number" step="10" /></div>
          </div>
          <div class="ws-field">
            <label>무역 조건 (Incoterms 2020)</label>
            <select v-model="quoteForm.incoterms">
              <option value="FOB Busan Port">FOB Busan Port (본선인도)</option>
              <option value="CIF Incheon">CIF Incheon (운임보험료포함)</option>
              <option value="EXW Factory">EXW Factory (공장인도)</option>
              <option value="DDP Destination">DDP Destination (관세지급인도)</option>
            </select>
          </div>
          <div class="ws-field">
            <label>예상 생산 납기 (일)</label>
            <input v-model.number="quoteForm.lead_time_days" type="number" />
          </div>
          <div class="pay-amount">
            <span>총 제안 거래 공급가</span>
            <b class="ws-figure">${{ (quoteForm.unit_price * quoteForm.quantity).toLocaleString() }} USD</b>
          </div>
        </div>
        <div class="ws-modal-foot">
          <button class="ws-btn ws-btn-secondary" @click="showQuoteModal = false">취소</button>
          <button class="ws-btn ws-btn-primary" :disabled="sending" @click="sendQuoteOfferCard">
            {{ sending ? '전송 중...' : '견적 카드 전송' }}
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
import WsIcon from '@packages/ui/WsIcon.vue';

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
.msg-grid { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 16px; align-items: start; }
.threads { max-height: calc(100vh - 220px); overflow-y: auto; }
.thread-list { display: flex; flex-direction: column; gap: 6px; }
.thread { display: flex; flex-direction: column; gap: 4px; text-align: left; background: none; border: 1px solid transparent; border-radius: 10px; padding: 12px; cursor: pointer; font-family: var(--ws-font); }
.thread:hover { background: var(--ws-surface-muted); }
.thread.active { background: var(--ws-brand-faint); border-color: var(--ws-brand-light); }
.thread-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 13px; color: var(--ws-text); }
.thread-sub { font-size: 13px; font-weight: 700; color: var(--ws-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.thread-prev { font-size: 12px; color: var(--ws-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chat { display: flex; flex-direction: column; min-height: 560px; }
.chat-head { border-bottom: 1px solid var(--ws-border-subtle); padding-bottom: 14px; }
.chat-body { flex: 1; max-height: 520px; overflow-y: auto; padding: 16px 4px; }
.msg-meta { margin: 0 0 6px; font-size: 11px; opacity: 0.75; }
.msg-text { margin: 0; }
.translate-row { display: flex; align-items: center; gap: 8px; margin: 8px 0 0; }
.ws-chat-me .translate-row .ws-btn { color: #fff; }
.attach-line { margin: 8px 0 0; font-size: 12px; }
.attach-line a { color: inherit; }
.q-card { background: rgb(255 255 255 / 0.96); color: var(--ws-text); border-radius: 8px; padding: 12px 14px; margin-top: 6px; font-size: 13px; }
.q-badge { margin: 0 0 6px; font-size: 11px; font-weight: 800; color: var(--ws-brand); display: flex; align-items: center; gap: 5px; }
.q-card dl { margin: 8px 0; }
.q-card dl div { display: flex; justify-content: space-between; gap: 12px; padding: 4px 0; border-top: 1px solid var(--ws-border-subtle); }
.q-card dl dt { color: var(--ws-text-muted); font-size: 12px; }
.q-card dl dd { margin: 0; font-weight: 800; font-size: 13px; }
.q-card .ws-small { margin: 4px 0; }
.hash-line code { font-size: 10px; word-break: break-all; }
.q-total { display: flex; justify-content: space-between; gap: 10px; background: var(--ws-brand-faint); border-radius: 6px; padding: 8px 10px; margin: 8px 0; font-size: 13px; }
.q-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.neg-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; border-top: 1px solid var(--ws-border-subtle); padding: 12px 0; }
.neg-ico { color: var(--ws-brand); vertical-align: -2px; }
.composer { display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--ws-border-subtle); padding-top: 12px; }
.composer-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
.pay-amount { display: flex; align-items: baseline; justify-content: space-between; background: var(--ws-brand-faint); border-radius: 8px; padding: 12px 14px; font-size: 13px; }
.pay-amount b { font-size: 18px; color: var(--ws-brand); }
@media (max-width: 900px) {
  .msg-grid { grid-template-columns: minmax(0, 1fr); }
  .threads { max-height: 260px; }
}
</style>
