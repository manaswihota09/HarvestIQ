import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidthClass="max-w-md">
      <p className="text-sm leading-relaxed text-[#5B6660]">{message}</p>
      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-[#DFE6DD] bg-white px-4 py-2 text-sm font-medium text-[#202923] transition-colors hover:bg-[#F7F9F5] whitespace-nowrap"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors whitespace-nowrap ${
            destructive
              ? 'bg-[#B91C1C] hover:bg-[#991B1B]'
              : 'bg-[#153F32] hover:bg-[#0F2F25]'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
