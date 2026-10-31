import { useState } from "react";
// NOTE: I couldn't inspect the serupa-ds package in this session (no file access),
// so these component names and props are assumptions. Check them against the
// serupa-ds docs and adjust the imports if they differ.
import { Button, Heading } from "serupa-ds";

type Member = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member";
};

const INITIAL_MEMBERS: Member[] = [
  { id: "1", name: "Aisha Rahman", email: "aisha@example.com", role: "Owner" },
  { id: "2", name: "Budi Santoso", email: "budi@example.com", role: "Admin" },
  { id: "3", name: "Citra Lestari", email: "citra@example.com", role: "Member" },
];

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);

  const handleInvite = () => {
    // Replace with your invite flow (open a dialog, call an API, etc.)
    console.log("Invite clicked");
  };

  const handleRemove = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <main style={{ padding: 24 }}>
      <Heading level={1}>Team settings</Heading>

      <div style={{ margin: "16px 0" }}>
        <Button onClick={handleInvite}>Invite</Button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th scope="col" style={{ textAlign: "left" }}>Name</th>
            <th scope="col" style={{ textAlign: "left" }}>Email</th>
            <th scope="col" style={{ textAlign: "left" }}>Role</th>
            <th scope="col" style={{ textAlign: "left" }}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td>{member.name}</td>
              <td>{member.email}</td>
              <td>{member.role}</td>
              <td>
                <Button
                  variant="danger"
                  onClick={() => handleRemove(member.id)}
                  aria-label={`Remove ${member.name}`}
                >
                  Remove
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
