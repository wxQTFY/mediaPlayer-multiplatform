import { inject, provide } from 'vue';
import type { InjectionKey } from 'vue';
import type { PlayerWorkspace } from './usePlayerWorkspace';

const playerWorkspaceKey: InjectionKey<PlayerWorkspace> = Symbol('player-workspace');

export function providePlayerWorkspace(workspace: PlayerWorkspace): void {
  provide(playerWorkspaceKey, workspace);
}

export function useProvidedPlayerWorkspace(): PlayerWorkspace {
  const workspace = inject(playerWorkspaceKey);
  if (!workspace) {
    throw new Error('Player workspace has not been provided.');
  }
  return workspace;
}
