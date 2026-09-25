import { LoginHero } from '@/components/auth/login-hero';
import { SleekOneLogo } from '@/components/logos/sleek-one-logo';
import { PersonaSelectItems } from '@/components/auth/persona-select-items';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type Option,
} from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  currencyLabel,
  findPersona,
} from '@/lib/personas';
import { THEME } from '@/lib/theme';
import { useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { z } from 'zod';

/** Right-panel artwork — set to `undefined` to fall back to the placeholder gradient. */
const HERO_IMAGE: ImageSourcePropType | undefined = require('@/assets/login-hero.jpg');

/** Demo-only: there's no real auth, so the button just shows its loading state this long
 * before handing the chosen persona to the shell. */
const FAKE_SIGN_IN_MS = 800;

// Email/password are deliberately unvalidated — demo viewers can sign in with them blank. Role
// is the one required field, since it decides which workspace the shell opens as.
const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
  persona: z.string().min(1, 'Select a role'),
  currency: z.string().min(1, 'Select a currency'),
});

type LoginValues = z.infer<typeof loginSchema>;
type LoginErrors = Partial<Record<keyof LoginValues, string>>;

function validate(values: LoginValues): LoginErrors {
  const result = loginSchema.safeParse(values);
  if (result.success) return {};
  const fieldErrors = result.error.flatten().fieldErrors;
  return Object.fromEntries(
    Object.entries(fieldErrors).map(([key, messages]) => [key, messages?.[0]])
  ) as LoginErrors;
}

export default function LoginScreen() {
  const router = useRouter();
  const passwordRef = React.useRef<TextInput>(null);
  const emailRef = React.useRef<TextInput>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  const [values, setValues] = React.useState<LoginValues>({
    email: '',
    password: '',
    persona: '',
    currency: DEFAULT_CURRENCY.code,
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  // Errors only appear after the first submit attempt, then track every edit live — so the
  // form doesn't shout at someone who hasn't finished typing yet.
  const [attempted, setAttempted] = React.useState(false);
  const errors = attempted ? validate(values) : {};

  React.useEffect(() => () => clearTimeout(timeoutRef.current), []);

  function set<K extends keyof LoginValues>(key: K, value: LoginValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function onSubmit() {
    if (loading) return;
    setAttempted(true);
    if (Object.keys(validate(values)).length > 0) return;

    setLoading(true);
    timeoutRef.current = setTimeout(() => {
      router.push({
        pathname: '/shell',
        params: {
          persona: values.persona,
          currency: values.currency,
          ...(values.email.trim() ? { email: values.email.trim() } : {}),
        },
      });
      setLoading(false);
    }, FAKE_SIGN_IN_MS);
  }

  const persona = findPersona(values.persona);
  const personaOption: Option = persona ? { value: persona.value, label: persona.label } : undefined;
  const currency = CURRENCIES.find((c) => c.code === values.currency) ?? DEFAULT_CURRENCY;
  const currencyOption: Option = { value: currency.code, label: currencyLabel(currency) };

  return (
    <View className="bg-background flex-1 flex-row">
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow items-center justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled">
        <View className="w-full max-w-sm gap-8">
          <SleekOneLogo height={24} />

          <Text variant="h3">Welcome.</Text>

          <View className="gap-5">
            <Field
              label="Email"
              nativeID="login-email"
              error={errors.email}
              onLabelPress={() => emailRef.current?.focus()}>
              <Input
                ref={emailRef}
                aria-labelledby="login-email"
                aria-invalid={!!errors.email}
                placeholder="you@company.com"
                value={values.email}
                onChangeText={(t) => set('email', t)}
                keyboardType="email-address"
                inputMode="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </Field>

            <View className="gap-2">
              <Field
                label="Password"
                nativeID="login-password"
                error={errors.password}
                onLabelPress={() => passwordRef.current?.focus()}>
                <View className="justify-center">
                  <Input
                    ref={passwordRef}
                    aria-labelledby="login-password"
                    aria-invalid={!!errors.password}
                    className="pr-10"
                    value={values.password}
                    onChangeText={(t) => set('password', t)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="current-password"
                    returnKeyType="go"
                    onSubmitEditing={onSubmit}
                  />
                  <Pressable
                    onPress={() => setShowPassword((s) => !s)}
                    accessibilityRole="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    hitSlop={8}
                    className="absolute right-3 web:cursor-pointer">
                    <Icon
                      as={showPassword ? EyeOff : Eye}
                      size={16}
                      className="text-muted-foreground"
                    />
                  </Pressable>
                </View>
              </Field>
              {/* No reset flow exists in this demo — the link is here for layout fidelity. */}
              <Button variant="link" size="sm" className="h-auto self-end px-0 py-0">
                <Text>Forgot password?</Text>
              </Button>
            </View>

            <Field label="Role" nativeID="login-persona" error={errors.persona}>
              <Select
                value={personaOption}
                onValueChange={(o) => set('persona', o?.value ?? '')}>
                <SelectTrigger aria-labelledby="login-persona" aria-invalid={!!errors.persona} className="w-full">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <PersonaSelectItems />
                </SelectContent>
              </Select>
            </Field>

            <Field label="Currency" nativeID="login-currency" error={errors.currency}>
              <Select
                value={currencyOption}
                onValueChange={(o) => set('currency', o?.value ?? '')}>
                <SelectTrigger aria-labelledby="login-currency" aria-invalid={!!errors.currency} className="w-full">
                  <SelectValue placeholder="Select a currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code} label={currencyLabel(c)} />
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </View>

          <Button onPress={onSubmit} disabled={loading} className="w-full" aria-busy={loading}>
            {loading && <ActivityIndicator size="small" color={THEME.light.primaryForeground} />}
            <Text>{loading ? 'Logging in…' : 'Log in'}</Text>
          </Button>
        </View>
      </ScrollView>

      <View className="hidden flex-1 p-4 lg:flex">
        <LoginHero heroImage={HERO_IMAGE} />
      </View>
    </View>
  );
}

function Field({
  label,
  nativeID,
  error,
  onLabelPress,
  children,
}: {
  label: string;
  nativeID: string;
  error?: string;
  onLabelPress?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-2">
      <Label nativeID={nativeID} onPress={onLabelPress}>
        {label}
      </Label>
      {children}
      {error ? (
        <Text role="alert" className="text-destructive-text text-sm">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
