import { Import, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { MobileTopBar } from "../../assets/components/mobile-top-bar";
import { CharacterCardForm } from "./character-card-form";
import { CharacterCardListPanel } from "./character-card-list-panel";
import { CharacterGreetingsEditor } from "./character-greetings-editor";
import { CharacterImportPanel } from "./character-import-panel";
import {
  type CharacterCardPanel,
  useCharacterCardManager,
} from "../hooks/use-character-card-manager";

export interface CharacterCardManagerProps {
  onBack: () => void;
}

export function CharacterCardManager({ onBack }: CharacterCardManagerProps) {
  const { currentPanel, isRoot, popPanel, pushPanel, replacePanel } =
    useCharacterCardManager();

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
          currentPanel.name === "list" ? (
            <>
              <IconAction
                label="导入角色卡"
                onClick={() => pushPanel({ name: "import" })}
              >
                <Import aria-hidden="true" className="size-5" />
              </IconAction>
              <IconAction
                label="新增角色卡"
                onClick={() => pushPanel({ name: "create" })}
              >
                <Plus aria-hidden="true" className="size-5" />
              </IconAction>
            </>
          ) : null
        }
        title={panelTitle(currentPanel)}
        onBack={handleBack}
      />

      <CharacterCardListPanel
        hidden={currentPanel.name !== "list"}
        onSelectCharacter={(characterId) =>
          pushPanel({ name: "edit", characterId })
        }
      />

      {currentPanel.name !== "list" ? (
        <PanelShell
          panel={currentPanel}
          pushPanel={pushPanel}
          replacePanel={replacePanel}
        />
      ) : null}
    </main>
  );
}

function PanelShell({
  panel,
  pushPanel,
  replacePanel,
}: {
  panel: Exclude<CharacterCardPanel, { name: "list" }>;
  pushPanel: (panel: CharacterCardPanel) => void;
  replacePanel: (panel: CharacterCardPanel) => void;
}) {
  if (panel.name === "create") {
    return (
      <CharacterCardForm
        onCreated={(characterId) => replacePanel({ name: "edit", characterId })}
        onOpenGreetings={(characterId) =>
          pushPanel({ name: "greetings", characterId })
        }
      />
    );
  }

  if (panel.name === "edit") {
    return (
      <CharacterCardForm
        characterId={panel.characterId}
        onCreated={(characterId) => replacePanel({ name: "edit", characterId })}
        onOpenGreetings={(characterId) =>
          pushPanel({ name: "greetings", characterId })
        }
      />
    );
  }

  if (panel.name === "greetings") {
    return <CharacterGreetingsEditor characterId={panel.characterId} />;
  }

  return (
    <CharacterImportPanel
      onImported={(characterId) => replacePanel({ name: "edit", characterId })}
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
  if (panel.name === "list") {
    return "角色卡";
  }
  if (panel.name === "create") {
    return "新增角色卡";
  }
  if (panel.name === "edit") {
    return "编辑角色卡";
  }
  if (panel.name === "greetings") {
    return "开场消息";
  }

  return "导入角色卡";
}
