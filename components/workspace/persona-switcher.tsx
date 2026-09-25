import { PersonaSelectItems } from '@/components/auth/persona-select-items';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { findPersona } from '@/lib/personas';
import * as React from 'react';
import { View } from 'react-native';

/** Prototype-only. Flip to `false` to remove the "Viewing as" switcher from the sidebar. */
export const DEMO_MODE = true;

/** Tiny "Viewing as" select pinned to the foot of the sidebar — lets a demo jump between
 * personas without going back through login. The shell owns the value (it lives in the
 * `?persona=` URL param), so switching re-renders the nav straight from the new param. */
export function PersonaSwitcher({
  personaId,
  onPersonaChange,
}: {
  personaId: string;
  onPersonaChange: (personaId: string) => void;
}) {
  const persona = findPersona(personaId);
  return (
    <View className="gap-1.5 px-6 py-3">
      <Text nativeID="persona-switcher-label" className="text-xs text-muted-foreground">
        Viewing as
      </Text>
      <Select
        value={persona ? { value: persona.value, label: persona.label } : undefined}
        onValueChange={(o) => o && onPersonaChange(o.value)}>
        {/* text-xs on the trigger too — on web the value text inherits from it (see
            SelectTrigger), SelectValue's own className doesn't reach Radix's span. */}
        <SelectTrigger
          size="sm"
          aria-labelledby="persona-switcher-label"
          className="w-full text-xs">
          <SelectValue placeholder="Select persona" className="text-xs" />
        </SelectTrigger>
        <SelectContent side="top">
          <PersonaSelectItems />
        </SelectContent>
      </Select>
    </View>
  );
}
