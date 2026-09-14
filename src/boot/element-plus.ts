import type { App } from 'vue';
import ElementPlus from 'element-plus';

export default ({ app }: { app: App }) => {
  app.use(ElementPlus);
};
