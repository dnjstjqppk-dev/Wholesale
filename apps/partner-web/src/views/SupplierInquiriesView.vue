<template>
  <div class="inq-page">
    <div class="head-row">
      <div>
        <h2>바이어 1:1 인콰이어리 및 기술 상담 센터 (Buyer Inquiries)</h2>
        <p class="subtitle">글로벌 바이어가 상품 상세 및 카탈로그에서 보낸 1:1 견적/기술 문의에 실시간 답변하고 맞춤 조건을 제안합니다.</p>
      </div>
      <button class="btn-refresh" @click="loadInquiries">↻ 문의 목록 새로고침</button>
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
            <strong>🏢 {{ t.buyer_name }}</strong>
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
          <span class="ta-pill">🛡️ Trade Assurance 보호 대화</span>
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

const inquiries = ref<any[]>([]);
const activeThread = ref<any>(null);
const replyText = ref('');
const sending = ref(false);

async function loadInquiries() {
  try {
    const res = await apiRequest('/inquiries');
    inquiries.value = res.inquiries || [];
    if (!activeThread.value && inquiries.value.length > 0) {
      activeThread.value = inquiries.value[0];
    }
  } catch (e) {
    console.warn('Inquiries load failed:', e);
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
h2 { margin: 0 0 4px 0; font-size: 20px; color: #172B4D; }
.subtitle { color: #64748B; font-size: 13px; margin: 0; }
.btn-refresh { background: #FFF; border: 1px solid #CBD5E1; padding: 8px 14px; border-radius: 6px; font-weight: 700; font-size: 12px; cursor: pointer; }
.inq-layout { display: grid; grid-template-columns: 340px 1fr; gap: 20px; height: 560px; }
.thread-list { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; overflow-y: auto; }
.thread-card { padding: 14px 16px; border-bottom: 1px solid #F1F5F9; cursor: pointer; }
.thread-card.active { background: #FFEDD5; border-left: 4px solid #C2410C; }
.t-top { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
.st-badge { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: #FEF3C7; color: #B45309; }
.st-badge.replied { background: #DCFCE7; color: #15803D; }
.t-prod { font-size: 12px; font-weight: 700; color: #C2410C; margin-bottom: 4px; }
.t-last { font-size: 12px; color: #64748B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.chat-box { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; }
.chat-header { padding: 14px 20px; border-bottom: 1px solid #E2E8F0; background: #F8FAFC; display: flex; justify-content: space-between; align-items: center; }
.chat-header h3 { margin: 0; font-size: 15px; color: #172B4D; }
.chat-header .sub { font-size: 11px; color: #64748B; }
.ta-pill { background: #DCFCE7; color: #15803D; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }
.messages-area { flex: 1; padding: 18px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; background: #F8FAFC; }
.msg-row { display: flex; justify-content: flex-start; }
.msg-row.supplier { justify-content: flex-end; }
.msg-card { max-width: 72%; background: #FFF; border: 1px solid #E2E8F0; padding: 12px 14px; border-radius: 8px; font-size: 13px; }
.msg-row.supplier .msg-card { background: #FFF7ED; border-color: #FDBA74; }
.m-head { font-size: 11px; color: #64748B; margin-bottom: 4px; display: flex; gap: 6px; }
.msg-card p { margin: 0; color: #0F172A; }
.reply-bar { padding: 14px; border-top: 1px solid #E2E8F0; display: flex; gap: 10px; background: #FFF; }
.reply-bar input { flex: 1; padding: 10px 12px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 13px; }
.btn-send { background: #C2410C; color: #FFF; border: none; padding: 0 20px; border-radius: 6px; font-weight: 700; cursor: pointer; }
</style>

