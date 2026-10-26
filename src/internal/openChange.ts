/** Why an overlay asks to open or close, passed to onOpenChange as { reason }.
    'trigger': its trigger was pressed. 'escape': Escape was pressed. 'outside': a press outside it.
    'blur': focus moved somewhere else. 'close': its close button, or a close() it handed you, such as a Done button's.
    'api': the browser closed it itself, as dialog.close() or a form with method="dialog" do.
    'select': an item in it was chosen, as a MenuItem is.
    'hover': the pointer came onto its element or left it. 'focus': its element took focus from the keyboard.
    'swipe': a touch drag flung it back toward its edge, as on a Drawer. */
export type OpenChangeReason = "trigger" | "escape" | "outside" | "blur" | "close" | "api" | "select" | "hover" | "focus" | "swipe";

/** The second argument of onOpenChange. */
export interface OpenChangeDetails { reason: OpenChangeReason }
