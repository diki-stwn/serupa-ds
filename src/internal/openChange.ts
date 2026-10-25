/** Why an overlay asks to open or close, passed to onOpenChange as { reason }.
    'trigger': its trigger was pressed. 'escape': Escape was pressed. 'outside': a press outside it.
    'blur': focus moved somewhere else. 'close': a close() it handed you, such as a Done button's. */
export type OpenChangeReason = "trigger" | "escape" | "outside" | "blur" | "close";

/** The second argument of onOpenChange. */
export interface OpenChangeDetails { reason: OpenChangeReason }
