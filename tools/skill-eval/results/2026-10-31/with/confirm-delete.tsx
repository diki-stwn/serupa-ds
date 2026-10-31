import { useState } from 'react';
import { Button, Dialog, Stack, Text, announce } from 'serupa-ds';

type DeleteProjectButtonProps = {
  projectName: string;
  onDelete: () => Promise<void> | void;
};

export function DeleteProjectButton({ projectName, onDelete }: DeleteProjectButtonProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    setBusy(true);
    try {
      await onDelete();
      announce(`Project ${projectName} deleted`);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete project
      </Button>

      <Dialog
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={`Delete ${projectName}?`}
      >
        <Stack gap={4}>
          <Text>
            This permanently deletes <strong>{projectName}</strong> and everything in it:
            all tasks, files, comments and settings. Members will lose access right away.
            This can't be undone.
          </Text>

          <Stack direction="row" gap={2} className="justify-end">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={busy}>
              {busy ? 'Deleting…' : 'Delete'}
            </Button>
          </Stack>
        </Stack>
      </Dialog>
    </>
  );
}
