import { Import, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { MobileTopBar } from '../../assets/components/mobile-top-bar';
import { CharacterCardListPanel } from './character-card-list-panel';
import {
  type CharacterCardPanel,
  useCharacterCardManager,
} from '../hooks/use-character-card-manager';

export interface CharacterCardManagerProps {
  onBack: () => void;
}

export function CharacterCardManager({ onBack }: CharacterCardManagerProps) {
  const { currentPanel, isRoot, popPanel, pushPanel } = useCharacterCardManager();

  function handleBack() {
    if (isRoot) {
      onBack();
      return;
    }

    popPanel();
  }

  return (
    <main className="flex h-dvh min-h-screen flex-col bg-background text-foreground">
      <MobileTopBar
        actions={
          currentPanel.name === 'list' ? (
            <>
              <IconAction label="导入角色卡" onClick={() => pushPanel({ name: 'import' })}>
                <Import aria-hidden="true" className="size-5" />
              </IconAction>
              <IconAction label="新增角色卡" onClick={() => pushPanel({ name: 'create' })}>
                <Plus aria-hidden="true" className="size-5" />
              </IconAction>
            </>
          ) : null
        }
        title={panelTitle(currentPanel)}
        onBack={handleBack}
      />

      <CharacterCardListPanel
        hidden={currentPanel.name !== 'list'}
        onSelectCharacter={(characterId) => pushPanel({ name: 'edit', characterId })}
      />

      {currentPanel.name !== 'list' ? <PanelShell panel={currentPanel} /> : null}
    </main>
  );
}

function PanelShell({ panel }: { panel: Exclude<CharacterCardPanel, { name: 'list' }> }) {
  return (
    <section
      aria-label={panelTitle(panel)}
      className="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto"
    />
  );
}

function IconAction({
  label,
  children,
  onClick,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="inline-flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30"
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function panelTitle(panel: CharacterCardPanel): string {
  if (panel.name === 'list') {
    return '角色卡';
  }
  if (panel.name === 'create') {
    return '新增角色卡';
  }
  if (panel.name === 'edit') {
    return '编辑角色卡';
  }
  if (panel.name === 'advanced') {
    return '高级定义';
  }
  if (panel.name === 'greetings') {
    return '开场消息';
  }

  return '导入角色卡';
}
