import { VyomProvider } from './vyom';
import { AppShell } from './components/AppShell';

export default function App() {
  return (
    <VyomProvider>
      <AppShell />
    </VyomProvider>
  );
}
