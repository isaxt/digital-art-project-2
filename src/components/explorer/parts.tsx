import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CONFIG } from "../../config";
import { contractOf, entityAddress, REGISTRAR_ADDRESS, with0x, isBuried } from "../../services/chainService";
import { entities, ruleSet } from "../../services/registryService";

export const CONTRACT = contractOf(ruleSet);

export interface AddressInfo { address: string; kind: "entity" | "contract" | "registrar" | "witness"; label: string; to: string }
/** Reverse lookup for every derived address. Built once; there are only a few hundred. */
const BOOK = new Map<string, AddressInfo>();
for (const e of entities) BOOK.set(entityAddress(e.id), { address: entityAddress(e.id), kind: "entity", label: e.displayName, to: `/registry/${e.id}` });
BOOK.set(REGISTRAR_ADDRESS, { address: REGISTRAR_ADDRESS, kind: "registrar", label: "Office registrar", to: `/address/${REGISTRAR_ADDRESS}` });
BOOK.set(CONTRACT.address, { address: CONTRACT.address, kind: "contract", label: `${CONTRACT.name} v${CONTRACT.version}`, to: "/contract" });
export const lookupAddress = (a: string) => BOOK.get(a.toLowerCase());

export function Hash0x({ value, full }: { value: string | null | undefined; full?: boolean }) {
  if (!value) return <span className="mono">GENESIS</span>;
  const v = with0x(value);
  return <span className="hash" title={v}>{full ? v : <>{v.slice(0, 12)}<span className="dim">…{v.slice(-6)}</span></>}</span>;
}

export function Addr({ address, full }: { address: string; full?: boolean }) {
  const info = lookupAddress(address);
  const shown = full ? address : `${address.slice(0, 10)}…${address.slice(-6)}`;
  return (
    <span>
      <Link className="mono" to={`/address/${address}`}>{shown}</Link>
      {info && <span className="small muted"> ({info.label})</span>}
    </span>
  );
}

export function Conf({ n }: { n: number }) {
  const buried = isBuried(n);
  return (
    <span className={`conf ${buried ? "buried" : "shallow"}`} title={`${n} later events sit on top of this one. ${buried ? "Treated as final once " + CONFIG.finalityDepth + " are stacked." : "Not yet treated as final."}`}>
      <b className="mono">{n}</b> {n === 1 ? "confirmation" : "confirmations"} · {buried ? "BURIED" : "UNCONFIRMED"}
    </span>
  );
}

export function KV({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <table className="kv">
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>
        ))}
      </tbody>
    </table>
  );
}
