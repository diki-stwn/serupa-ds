/** Why an overlay asks to open or close, passed to onOpenChange as { reason }.
    'trigger': its trigger was pressed. 'escape': Escape was pressed. 'outside': a press outside it.
    'blur': focus moved somewhere else. 'close': its close button, or a close() it handed you, such as a Done button's.
    'api': the browser closed it itself, as dialog.close() or a form with method="dialog" do. */
export type OpenChangeReason = "trigger" | "escape" | "outside" | "blur" | "close" | "api";

/** The second argument of onOpenChange. */
export interface OpenChangeDetails { reason: OpenChangeReason }
