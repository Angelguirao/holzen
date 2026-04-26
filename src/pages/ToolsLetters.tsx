import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NoxHeaderMain } from '@/components/ui/nox-header';
import { LetterToFutureSelf } from '@/components/LetterToFutureSelf';
import { ProLock } from '@/components/ProLock';
import { Skeleton } from '@/components/ui/skeleton';
import { useHolzen } from '@/hooks/use-holzen';

/**
 * Pro feature: letters to your future self (BTC context). Lives under Tools, not Journey.
 */
export default function ToolsLetters() {
  const { t } = useTranslation();
  const { btcData } = useHolzen();
  const [searchParams] = useSearchParams();
  const letterId = searchParams.get('letter');

  return (
    <div className="space-y-6 pb-8">
      <NoxHeaderMain
        title={t('tools.letters')}
        subtitle={t('tools.lettersDesc')}
      />
      {btcData ? (
        <ProLock feature="letters" hideContent>
          <LetterToFutureSelf
            currentPrice={btcData.currentPrice}
            changePercent={btcData.changePercent}
            scrollToLetterId={letterId}
            autoOpenComposer={!letterId}
          />
        </ProLock>
      ) : (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      )}
    </div>
  );
}
