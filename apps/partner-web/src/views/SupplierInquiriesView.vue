<template>
  <div class="ws-page ws-page-wide">
    <div class="ws-page-head">
      <p class="ws-eyebrow">Buyer Inquiries</p>
      <div class="ws-page-head-row">
        <h1 class="ws-page-title">바이어 인콰이어리·기술 상담</h1>
        <div class="ws-page-actions">
          <button class="ws-btn ws-btn-secondary ws-btn-sm" @click="loadInquiries"><WsIcon name="refresh" :size="14" /> 목록 새로고침</button>
        </div>
      </div>
      <p class="ws-page-sub">상품 상세·카탈로그에서 접수된 1:1 견적/기술 문의에 답변하고 맞춤 조건을 제안합니다.</p>
    </div>

    <div v-if="loadError" class="ws-banner ws-banner-danger"><WsIcon name="alert" :size="16" /> {{ loadError }}</div>
    <div v-if="!loadError && inquiries.length === 0" class="ws-empty">
      <span class="ws-empty-icon"><WsIcon name="chat" :size="24" /></span>
      <h3>받은 문의가 없습니다</h3>
      <p>바이어가 상품 문의를 보내면 이 목록에 표시됩니다.</p>
    </div>

    <div class="inq-grid">
      <aside class="ws-card ws-card-pad-sm threads">
        <div v-for="t in inquiries" :key="t.id" class="thread" :class="{ active: activeThread?.id === t.id }" @click="activeThread = t">
          <span class="thread-top">
            <b><WsIcon name="building" :size="13" /> {{ t.buyer_name }}</b>
            <span class="ws-badge" :class="t.status === 'REPLIED' ? 'ws-badge-success' : 'ws-badge-warning'">{{ t.status }}</span>
          </span>
          <span class="thread-sub">{{ t.listing_title || t.subject }}</span>
          <span class="thread-prev">{{ t.messages?.[t.messages.length - 1]?.content }}</span>
        </div>
      </aside>

      <section v-if="activeThread" class="ws-card chat">
        <div class="ws-card-head chat-head">
          <div>
            <h3>{{ activeThread.buyer_name }} — {{ activeThread.listing_title }}</h3>
            <p class="ws-small ws-muted ws-figure" style="margin: 2px 0 0">스레드 {{ activeThread.id }}</p>
          </div>
          <span class="ws-badge ws-badge-success"><WsIcon name="shield" :size="12" /> Trade Assurance</span>
        </div>
        <div class="ws-chat chat-body">
          <div
            v-for="m in activeThread.messages"
            :key="m.id"
            class="ws-chat-msg"
            :class="m.sender_role?.startsWith('SUPPLIER') ? 'ws-chat-me' : 'ws-chat-them'"
          >
            <p class="msg-meta"><b>{{ m.sender_name }}</b> · {{ m.sender_role }}</p>
            <p class="msg-text">{{ m.content }}</p>
          </div>
        </div>
        <div class="reply-bar">
          <input v-model="replyText" type="text" class="ws-input" placeholder="납기·MOQ 조정·금형비 조건 또는 정식 견적 회신을 입력하세요..." @keyup.enter="sendReply" />
          <button class="ws-btn ws-btn-primary" :disabled="sending || !replyText.trim()" @click="sendReply">
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
.inq-grid { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 16px; align-items: start; }
.threads { max-height: 620px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
.thread { display: flex; flex-direction: column; gap: 4px; border: 1px solid transparent; border-radius: 10px; padding: 12px; cursor: pointer; }
.thread:hover { background: var(--ws-surface-muted); }
.thread.active { background: var(--ws-brand-faint); border-color: var(--ws-brand-light); }
.thread-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 13px; }
.thread-sub { font-size: 12px; font-weight: 700; color: var(--ws-brand); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.thread-prev { font-size: 12px; color: var(--ws-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chat { display: flex; flex-direction: column; min-height: 560px; }
.chat-head { border-bottom: 1px solid var(--ws-border-subtle); padding-bottom: 14px; }
.chat-body { flex: 1; max-height: 460px; overflow-y: auto; padding: 16px 4px; }
.msg-meta { margin: 0 0 4px; font-size: 11px; opacity: 0.75; }
.msg-text { margin: 0; }
.reply-bar { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; border-top: 1px solid var(--ws-border-subtle); padding-top: 12px; }
@media (max-width: 900px) {
  .inq-grid { grid-template-columns: minmax(0, 1fr); }
  .threads { max-height: 240px; }
}
</style>
