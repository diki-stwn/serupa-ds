import { useEffect, useState, type FormEvent } from 'react';
import { Alert, Button, Field, Heading, Input, Stack, Textarea } from 'serupa-ds';

const BIO_MAX = 160;

export function ProfileForm() {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [nameError, setNameError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // The confirmation goes away on its own after a few seconds.
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 4000);
    return () => clearTimeout(timer);
  }, [saved]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setNameError('Enter a display name, for example "Sam Rivera".');
      document.getElementById('profile-name')?.focus();
      return;
    }
    setNameError(undefined);
    setSaving(true);
    try {
      // Replace with your real save call.
      await new Promise((resolve) => setTimeout(resolve, 400));
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap={4}>
        <Heading level={2}>Profile</Heading>

        <Field
          label="Display name"
          hint="Shown to other people on your posts and comments."
          error={nameError}
        >
          <Input
            id="profile-name"
            value={name}
            invalid={!!nameError}
            autoComplete="nickname"
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <Field label="Bio" hint={`Up to ${BIO_MAX} characters.`}>
          <Textarea
            value={bio}
            rows={4}
            maxLength={BIO_MAX}
            onChange={(e) => setBio(e.target.value)}
          />
        </Field>

        <div>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
        </div>

        {saved && <Alert>Profile saved.</Alert>}
      </Stack>
    </form>
  );
}
