import { useCallback, useMemo, useState } from 'react';

export type CharacterCardPanel =
  | { name: 'list' }
  | { name: 'create' }
  | { name: 'edit'; characterId: string }
  | { name: 'advanced'; characterId: string }
  | { name: 'greetings'; characterId: string }
  | { name: 'import' };

const rootPanel: CharacterCardPanel = { name: 'list' };

export function useCharacterCardManager() {
  const [stack, setStack] = useState<CharacterCardPanel[]>([rootPanel]);
  const currentPanel = stack[stack.length - 1] ?? rootPanel;
  const isRoot = stack.length === 1;

  const pushPanel = useCallback((panel: CharacterCardPanel) => {
    setStack((items) => [...items, panel]);
  }, []);

  const popPanel = useCallback(() => {
    setStack((items) => (items.length > 1 ? items.slice(0, -1) : items));
  }, []);

  const replacePanel = useCallback((panel: CharacterCardPanel) => {
    setStack((items) => [...items.slice(0, -1), panel]);
  }, []);

  return useMemo(
    () => ({
      currentPanel,
      pushPanel,
      popPanel,
      replacePanel,
      isRoot,
    }),
    [currentPanel, isRoot, popPanel, pushPanel, replacePanel],
  );
}
