// Note: I couldn't inspect serupa-ds in this session, so the component names
// and props imported below are assumed. Check them against the package's exports.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Input, Textarea, Alert } from "serupa-ds";

const MESSAGE_DURATION_MS = 3000;
const BIO_MAX_LENGTH = 280;

export default function ProfileForm() {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending timer on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Persist the profile here (API call, etc.), then confirm.
    setSaved(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSaved(false), MESSAGE_DURATION_MS);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="display-name">Display name</label>
        <Input
          id="display-name"
          name="displayName"
          value={displayName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setDisplayName(e.target.value)
          }
          autoComplete="nickname"
          required
        />
      </div>

      <div>
        <label htmlFor="bio">Bio</label>
        <Textarea
          id="bio"
          name="bio"
          value={bio}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setBio(e.target.value)
          }
          maxLength={BIO_MAX_LENGTH}
          rows={4}
        />
        <small>
          {bio.length}/{BIO_MAX_LENGTH}
        </small>
      </div>

      <Button type="submit">Save</Button>

      {/* Live region stays mounted so screen readers announce the message. */}
      <div role="status" aria-live="polite">
        {saved && <Alert variant="success">Profile saved.</Alert>}
      </div>
    </form>
  );
}
