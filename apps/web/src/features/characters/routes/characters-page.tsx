import { useNavigate } from 'react-router-dom';
import { CharacterCardManager } from '../components/character-card-manager';

export function CharactersPage() {
  const navigate = useNavigate();

  return <CharacterCardManager onBack={() => void navigate('/app')} />;
}
