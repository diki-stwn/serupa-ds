import { useRef, useState, type FormEvent } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Container,
  Field,
  Heading,
  Input,
  Link,
  PasswordInput,
  Stack,
} from 'serupa-ds';

export function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const emailRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (email.trim() === '') {
      setEmailError('Enter your email address, for example name@example.com.');
      emailRef.current?.focus();
      return;
    }

    setEmailError(undefined);
    // Submit { email, password, keepSignedIn } to your API here.
  }

  return (
    <Container size="sm" className="py-8">
      <Card className="p-6">
        <form onSubmit={handleSubmit} noValidate>
          <Stack gap={4}>
            <Heading level={1}>Sign in</Heading>

            <Field label="Email" error={emailError}>
              <Input
                ref={emailRef}
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                invalid={Boolean(emailError)}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(undefined);
                }}
              />
            </Field>

            <Field label="Password">
              <PasswordInput
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            <Checkbox
              name="keepSignedIn"
              checked={keepSignedIn}
              onChange={(e) => setKeepSignedIn(e.target.checked)}
            >
              Keep me signed in
            </Checkbox>

            <Button type="submit" variant="primary" className="w-full">
              Sign in
            </Button>

            <Link href="/forgot-password">Forgot password?</Link>
          </Stack>
        </form>
      </Card>
    </Container>
  );
}
