import { SelectGroup, SelectItem, SelectLabel, SelectSeparator } from '@/components/ui/select';
import { PERSONA_GROUPS } from '@/lib/personas';
import * as React from 'react';

/** Internal / Client grouped persona options — shared by the login Role field and the demo
 * "Viewing as" switcher. Group headers are the design system's plain `SelectLabel` (small muted
 * text, the same treatment as section headers elsewhere) with a hairline separator between
 * groups — brand blue is kept for clickable text and selected items only. */
export function PersonaSelectItems() {
  return (
    <>
      {PERSONA_GROUPS.map((group, i) => (
        <React.Fragment key={group.label}>
          {i > 0 && <SelectSeparator />}
          <SelectGroup>
            <SelectLabel>{group.label}</SelectLabel>
            {group.personas.map((p) => (
              <SelectItem key={p.value} value={p.value} label={p.label} />
            ))}
          </SelectGroup>
        </React.Fragment>
      ))}
    </>
  );
}
