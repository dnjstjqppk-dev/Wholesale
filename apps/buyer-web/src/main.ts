import '../../../packages/design-tokens/tokens.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

const app = createApp(App);
app.use(createPinia());
app.use(router);

function toErrorPage(err: unknown, source: string) {
  console.error(`[WHOLESALE buyer] ${source}:`, err);
  const current = router.currentRoute.value;
  if (current.name === 'server-error') return;
  const locale = (current.params.locale as string) || 'ko';
  const currency = (current.params.currency as string) || 'KRW';
  router.push(`/${locale}/${currency}/500`).catch(() => {});
}

app.config.errorHandler = (err) => toErrorPage(err, 'Unhandled render error');
router.onError((err) => toErrorPage(err, 'Router error'));

// Sentry: lazy-loaded only when VITE_SENTRY_DSN is set; otherwise console-only.
if (import.meta.env.VITE_SENTRY_DSN) {
  void import('@sentry/vue').then((Sentry) => {
    Sentry.init({
      app,
      dsn: import.meta.env.VITE_SENTRY_DSN as string,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0,
    });
    const prevHandler = app.config.errorHandler;
    app.config.errorHandler = (err, ...rest) => {
      Sentry.captureException(err);
      prevHandler?.(err, ...rest);
    };
  }).catch((e) => console.warn('[WHOLESALE buyer] Sentry init skipped:', e));
}

app.mount('#app');

