import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { fetchHistoryCalendarActivities } from '@/lib/history-calendar-activities-fetch';
import {
  historyCalendarActivitiesQueryKey,
  invalidateHistoryCalendarActivities,
} from '@/lib/history-calendar-activities-query-key';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { HistoryCalendar } from '@/components/HistoryCalendar';

const HistoryContent = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const {
    data: activities = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: userId ? historyCalendarActivitiesQueryKey(userId) : ['history-calendar', 'activities', 'none'],
    queryFn: () => fetchHistoryCalendarActivities(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const loading = Boolean(userId) && isPending;
  const loadFailed = Boolean(userId) && isError;

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    );
  }

  if (loadFailed) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex flex-col gap-3 text-left">
          <p>{t('journey.activityLoadFailed')}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => {
              if (userId) invalidateHistoryCalendarActivities(queryClient, userId);
            }}
          >
            {t('common.tryAgain')}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <HistoryCalendar
      activities={activities}
      selectedDate={selectedDate}
      onSelectDate={setSelectedDate}
    />
  );
};

export default HistoryContent;
