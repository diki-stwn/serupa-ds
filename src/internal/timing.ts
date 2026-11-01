// The waits the components keep in JavaScript, named for what they do (TF6). A number that has to change with
// another one is written once here: Button's busy wait is Loader's default delay, and Button's success hold is
// CopyButton's "Copied". The CSS durations are tokens (motion-*); these are the waits CSS can't express.
// docs/foundations.md (Motion, "Waits") lists them, and serupa/no-literal-delay keeps a bare number out of a
// setTimeout or setInterval in src/components.

/** Before a loading indicator appears, so a quick wait doesn't flash one (Loader's default delay, Button's loading). */
export const spinnerDelay = 300;
/** Once a loading indicator shows, it stays at least this long, so work that ends just after spinnerDelay doesn't flash it. */
export const spinnerMinShown = 500;
/** How long a "done" state holds before it goes back: Button's successText, CopyButton's "Copied". */
export const feedbackHold = 2000;
/** The pointer rests this long on a trigger before its tooltip shows. */
export const hoverIntent = 400;
/** After the pointer leaves a tooltip or its trigger, the tooltip waits this long before closing, so moving between them keeps it. */
export const hoverLeave = 100;
/** After a tooltip closes, the next one opens at once for this long, so scanning a toolbar doesn't wait hoverIntent per button. */
export const hoverWarm = 300;
/** The pointer rests this long on a link, or keyboard focus stays on it, before its HoverCard opens: longer than a
    tooltip's, since a card covers more of the page and a pointer passing over a list of links shouldn't open one each. */
export const cardIntent = 500;
/** After the pointer or focus leaves a HoverCard and its link, it waits this long before closing, so a pointer crossing
    the gap to the card, or wobbling off its edge, keeps it. */
export const cardLeave = 300;
/** The pointer rests this long on a menu item before its submenu opens, or off it before the submenu closes. */
export const submenuIntent = 150;
/** Typing must pause this long before Combobox's loadOptions runs. */
export const typingPause = 250;
/** After the options change, Combobox waits this long before saying how many there are, so typing isn't talked over. */
export const announcePause = 700;
/** A picture that arrives this soon after mount appears without Image's fade. */
export const quickArrival = 250;
/** Holding a NumberInput step button: the wait before it repeats, then the time between steps. */
export const holdDelay = 400;
export const holdRepeat = 50;
/** After a Splitter drag ends, the click the browser sends after it is swallowed for this long. */
export const clickAfterDrag = 500;
/** Toast: the same message again within this long counts as a repeat, not a new toast. */
export const repeatQuiet = 1000;
/** RelativeTime refreshes "3 minutes ago" this often. */
export const relativeTick = 15000;
