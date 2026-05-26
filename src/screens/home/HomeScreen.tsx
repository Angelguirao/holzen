import AuthLoading from '@/app/components/AuthLoading';
import { HomeDashboardLayout } from '@/screens/home/components/HomeDashboardLayout';
import { useHomeScreen } from '@/screens/home/hooks/use-home-screen';

const Home = () => {
  const { profileLoaded, dashboardLayout } = useHomeScreen();

  if (!profileLoaded) {
    return <AuthLoading />;
  }

  return <HomeDashboardLayout {...dashboardLayout} />;
};

export default Home;
