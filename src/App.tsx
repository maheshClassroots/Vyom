import { VyomProvider } from './vyom';
import { SparkProvider } from './spark';
import { AppShell } from './components/AppShell';
import { startsOnOnboarding } from './onboarding';

export default function App() {
  return (
    <VyomProvider entrance={!startsOnOnboarding()}>
      <SparkProvider>
        <AppShell />
      </SparkProvider>
    </VyomProvider>
  );
}
