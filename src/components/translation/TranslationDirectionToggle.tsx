import { DIRECTIONS } from "../../services/translationService";
import type { Direction } from "../../types/translation";

export function TranslationDirectionToggle({ value, onChange }: { value: Direction; onChange: (d: Direction) => void }) {
  return (
    <div role="group" aria-label="Translation direction" className="dir-toggle">
      {(Object.keys(DIRECTIONS) as Direction[]).map((d) => (
        <button key={d} type="button" aria-pressed={value === d} onClick={() => onChange(d)}>
          {DIRECTIONS[d].label}
        </button>
      ))}
    </div>
  );
}
