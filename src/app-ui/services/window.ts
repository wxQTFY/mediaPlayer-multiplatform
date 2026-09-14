
import { getPlatformAdapter } from '@/app-ui/adapters';

export const minusWindow = (): void => {
  void getPlatformAdapter().window.minimize();
};

export const maxWindow = (): void => {
  void getPlatformAdapter().window.maximize();
};

export const closeWindow = (): void => {
  void getPlatformAdapter().window.close();
};
