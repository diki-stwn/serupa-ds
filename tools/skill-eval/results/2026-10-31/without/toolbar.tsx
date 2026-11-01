import { useState } from "react";

// I couldn't inspect serupa-ds in this session (no file access), so this uses
// native semantic elements instead of guessed component names. To use the DS,
// swap the two <button> usages for its toggle and segmented/radio components.

type Align = "left" | "center" | "right";

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

const icons = {
  bold: (
    <Icon>
      <path d="M4.5 2.5h4a2.5 2.5 0 0 1 0 5h-4zM4.5 7.5h4.5a2.5 2.5 0 0 1 0 5H4.5z" />
    </Icon>
  ),
  italic: (
    <Icon>
      <path d="M6.5 2.5h5M4.5 13.5h5M9.5 2.5l-3 11" />
    </Icon>
  ),
  underline: (
    <Icon>
      <path d="M4.5 2.5v5a3.5 3.5 0 0 0 7 0v-5M3 14h10" />
    </Icon>
  ),
  left: (
    <Icon>
      <path d="M2.5 3.5h11M2.5 6.5h7M2.5 9.5h11M2.5 12.5h7" />
    </Icon>
  ),
  center: (
    <Icon>
      <path d="M2.5 3.5h11M4.5 6.5h7M2.5 9.5h11M4.5 12.5h7" />
    </Icon>
  ),
  right: (
    <Icon>
      <path d="M2.5 3.5h11M6.5 6.5h7M2.5 9.5h11M6.5 12.5h7" />
    </Icon>
  ),
};

const buttonStyle = (active: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  border: "1px solid transparent",
  borderRadius: 6,
  background: active ? "rgba(127,127,127,0.25)" : "transparent",
  color: "inherit",
  cursor: "pointer",
});

const alignments: { value: Align; label: string }[] = [
  { value: "left", label: "Align left" },
  { value: "center", label: "Align center" },
  { value: "right", label: "Align right" },
];

export function FormattingBar({
  onChange,
}: {
  onChange?: (state: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    align: Align;
  }) => void;
}) {
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [align, setAlign] = useState<Align>("left");

  const emit = (patch: Partial<{ bold: boolean; italic: boolean; underline: boolean; align: Align }>) =>
    onChange?.({ bold, italic, underline, align, ...patch });

  const toggles = [
    { key: "bold", label: "Bold", on: bold, set: setBold },
    { key: "italic", label: "Italic", on: italic, set: setItalic },
    { key: "underline", label: "Underline", on: underline, set: setUnderline },
  ] as const;

  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
    >
      <div role="group" aria-label="Text style" style={{ display: "inline-flex", gap: 2 }}>
        {toggles.map(({ key, label, on, set }) => (
          <button
            key={key}
            type="button"
            aria-label={label}
            title={label}
            aria-pressed={on}
            style={buttonStyle(on)}
            onClick={() => {
              set(!on);
              emit({ [key]: !on });
            }}
          >
            {icons[key]}
          </button>
        ))}
      </div>

      <span aria-hidden="true" style={{ width: 1, height: 20, background: "currentColor", opacity: 0.2 }} />

      <div role="radiogroup" aria-label="Alignment" style={{ display: "inline-flex", gap: 2 }}>
        {alignments.map(({ value, label }) => {
          const selected = align === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={label}
              title={label}
              tabIndex={selected ? 0 : -1}
              style={buttonStyle(selected)}
              onClick={() => {
                setAlign(value);
                emit({ align: value });
              }}
              onKeyDown={(e) => {
                const i = alignments.findIndex((a) => a.value === align);
                let next = i;
                if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % 3;
                else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i + 2) % 3;
                else return;
                e.preventDefault();
                const v = alignments[next].value;
                setAlign(v);
                emit({ align: v });
                (e.currentTarget.parentElement?.children[next] as HTMLElement)?.focus();
              }}
            >
              {icons[value]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default FormattingBar;
