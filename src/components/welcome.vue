<template>
    <!-- 欢迎界面 --> 
    <div 
        class="welcome-box" 
        :class="{ 'welcome-box--moved': hasInteracted }"
    >
        <p class="welcome-box__title">SSE-Library</p>
        <div class="welcome-box__desc">Welcome to SSE-Library! Let's share knowladges.</div>
        <div class="welcome-box__hint" v-if="!hasInteracted">
        点击屏幕继续
        </div>
    </div>
</template>

<script>
</script>

<style scoped>
/* 欢迎界面样式 */
.welcome-box {
  position: absolute;
  width: 100%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #626062;
  transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 10;
  text-align: center;
  margin-bottom:20px;
}

/* 欢迎界面上移动画 */
.welcome-box--moved {
  top: 20%;
  transform: translate(-50%, -50%);
  opacity: 0.9;
}

.welcome-box__title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.welcome-box__desc {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  width: 100%;
  padding: 0 20px;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
}

.welcome-box__hint {
  font-size: 0.9rem;
  opacity: 0.8;
  animation: pulse 2s infinite;
}
</style>