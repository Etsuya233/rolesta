import { useParams } from "react-router-dom";
import { WorkspaceShell } from "../../workspace/components/workspace-shell";

export function WorkbenchPage() {
  const { chatId } = useParams();

  return <WorkspaceShell activeChatId={chatId} />;
}
