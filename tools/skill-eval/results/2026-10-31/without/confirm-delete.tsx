// NOTE: I couldn't inspect the installed serupa-ds package, so the component
// names and props below (Button, Dialog) are assumed. Adjust them to match its docs.
import { useState } from "react";
import { Button, Dialog } from "serupa-ds";

type DeleteProjectButtonProps = {
  projectName: string;
  onDelete: () => void | Promise<void>;
};

export function DeleteProjectButton({ projectName, onDelete }: DeleteProjectButtonProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    setBusy(true);
    try {
      await onDelete();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete project
      </Button>

      <Dialog
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={`Delete “${projectName}”?`}
        role="alertdialog"
      >
        <p>This will permanently delete the project and cannot be undone. You will lose:</p>
        <ul>
          <li>All files and content in the project</li>
          <li>Settings, members and access permissions</li>
          <li>Activity history and comments</li>
        </ul>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy} autoFocus>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={busy}>
            {busy ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
