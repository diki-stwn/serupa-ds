# FileUpload

A drop area with a button for choosing files, and the chosen files listed under it with their size and a remove button. It checks file types, sizes and counts on the way in. Uploading is up to you: read the files from `onFilesChange`, or send them with a form through `name`.

```tsx
import { FileUpload } from "serupa-ds";

<FileUpload accept="image/*" maxSize={5 * 1024 * 1024} hint="PNG or JPG, up to 5 MB" onFilesChange={setAvatar} />

<FileUpload multiple maxFiles={10} accept=".pdf,.docx" files={files} onFilesChange={setFiles}
  onReject={(r) => console.log(r)} />
```

## When to use

- People attach one or more files to a form or a message: a profile photo, receipts, documents.
- Files must be a certain type, size or number, and people should hear about a bad file before they submit.
- Uploads where people often drag files in from their desktop or file manager.

## When not to use

- An empty area that only invites people to add content, with no file picker: use [EmptyState](../EmptyState/README.md) with `variant="dashed"` instead.
- Showing how far an upload has got: FileUpload doesn't upload; show a [Progress](../Progress/README.md) bar while your upload runs.

## Anatomy

Drawn from the `ReadOnly` story.

1. **Drop zone** (`.dk-file-upload__zone`): where files are dropped, with a button to choose them.
2. **Title** (`.dk-file-upload__title`): what to add.
3. **Hint** (`.dk-file-upload__hint`): which types and sizes are accepted.
4. **File list** (`.dk-file-upload__list`): the files added so far.
5. **File** (`.dk-file-upload__file`): one file: its type, name and size.
6. **Name** (`.dk-file-upload__name`): the file name; a long one is cut in the middle so its ending stays.
7. **Size** (`.dk-file-upload__size`): the file's size.

## Usage

- Say the allowed types and the largest size in `hint` ("PNG or JPG, up to 5 MB"), and keep it in step with `accept` and `maxSize`.
- Without `multiple`, a new file replaces the old one; set `multiple` (and `maxFiles` if there's a limit) when people may add several.
- Use `onReject` if you need to log refused files or show the reason elsewhere; the messages already show under the area.
- A refused type says what the field takes, in words from `accept`: "photo.heic isn't a PNG or JPG." Types with no short name, such as `application/vnd.ms-excel`, get "photo.heic: this type of file isn't accepted."
- Change `title` and `buttonLabel` to name what's expected ("Drag your CV here", "Choose a CV").

## Behavior

- The button opens the file picker; files can also be dropped on the area, which highlights while they're dragged over it. Text or a link dragged across it doesn't highlight it. While it can take files, a file dropped just outside the area is ignored rather than opened by the browser in place of the page. A dropped folder is refused ("Invoices is a folder: choose the files in it instead."), and a file that's already in the list is skipped with a message ("report.pdf is already added.").
- Pasting (Ctrl+V, ⌘V on Apple devices) while focus is on the choose button or a remove button adds the clipboard's files, such as a screenshot, checked like dropped ones. It works from the keyboard alone. A paste with no files in it does nothing. `readOnly` and `disabled` ignore it.
- Files that don't fit are listed under the area in danger text and passed to `onReject`; the same file picked twice is skipped quietly.
- Removing a file moves focus to the next file's remove button, or the one before it, so clearing several files stays in the list; with none left, focus goes to the choose button.
- A long file name is cut in the middle, as Finder and Drive do: "quarterly-report-fi…t-2026.pdf". The last few characters and the extension stay, so files that differ only by year or version still look different. Hover shows the full name, and it's laid out in its own direction. It is cut wherever FileUpload sits, a grid cell or a flex row included, so a long name never widens the page.
- The native input always holds the listed files, including dropped ones, so a form sends exactly what's shown.
- `readOnly` shows the files without remove buttons and ignores the button and drops; the files are still submitted. `disabled` also fades it and leaves the files out of the form.

## Accessibility

- The button is the keyboard and screen-reader way in; dragging is an extra. Messages about refused files are `role="alert"`, so they're announced. They come from labels (`fileWrongType`, `fileTooLarge`, `fileTooMany`, `fileOnlyOne`, `fileFolder`, `fileAlreadyAdded`), Indonesian in `idLabels`, and `onReject` gets the same text.
- Adding and removing files are said politely, since the list changes away from focus: "report.pdf added.", "3 files added.", "report.pdf removed." (`filesAdded`, `fileRemoved`).
- Submitted without a required file, FileUpload doesn't let the browser point its bubble at the hidden input: it shows "Choose a file." (`fileMissing`) in the same alert area, makes the button invalid and described by it, and focuses the button when it's the first invalid field. Choosing a file clears it.
- In a [Field](../Field/README.md), the button is named by the label and its own text ("Due date, Choose a file") and described by the Field's hint and error, then the `hint`. `aria-describedby` goes to the button too. A button supports none of `aria-invalid`, `aria-errormessage` and `aria-required`, so the button is described by the Field's `error` (or your own `aria-errormessage`), and with `required` by "Required" first (`labels.required`). `aria-invalid` goes on the native input.
- Text keeps 4.5:1 (also while dragging), and the icons and dashed outline 3:1, in all six themes (`FileUpload.test.tsx`).
- In forced colors (Windows High Contrast), the drag-over area turns its border solid and `Highlight`, so the state still shows without the primary fill.
- **Keyboard:** Tab reaches the choose button, where Enter or Space opens the file picker, then each chosen file's remove button. Dropping files needs a pointer, so the button is the keyboard's way in; Ctrl+V (⌘V) there pastes copied files. Read-only, the choose button stays focusable but opens nothing.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `files` | `File[]` | | Controlled. |
| `onFilesChange` | `(files: File[]) => void` | | When files are added or removed. |
| `onReject` | `(rejections) => void` | | Files that weren't added, each with `reason` (`'type'`, `'size'`, `'count'`, `'folder'` or `'duplicate'`) and a `message`. |
| `accept` | `string` | | As for `<input accept>`: MIME types, `image/*` or extensions. |
| `multiple` | `boolean` | `false` | Without it, a new file replaces the old one. |
| `maxSize` | `number` | | The largest file, in bytes. |
| `maxFiles` | `number` | | The most files, with `multiple`. |
| `disabled` | `boolean` | `false` | |
| `invalid` | `boolean` | `false` | A solid danger outline on the drop area and `aria-invalid` on the native input. Set for you in a Field with an `error`, whose message describes the button. |
| `required` | `boolean` | `false` | `required` on the native input (the form's check) and a hidden "Required" in the button's description. A required Field adds the description for you. |
| `readOnly` | `boolean` | `false` | The files are listed and submitted but can't change: the button stays focusable with `aria-disabled` and opens no picker, drops are ignored, and there are no remove buttons. |
| `name` | `string` | | Sends the files with a form. |
| `form` | `string` | | The id of the form the files submit with, when the FileUpload sits outside it. |
| `id` | `string` | | Goes to the native input, so a `<label htmlFor>` or Field can point at it. Clicking such a label opens the picker and puts focus on the choose button. |
| `title` | `ReactNode` | `'Drag files here'` or `'Drag a file here'` | |
| `buttonLabel` | `string` | `'Choose files'` or `'Choose a file'` | |
| `hint` | `ReactNode` | | A muted line such as "PNG or JPG, up to 5 MB". The button is described by it. |
| `removeLabel` | `(name) => string` | `` `Remove ${name}` `` | The remove buttons' names. |

`formatFileSize(bytes, locale?)` is exported too: `1.5 MB`, or with a locale the same as FormattedNumber's `format="bytes"` (`formatFileSize(5_000_000, "id-ID")` is `4,8 MB`). FileUpload writes each size, and the size in a refusal, in the provider's locale. `className`, `ref` and other props go to the root `<div>`. Its `focus()` and `autoFocus` move focus to the choose button, so a form library that focuses the first invalid field after a failed submit lands on it.

## Component tokens

Each is an optional override: set it on the page, a container or one upload. The list lives in `src/components/FileUpload/file-upload.tokens.json` (also in `design-tokens/components/`).

<!-- token-table:start (made from file-upload.tokens.json by npm run tokens: edit the descriptions there) -->
| Token | Default | Use |
| --- | --- | --- |
| `--file-upload-zone-bg` | `surface-muted` | The drop area's background. |
| `--file-upload-zone-border` | `field-border` | The drop area's dashed outline (3:1 on the surface). |
| `--file-upload-zone-bg-active` | `primary-subtle` | The drop area while files are dragged over it. |
| `--file-upload-zone-border-active` | `primary` | Its outline then. |
| `--file-upload-zone-border-invalid` | `danger` | The drop area's outline when invalid (solid, 3:1 on the surface). |
| `--file-upload-icon-color` | `text-muted` | The upload icon and file icons (3:1). |
| `--file-upload-title-color` | `text` | The drop area's title and file names. |
| `--file-upload-hint-color` | `text-muted` | The hint and file sizes (4.5:1 on zone-bg and the surface). |
| `--file-upload-error-color` | `danger-text` | Messages about files that weren't added. |
| `--file-upload-item-bg` | `surface` | A file row's background. |
| `--file-upload-item-border` | `border` | A file row's outline. |
| `--file-upload-zone-radius` | `rounded-lg` | The drop area's corners (8px). |
| `--file-upload-item-radius` | `rounded-md` | A file row's corners (6px). |
| `--file-upload-zone-padding` | `spacing-6` | Space inside the drop area (24px). |
| `--file-upload-gap` | `spacing-2` | Space between the drop area's lines, and between file rows (8px). |
| `--file-upload-item-padding` | `spacing-2` | Space inside a file row (8px). |
<!-- token-table:end -->
