import { Button, Card, Container, EmptyState, Heading, Icon, Stack } from 'serupa-ds';

type ProjectsPageProps = {
  onCreateProject: () => void;
};

export function ProjectsPage({ onCreateProject }: ProjectsPageProps) {
  return (
    <Container as="main" className="py-8">
      <Stack gap={6}>
        <Heading level={1}>Projects</Heading>

        <Card>
          <EmptyState
            icon={<Icon name="folder_open" aria-hidden="true" />}
            title="No projects yet"
            description="Projects keep your work in one place. Create your first project to get started."
            action={
              <Button variant="primary" onClick={onCreateProject}>
                Create your first project
              </Button>
            }
          />
        </Card>
      </Stack>
    </Container>
  );
}
