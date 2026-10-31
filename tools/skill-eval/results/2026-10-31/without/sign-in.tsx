// NOTE: I couldn't inspect the installed serupa-ds package in this session, so the
// component names and props below (Button, TextField, Checkbox, Link) are assumed.
// Check them against the package's exports before using this.
import { useState, type FormEvent } from "react";
import { Button, Checkbox, Link, TextField } from "serupa-ds";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (email.trim() === "") {
      setEmailError("Email is required.");
      return;
    }

    setEmailError(undefined);
    // Replace with your real sign-in call.
    console.log({ email, password, keepSignedIn });
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-labelledby="sign-in-title">
      <h1 id="sign-in-title">Sign in</h1>

      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (emailError) setEmailError(undefined);
        }}
        error={emailError}
        invalid={Boolean(emailError)}
      />

      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Checkbox
        name="keepSignedIn"
        checked={keepSignedIn}
        onChange={(e) => setKeepSignedIn(e.target.checked)}
      >
        Keep me signed in
      </Checkbox>

      <Button type="submit">Sign in</Button>

      <Link href="/forgot-password">Forgot password?</Link>
    </form>
  );
}

export default SignInForm;
