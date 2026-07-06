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
                <div
                    class="ai-summary-markdown"
                    v-html="renderMarkdown(summaryText || fallbackSummary)"
                ></div>
            </div>
            <div class="ai-summary-footer">
                <button class="primary-button" @click="loadSummary(true)" :disabled="loading">重新生成</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import MarkdownIt from 'markdown-it';
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
const fallbackSummary = "暂无总结。";

const markdown = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true,
});

markdown.renderer.rules.link_open = (tokens, index, options, _env, self) => {
    const token = tokens[index];
    if (!token) return "";

    token.attrSet("target", "_blank");
    token.attrSet("rel", "noopener noreferrer");
    return self.renderToken(tokens, index, options);
};

const renderMarkdown = (content: string) => {
    return markdown.render(content || "");
};

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
    white-space: normal;
}

.ai-summary-markdown {
    font-size: 14px;
    word-break: break-word;
}

.ai-summary-markdown :deep(p),
.ai-summary-markdown :deep(ul),
.ai-summary-markdown :deep(ol),
.ai-summary-markdown :deep(pre),
.ai-summary-markdown :deep(blockquote),
.ai-summary-markdown :deep(table),
.ai-summary-markdown :deep(h1),
.ai-summary-markdown :deep(h2),
.ai-summary-markdown :deep(h3),
.ai-summary-markdown :deep(h4),
.ai-summary-markdown :deep(h5),
.ai-summary-markdown :deep(h6) {
    margin: 0 0 10px;
}

.ai-summary-markdown :deep(p:last-child),
.ai-summary-markdown :deep(ul:last-child),
.ai-summary-markdown :deep(ol:last-child),
.ai-summary-markdown :deep(pre:last-child),
.ai-summary-markdown :deep(blockquote:last-child),
.ai-summary-markdown :deep(table:last-child) {
    margin-bottom: 0;
}

.ai-summary-markdown :deep(h1),
.ai-summary-markdown :deep(h2),
.ai-summary-markdown :deep(h3),
.ai-summary-markdown :deep(h4),
.ai-summary-markdown :deep(h5),
.ai-summary-markdown :deep(h6) {
    color: #333;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.45;
}

.ai-summary-markdown :deep(ul),
.ai-summary-markdown :deep(ol) {
    padding-left: 22px;
}

.ai-summary-markdown :deep(li + li) {
    margin-top: 4px;
}

.ai-summary-markdown :deep(pre) {
    max-width: 100%;
    overflow-x: auto;
    padding: 10px;
    border-radius: 6px;
    background: #111827;
    color: #f9fafb;
    line-height: 1.5;
}

.ai-summary-markdown :deep(code) {
    border-radius: 4px;
    padding: 2px 5px;
    background: #eef2ff;
    color: #4c1d95;
    font-family: Consolas, "Courier New", monospace;
    font-size: 13px;
}

.ai-summary-markdown :deep(pre code) {
    padding: 0;
    background: transparent;
    color: inherit;
}

.ai-summary-markdown :deep(blockquote) {
    padding-left: 10px;
    border-left: 3px solid #c7d2fe;
    color: #4b5563;
}

.ai-summary-markdown :deep(table) {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}

.ai-summary-markdown :deep(th),
.ai-summary-markdown :deep(td) {
    padding: 6px 8px;
    border: 1px solid #e5e7eb;
    text-align: left;
    vertical-align: top;
}

.ai-summary-markdown :deep(th) {
    background: #f3f4f6;
    font-weight: 700;
}

.ai-summary-markdown :deep(a) {
    color: #1890ff;
    text-decoration: underline;
    text-underline-offset: 2px;
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
