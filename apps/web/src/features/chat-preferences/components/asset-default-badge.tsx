import { useTranslation } from 'react-i18next';
import { Badge } from '../../../components/ui/badge';
import type { AssetDefaultKind } from './asset-default-button';

export function AssetDefaultBadge({ kind }: { kind: AssetDefaultKind }) {
  const { t } = useTranslation();
  const label =
    kind === 'persona'
      ? t('chatPreferences.badges.persona')
      : kind === 'preset'
        ? t('chatPreferences.badges.preset')
        : t('chatPreferences.badges.connection');

  return (
    <Badge className="shrink-0" variant="secondary">
      {label}
    </Badge>
  );
}
