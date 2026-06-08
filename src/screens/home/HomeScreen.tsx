import AuthLoading from '@/app/components/AuthLoading';
import { HomeDashboardLayout } from '@/screens/home/components/HomeDashboardLayout';
import { HomePauseHelpFeedbackSheet } from '@/screens/home/components/HomePauseHelpFeedbackSheet';
import { HomePauseHelpFeedbackThankYou } from '@/screens/home/components/HomePauseHelpFeedbackThankYou';
import { useHomeScreen } from '@/screens/home/hooks/use-home-screen';

const Home = () => {
  const { profileLoaded, dashboardLayout, pauseHelpFeedback, pauseWelcomeBackSheet } = useHomeScreen();

  if (!profileLoaded) {
    return <AuthLoading />;
  }

  return (
    <>
      <HomeDashboardLayout {...dashboardLayout} />
      <HomePauseHelpFeedbackSheet
        open={pauseHelpFeedback.sheetOpen}
        onOpenChange={pauseHelpFeedback.onSheetOpenChange}
        submitting={pauseHelpFeedback.submitting}
        onSubmit={pauseHelpFeedback.onSubmit}
        onDefer={pauseHelpFeedback.onDefer}
      />
      {pauseWelcomeBackSheet}
      <HomePauseHelpFeedbackThankYou
        visible={pauseHelpFeedback.showThankYou}
        onDismiss={pauseHelpFeedback.onDismissThankYou}
      />
    </>
  );
};

export default Home;
