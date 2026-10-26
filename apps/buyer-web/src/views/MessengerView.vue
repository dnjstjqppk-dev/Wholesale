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
              <div class="msg-bubble">
                <div class="msg-meta">
                  <strong>{{ msg.sender_name }}</strong>
                  <span class="role-chip">{{ msg.sender_role }}</span>
                  <span class="time">{{ formatTime(msg.sent_at) }}</span>
                </div>
                <p class="msg-text">{{ msg.content }}</p>
                <div v-if="msg.attachment_url" class="msg-attachment">
                  📎 첨부 도면/사양서: <a :href="msg.attachment_url" target="_blank">{{ msg.attachment_url }}</a>
                </div>
              </div>
            </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { apiRequest, getCurrentUser } from '../api';

const route = useRoute();
const currentLocale = computed(() => (route.params.locale as string) || 'ko');
const currentCurrency = computed(() => (route.params.currency as string) || 'KRW');

const loading = ref(true);
const sending = ref(false);
const threads = ref<any[]>([]);
const activeThread = ref<any>(null);
const newMessage = ref('');
const attachmentUrl = ref('');

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

.messenger-layout { display: grid; grid-template-columns: 360px 1fr; gap: 20px; height: 640px; }
.thread-sidebar { background: #FFF; border: 1px solid #E2E8F0; border-radius: 10px; display: flex; flex-direction: column; overflow: hidden; }
.sidebar-top { padding: 16px; border-bottom: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center; background: #F8FAFC; }
.sidebar-top h3 { margin: 0; font-size: 14px; color: #1E293B; }
.btn-refresh { background: #FFF; border: 1px solid #CBD5E1; border-radius: 4px; cursor: pointer; padding: 2px 8px; }
.thread-empty { padding: 32px 16px; text-align: center; color: #64748B; font-size: 13px; }
.thread-list { flex: 1; overflow-y: auto; }
.thread-item { padding: 14px 16px; border-bottom: 1px solid #F1F5F9; cursor: pointer; transition: background 0.15s; }
.thread-item:hover { background: #F8FAFC; }
.thread-item.active { background: #FFF7ED; border-left: 4px solid #FF6600; }
.thread-row-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.sup-name { font-size: 13px; color: #0F172A; }
.status-pill { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: #E2E8F0; color: #334155; }
.status-pill.replied { background: #DCFCE7; color: #15803D; }
.thread-subject { font-size: 12px; font-weight: 700; color: #EA580C; margin-bottom: 4px; }
.thread-preview { font-size: 12px; color: #64748B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.chat-panel { background: #FFF; border: 1px solid #E2E8F0; border-radius: 10px; display: flex; flex-direction: column; overflow: hidden; }
.chat-placeholder { flex: 1; display: flex; align-items: center; justify-content: center; color: #64748B; }
.chat-head { padding: 16px 24px; border-bottom: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center; background: #F8FAFC; }
.chat-head h3 { margin: 0 0 2px 0; font-size: 16px; color: #0F172A; }
.chat-sub { font-size: 12px; color: #64748B; }
.btn-view-prod { font-size: 12px; font-weight: 700; color: #EA580C; text-decoration: none; background: #FFF7ED; padding: 6px 12px; border-radius: 6px; border: 1px solid #FDBA74; }

.chat-messages { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; background: #F8FAFC; }
.msg-bubble-row { display: flex; justify-content: flex-start; }
.msg-bubble-row.mine { justify-content: flex-end; }
.msg-bubble { max-width: 72%; background: #FFF; border: 1px solid #E2E8F0; padding: 12px 16px; border-radius: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
.msg-bubble-row.mine .msg-bubble { background: #FFF7ED; border-color: #FDBA74; }
.msg-meta { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #64748B; margin-bottom: 6px; }
.role-chip { background: #F1F5F9; padding: 1px 6px; border-radius: 4px; font-weight: 600; }
.msg-text { margin: 0; font-size: 13px; color: #1E293B; line-height: 1.5; }
.msg-attachment { margin-top: 8px; padding-top: 6px; border-top: 1px dashed #CBD5E1; font-size: 12px; }

.chat-input-bar { padding: 14px 20px; border-top: 1px solid #E2E8F0; background: #FFF; display: flex; flex-direction: column; gap: 8px; }
.input-attach { border: 1px solid #E2E8F0; border-radius: 6px; padding: 6px 10px; font-size: 12px; }
.send-row { display: flex; gap: 10px; }
.input-msg { flex: 1; border: 1px solid #CBD5E1; border-radius: 6px; padding: 10px 14px; font-size: 13px; outline: none; }
.input-msg:focus { border-color: #FF6600; }
.btn-send { background: #FF6600; color: #FFF; border: none; padding: 0 22px; border-radius: 6px; font-weight: 700; cursor: pointer; }

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

