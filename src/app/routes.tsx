import { createHashRouter } from "react-router-dom";
import App from "./App";
import HomePage from "../pages/HomePage";
import RegistryPage from "../pages/RegistryPage";
import EntityPage from "../pages/EntityPage";
import TranslationPage from "../pages/TranslationPage";
import CertificatesPage from "../pages/CertificatesPage";
import CertificateDetailPage from "../pages/CertificateDetailPage";
import LedgerPage from "../pages/LedgerPage";
import TxPage from "../pages/TxPage";
import ExplorerPage from "../pages/ExplorerPage";
import BlockPage from "../pages/BlockPage";
import AddressPage from "../pages/AddressPage";
import ContractPage from "../pages/ContractPage";
import MethodsPage from "../pages/MethodsPage";
import ArchivePage from "../pages/ArchivePage";
import NotFoundPage from "../pages/NotFoundPage";

// Hash routing keeps the site working as plain static files (exhibition machine, file share) with stable IDs in URLs.
export const router = createHashRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "registry", element: <RegistryPage /> },
      { path: "registry/:entityId", element: <EntityPage /> },
      { path: "translate/:entityId?", element: <TranslationPage /> },
      { path: "certificates", element: <CertificatesPage /> },
      { path: "certificates/:certificateId", element: <CertificateDetailPage /> },
      { path: "ledger", element: <LedgerPage /> },
      { path: "ledger/:eventId", element: <TxPage /> },
      { path: "explorer", element: <ExplorerPage /> },
      { path: "block/:height", element: <BlockPage /> },
      { path: "tx/:eventId", element: <TxPage /> },
      { path: "address/:address", element: <AddressPage /> },
      { path: "contract", element: <ContractPage /> },
      { path: "archive", element: <ArchivePage /> },
      { path: "methods", element: <MethodsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
