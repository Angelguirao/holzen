import AuthLoading from '@/app/components/AuthLoading';
import { HomeDashboardLayout } from '@/screens/home/components/HomeDashboardLayout';
import { Onboarding } from '@/screens/home/components/Onboarding';
import { useHomeScreen } from '@/screens/home/hooks/use-home-screen';

const Home = () => {
  const { profileLoaded, hasOnboarded, completeOnboarding, dashboardLayout } = useHomeScreen();

  if (!profileLoaded) {
    return <AuthLoading />;
  }

  if (!hasOnboarded) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  return <HomeDashboardLayout {...dashboardLayout} />;
};

export default Home;
