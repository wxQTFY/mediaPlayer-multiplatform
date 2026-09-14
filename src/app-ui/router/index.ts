import { ref } from 'vue';

const currentRoute = ref({ path: '/' });

const router = {
  currentRoute,
  async push(path: string) {
    currentRoute.value = { path };
  }
};

export default router;
