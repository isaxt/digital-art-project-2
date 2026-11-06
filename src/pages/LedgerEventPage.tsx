import { Link, useParams } from "react-router-dom";
import { useRecords } from "../store/localRecords";
import { LedgerEventDetail } from "../components/ledger/LedgerEventDetail";
import NotFoundPage from "./NotFoundPage";

export default function LedgerEventPage() {
  const { eventId } = useParams();
  const { ledger } = useRecords();
  const i = ledger.findIndex((e) => e.id === eventId);
  if (i < 0) return <NotFoundPage />;
  return (
    <main className="main stack">
      <div className="crumbs"><Link to="/ledger">Public Ledger</Link> › {ledger[i].id}</div>
      <div className="pagehead"><h1>Ledger event {ledger[i].id}</h1></div>
      <LedgerEventDetail event={ledger[i]} previous={ledger[i - 1]} />
      <p className="small">
        {i > 0 && <Link to={`/ledger/${ledger[i - 1].id}`}>← {ledger[i - 1].id}</Link>}
        {i > 0 && i < ledger.length - 1 && " · "}
        {i < ledger.length - 1 && <Link to={`/ledger/${ledger[i + 1].id}`}>{ledger[i + 1].id} →</Link>}
      </p>
    </main>
  );
}
