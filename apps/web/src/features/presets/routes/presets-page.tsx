import { useNavigate } from 'react-router-dom';
import { PresetManager } from '../components/preset-manager';

export function PresetsPage() {
  const navigate = useNavigate();

  return <PresetManager onBack={() => void navigate('/app')} />;
}
