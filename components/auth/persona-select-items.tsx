import { SelectGroup, SelectItem, SelectLabel } from '@/components/ui/select';
import { PERSONA_GROUPS } from '@/lib/personas';
import * as React from 'react';

/** Internal / Client grouped persona options — shared by the login Role field and the demo
 * "Viewing as" switcher. Group headers get a light brand tint so the two groups read as
 * distinct sections; brand blue rather than gray because gray is already the item hover/focus
 * color, and a gray header would look like a highlighted option. Tint set via style — this
 * project's NativeWind setup doesn't compile arbitrary-value color classes reliably. */
export function PersonaSelectItems() {
  return (
    <>
      {PERSONA_GROUPS.map((group, i) => (
        <SelectGroup key={group.label}>
          <SelectLabel
            className="rounded-sm font-plex-semibold text-brand"
            style={{ backgroundColor: '#EEF4FF', marginTop: i > 0 ? 4 : 0 }}>
            {group.label}
          </SelectLabel>
          {group.personas.map((p) => (
            <SelectItem key={p.value} value={p.value} label={p.label} />
          ))}
        </SelectGroup>
      ))}
    </>
  );
}
