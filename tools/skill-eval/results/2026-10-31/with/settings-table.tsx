import { useState } from 'react';
import { announce, Badge, Button, Container, Heading, Stack, Table, VisuallyHidden } from 'serupa-ds';

type Role = 'Owner' | 'Admin' | 'Member';

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
}

const initialMembers: Member[] = [
  { id: '1', name: 'Siti Rahma', email: 'siti@example.com', role: 'Owner' },
  { id: '2', name: 'Budi Santoso', email: 'budi@example.com', role: 'Admin' },
  { id: '3', name: 'Ayu Lestari', email: 'ayu@example.com', role: 'Member' },
];

export function TeamSettingsPage({ onInvite }: { onInvite?: () => void }) {
  const [members, setMembers] = useState<Member[]>(initialMembers);

  const remove = (member: Member) => {
    setMembers((current) => current.filter((m) => m.id !== member.id));
    announce(`${member.name} removed from the team`);
  };

  return (
    <Container as="main">
      <Stack gap={6} className="py-8">
        <Heading level={1}>Team settings</Heading>

        <Stack direction="row" justify="end">
          <Button onClick={onInvite}>Invite</Button>
        </Stack>

        <Table>
          <VisuallyHidden as="caption">Team members</VisuallyHidden>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Role</th>
              <th scope="col">
                <VisuallyHidden>Actions</VisuallyHidden>
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <th scope="row">{member.name}</th>
                <td>{member.email}</td>
                <td>
                  <Badge>{member.role}</Badge>
                </td>
                <td>
                  <Button
                    size="sm"
                    aria-label={`Remove ${member.name}`}
                    onClick={() => remove(member)}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Stack>
    </Container>
  );
}
