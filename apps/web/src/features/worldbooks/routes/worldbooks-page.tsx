import { useNavigate } from "react-router-dom";
import { WorldbookManager } from "../components/worldbook-manager";

export function WorldbooksPage() {
  const navigate = useNavigate();

  return <WorldbookManager onBack={() => void navigate("/app")} />;
}
