import type { ReactNode } from "react";
import { RecordsProvider } from "../store/localRecords";

export function Providers({ children }: { children: ReactNode }) {
  return <RecordsProvider>{children}</RecordsProvider>;
}
