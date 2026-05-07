import { LabPage } from "./features/lab/components/LabPage";
import { ErrorBoundary } from "./shared/ErrorBoundary";

export function App() {
  return (
    <ErrorBoundary>
      <LabPage />
    </ErrorBoundary>
  );
}
