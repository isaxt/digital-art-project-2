import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="main stack">
      <div className="pagehead"><h1>Record not found</h1></div>
      <p>No record with that identifier exists in the Office&apos;s dataset. Absence from this dataset says nothing about the entity.</p>
      <p><Link to="/registry">Return to the Registry</Link></p>
    </main>
  );
}
