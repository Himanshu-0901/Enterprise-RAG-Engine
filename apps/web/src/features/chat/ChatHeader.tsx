import type { ReactElement } from "react";
import { Check, Download, Pencil, Trash2, X } from "lucide-react";

type ChatHeaderProps = {
  activeTitle: string;
  allowAnswerExport: boolean;
  draftTitle: string;
  editingTitle: boolean;
  hasConversation: boolean;
  onCancel: () => void;
  onDelete: () => void;
  onDraftTitleChange: (value: string) => void;
  onEdit: () => void;
  onExport: () => void;
  onRename: () => void;
};

export function ChatHeader(props: ChatHeaderProps) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3">
      {props.editingTitle ? (
        <input
          className="h-9 min-w-0 flex-1 rounded-md border border-zinc-200 px-3 text-sm font-medium outline-none focus:border-zinc-500"
          value={props.draftTitle}
          onChange={(event) => props.onDraftTitleChange(event.target.value)}
        />
      ) : (
        <h3 className="min-w-0 truncate text-sm font-semibold text-zinc-950">
          {props.activeTitle}
        </h3>
      )}
      {props.hasConversation ? (
        <div className="flex shrink-0 items-center gap-1">
          <IconButton
            disabled={!props.allowAnswerExport}
            label={
              props.allowAnswerExport
                ? "Export conversation"
                : "Answer exports disabled"
            }
            onClick={props.onExport}
          >
            <Download />
          </IconButton>
          <IconButton
            label={props.editingTitle ? "Save title" : "Rename conversation"}
            onClick={props.editingTitle ? props.onRename : props.onEdit}
          >
            {props.editingTitle ? <Check /> : <Pencil />}
          </IconButton>
          {props.editingTitle ? (
            <IconButton label="Cancel rename" onClick={props.onCancel}>
              <X />
            </IconButton>
          ) : (
            <IconButton label="Delete conversation" onClick={props.onDelete}>
              <Trash2 />
            </IconButton>
          )}
        </div>
      ) : null}
    </div>
  );
}

function IconButton({
  children,
  disabled = false,
  label,
  onClick
}: {
  children: ReactElement;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
