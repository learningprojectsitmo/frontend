import { DashboardLayout } from '@/components/layouts';

export const ErrorBoundary = () => {
  return <div>Something went wrong!</div>;
};

const AppRoot = () => {
  return <DashboardLayout />;
};

export default AppRoot;
