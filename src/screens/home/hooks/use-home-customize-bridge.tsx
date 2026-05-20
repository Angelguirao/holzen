import type { TFunction } from 'i18next';
import { useCallback, useMemo, useState } from 'react';
import { applyHomeWidgetVisibilityChange } from '@/screens/home/lib/apply-home-widget-visibility-change';
import { getHomeCustomizeSectionDescription, getHomeCustomizeSectionTitle } from '@/screens/home/lib/home-customize-section-copy';
import {
  trackHomeCustomizeOpened,
  trackHomeCustomizeResetLayout,
  trackHomeOptionalWidgetToggled,
} from '@/screens/home/lib/home-customize-telemetry';
import type { HomeDashboardLayoutCustomizeProps } from '@/screens/home/components/HomeDashboardLayout';
import { isHomeSectionAlwaysVisibleInLayout } from '@/screens/home/lib/home-section-visibility-constants';

type SetZenModePersist = (zen: boolean) => void;

export function useHomeCustomizeBridge(args: {
  t: TFunction;
  order: string[];
  reorder: (next: string[]) => void;
  sectionVisible: Record<string, boolean>;
  setVisible: (id: string, value: boolean) => void;
  resetLayout: () => void;
  resetSectionVisibility: () => void;
  setZenModePersist: SetZenModePersist;
  zenMode: boolean;
  subscribed: boolean;
}) {
  const {
    t,
    order,
    reorder,
    sectionVisible,
    setVisible,
    resetLayout,
    resetSectionVisibility,
    setZenModePersist,
    zenMode,
    subscribed,
  } = args;

  const [open, setOpen] = useState(false);
  const [dndRemountKey, setDndRemountKey] = useState(0);

  const sectionTitle = useCallback((id: string) => getHomeCustomizeSectionTitle(t, id), [t]);

  const sectionDescription = useCallback((id: string) => getHomeCustomizeSectionDescription(t, id), [t]);

  const onSetVisible = useCallback(
    (id: string, value: boolean) => {
      if (isHomeSectionAlwaysVisibleInLayout(id)) return;
      trackHomeOptionalWidgetToggled(id, value);
      setVisible(id, value);
      const nextOrder = applyHomeWidgetVisibilityChange({ id, value, order });
      if (nextOrder !== order) reorder(nextOrder);
    },
    [setVisible, order, reorder],
  );

  const onResetAll = useCallback(() => {
    trackHomeCustomizeResetLayout();
    resetLayout();
    resetSectionVisibility();
    setZenModePersist(false);
    setDndRemountKey((n) => n + 1);
  }, [resetLayout, resetSectionVisibility, setZenModePersist]);

  const onOpenChange = useCallback((next: boolean) => {
    if (next) trackHomeCustomizeOpened();
    setOpen(next);
  }, []);

  const customizeSheet: HomeDashboardLayoutCustomizeProps = useMemo(
    () => ({
      open,
      onOpenChange,
      order,
      onReorder: reorder,
      visible: sectionVisible,
      onSetVisible,
      sectionTitle,
      sectionDescription,
      zenMode,
      onZenModeChange: setZenModePersist,
      onResetAll,
      nightToggleDisabled: !subscribed,
      dndRemountKey,
    }),
    [
      open,
      onOpenChange,
      order,
      reorder,
      sectionVisible,
      onSetVisible,
      sectionTitle,
      sectionDescription,
      zenMode,
      setZenModePersist,
      onResetAll,
      subscribed,
      dndRemountKey,
    ],
  );

  const onOpenCustomize = useCallback(() => {
    onOpenChange(true);
  }, [onOpenChange]);

  return { customizeSheet, onOpenCustomize };
}
