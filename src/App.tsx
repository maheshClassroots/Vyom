import { VyomProvider } from './vyom';
import { SparkProvider } from './spark';
import { AppShell } from './components/AppShell';

export default function App() {
  return (
    <VyomProvider>
      <SparkProvider>
        <AppShell />
      </SparkProvider>
    </VyomProvider>
  );
}
