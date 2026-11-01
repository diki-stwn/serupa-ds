// Note: I couldn't inspect the installed serupa-ds package (no shell access in
// this session), so the `Card` and `Button` names and props are assumed.
// Check them against the package's exports.
import { Button, Card } from "serupa-ds";

type ProjectsEmptyStateProps = {
  onCreateProject?: () => void;
};

export default function ProjectsEmptyState({ onCreateProject }: ProjectsEmptyStateProps) {
  return (
    <main>
      <h1>Projects</h1>
      <Card>
        <div
          role="status"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <h2 style={{ margin: 0 }}>No projects yet</h2>
          <p style={{ margin: 0 }}>
            You haven't created any projects. Create your first one to get started.
          </p>
          <Button onClick={onCreateProject}>Create your first project</Button>
        </div>
      </Card>
    </main>
  );
}
