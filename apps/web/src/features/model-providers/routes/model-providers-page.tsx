import { useNavigate } from 'react-router-dom';
import { ModelProviderManager } from '../components/model-provider-manager';

export function ModelProvidersPage() {
  const navigate = useNavigate();

  return <ModelProviderManager onBack={() => void navigate('/app')} />;
}
