<template>
  <div class="inq-page">
    <div class="head-row">
      <div>
        <h2>바이어 1:1 인콰이어리 및 기술 상담 센터 (Buyer Inquiries)</h2>
        <p class="subtitle">글로벌 바이어가 상품 상세 및 카탈로그에서 보낸 1:1 견적/기술 문의에 실시간 답변하고 맞춤 조건을 제안합니다.</p>
      </div>
      <button class="btn-refresh" @click="loadInquiries"><WsIcon name="refresh" :size="15" /> 문의 목록 새로고침</button>
    </div>

    <div v-if="loadError" class="ws-banner ws-banner-danger">{{ loadError }}</div>
    <div v-if="!loadError && inquiries.length === 0" class="ws-empty">
      <h3>받은 문의가 없습니다</h3>
      <p>바이어가 상품 문의를 보내면 이 목록에 표시됩니다.</p>
    </div>

    <div class="inq-layout">
      <!-- Thread Sidebar -->
      <aside class="thread-list">
        <div
          v-for="t in inquiries"
          :key="t.id"
          class="thread-card"
          :class="{ active: activeThread?.id === t.id }"
          @click="activeThread = t"
        >
          <div class="t-top">
            <strong><WsIcon name="building" :size="15" /> {{ t.buyer_name }}</strong>
            <span class="st-badge" :class="t.status.toLowerCase()">{{ t.status }}</span>
          </div>
          <div class="t-prod">{{ t.listing_title || t.subject }}</div>
          <div class="t-last">{{ t.messages?.[t.messages.length - 1]?.content }}</div>
        </div>
      </aside>

      <!-- Active Chat -->
      <section v-if="activeThread" class="chat-box">
        <div class="chat-header">
          <div>
            <h3>{{ activeThread.buyer_name }} — {{ activeThread.listing_title }}</h3>
            <span class="sub">스레드 ID: {{ activeThread.id }}</span>
          </div>
          <span class="ta-pill"><WsIcon name="shield" :size="15" /> Trade Assurance 보호 대화</span>
        </div>

        <div class="messages-area">
          <div
            v-for="m in activeThread.messages"
            :key="m.id"
            class="msg-row"
            :class="{ supplier: m.sender_role?.startsWith('SUPPLIER') }"
          >
            <div class="msg-card">
              <div class="m-head">
                <strong>{{ m.sender_name }}</strong>
                <span>({{ m.sender_role }})</span>
              </div>
              <p>{{ m.content }}</p>
            </div>
          </div>
        </div>

        <div class="reply-bar">
          <input
            v-model="replyText"
            type="text"
            placeholder="바이어에게 납기, MOQ 조정, 금형비 조건 또는 정식 견적 회신을 입력하세요..."
            @keyup.enter="sendReply"
          />
          <button class="btn-send" :disabled="sending || !replyText.trim()" @click="sendReply">
            {{ sending ? '전송 중...' : '공식 답변 전송' }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { apiRequest, getCurrentUser } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

const inquiries = ref<any[]>([]);
const activeThread = ref<any>(null);
const replyText = ref('');
const sending = ref(false);
const loadError = ref('');

async function loadInquiries() {
  loadError.value = '';
  try {
    const res = await apiRequest('/inquiries');
    inquiries.value = res.inquiries || [];
    if (!activeThread.value && inquiries.value.length > 0) {
      activeThread.value = inquiries.value[0];
    }
  } catch (e: any) {
    loadError.value = `문의 목록을 불러오지 못했습니다: ${e.message}`;
  }
}

async function sendReply() {
  if (!activeThread.value || !replyText.value.trim()) return;
  sending.value = true;
  const user = getCurrentUser();
  try {
    const msg = await apiRequest(`/inquiries/${activeThread.value.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content: replyText.value.trim(),
        sender_id: user.id,
        sender_name: user.full_name,
        sender_role: user.role,
      }),
    });
    activeThread.value.messages.push(msg);
    activeThread.value.status = 'REPLIED';
    replyText.value = '';
  } catch (err: any) {
    alert(`답변 전송 실패: ${err.message}`);
  } finally {
    sending.value = false;
  }
}

onMounted(() => {
  loadInquiries();
});
</script>

<style scoped>
.inq-page { max-width: 1080px; }
.head-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
h2 { margin: 0 0 4px 0; font-size: 20px; color: var(--ws-text); }
.subtitle { color: var(--ws-text-muted); font-size: 13px; margin: 0; }
.btn-refresh { background: var(--ws-surface); border: 1px solid #CBD5E1; padding: 8px 14px; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer; }
.inq-layout { display: grid; grid-template-columns: 340px 1fr; gap: 20px; height: 560px; }
.thread-list { background: var(--ws-surface); border: 1px solid var(--ws-border); border-radius: 8px; overflow-y: auto; }
.thread-card { padding: 14px 16px; border-bottom: 1px solid var(--ws-surface-muted); cursor: pointer; }
.thread-card.active { background: var(--ws-brand-light); border-left: 4px solid var(--ws-brand); }
.t-top { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
.st-badge { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: var(--ws-warning-bg); color: var(--ws-warning); }
.st-badge.replied { background: var(--ws-success-bg); color: var(--ws-success); }
.t-prod { font-size: 12px; font-weight: 700; color: var(--ws-brand); margin-bottom: 4px; }
.t-last { font-size: 12px; color: var(--ws-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.chat-box { background: var(--ws-surface); border: 1px solid var(--ws-border); border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; }
.chat-header { padding: 14px 20px; border-bottom: 1px solid var(--ws-border-subtle); background: var(--ws-surface-muted); display: flex; justify-content: space-between; align-items: center; }
.chat-header h3 { margin: 0; font-size: 15px; color: var(--ws-text); }
.chat-header .sub { font-size: 11px; color: var(--ws-text-muted); }
.ta-pill { background: var(--ws-success-bg); color: var(--ws-success); font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }
.messages-area { flex: 1; padding: 18px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; background: var(--ws-surface-muted); }
.msg-row { display: flex; justify-content: flex-start; }
.msg-row.supplier { justify-content: flex-end; }
.msg-card { max-width: 72%; background: var(--ws-surface); border: 1px solid var(--ws-border-subtle); padding: 12px 14px; border-radius: 8px; font-size: 13px; }
.msg-row.supplier .msg-card { background: var(--ws-brand-light); border-color: #FDBA74; }
.m-head { font-size: 11px; color: var(--ws-text-muted); margin-bottom: 4px; display: flex; gap: 6px; }
.msg-card p { margin: 0; color: var(--ws-text); }
.reply-bar { padding: 14px; border-top: 1px solid var(--ws-border-subtle); display: flex; gap: 10px; background: var(--ws-surface); }
.reply-bar input { flex: 1; padding: 10px 12px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 13px; }
.btn-send { background: var(--ws-brand); color: var(--ws-surface); border: none; padding: 0 20px; border-radius: 6px; font-weight: 700; cursor: pointer; }
</style>

