<template>
    <div v-if="visible" class="ai-summary-modal-overlay" @click.self="closeModal">
        <div class="ai-summary-modal-content">
            <div class="ai-summary-header">
                <h3>✨ AI 总结</h3>
                <button class="close-btn" @click="closeModal">&times;</button>
            </div>
            <div class="ai-summary-body" v-if="loading">
                <p>正在生成总结，请稍候...</p>
            </div>
            <div class="ai-summary-body" v-else>
                <p>{{ summaryText || "暂无总结。" }}</p>
            </div>
            <div class="ai-summary-footer">
                <button class="primary-button" @click="loadSummary(true)" :disabled="loading">重新生成</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { getAIsummary, type AISummaryData } from '@/api/ai';

const props = defineProps<{
    visible: boolean;
    contentType: 'document' | 'post';
    contentId: string | number;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
}>();

const loading = ref(false);
const summaryText = ref("");

type SummaryApiEnvelope = {
    code?: number;
    message?: string;
    data?: AISummaryData;
};

const unwrapSummaryResponse = (response: unknown): SummaryApiEnvelope => {
    if (!response || typeof response !== 'object') return {};
    const direct = response as SummaryApiEnvelope;
    if (typeof direct.code === 'number') return direct;
    const wrapped = (response as { data?: SummaryApiEnvelope }).data;
    if (wrapped && typeof wrapped === 'object') return wrapped;
    return {};
};

const loadSummary = async (regenerate = false) => {
    if (!props.contentId) return;

    loading.value = true;
    summaryText.value = "";
    try {
        const res = await getAIsummary(props.contentType, String(props.contentId), regenerate);
        const payload = unwrapSummaryResponse(res);
        if ((payload.code === 0 || payload.code === 200) && payload.data) {
            summaryText.value = payload.data.summary || "总结生成中。";
        } else {
            summaryText.value = "获取总结失败: " + (payload.message || "未知错误");
        }
    } catch (error) {
        summaryText.value = "请求失败，请稍后再试。";
    } finally {
        loading.value = false;
    }
};

watch(() => props.visible, (newVal) => {
    if (newVal) {
        loadSummary();
    }
});

watch(() => [props.contentType, props.contentId], () => {
    summaryText.value = "";
    if (props.visible) {
        loadSummary();
    }
});

const closeModal = () => {
    emit('update:visible', false);
};
</script>

<style scoped>
.ai-summary-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.ai-summary-modal-content {
    background: white;
    border-radius: 8px;
    width: 400px;
    max-width: 90vw;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.ai-summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #eee;
}

.ai-summary-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #333;
}

.close-btn {
    background: transparent;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #999;
}

.ai-summary-body {
    padding: 20px;
    min-height: 100px;
    max-height: 60vh;
    overflow-y: auto;
    color: #555;
    line-height: 1.5;
    white-space: pre-wrap;
}

.ai-summary-footer {
    padding: 16px 20px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
}

.primary-button {
    background-color: #1890ff;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
}

.primary-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}
</style>
