type NoticeBannerProps = {
  type: "success" | "error";
  title: string;
  message: string;
  onClose?: () => void;
};

export function NoticeBanner({
  type,
  title,
  message,
  onClose,
}: NoticeBannerProps) {
  return (
    <div
      className={`wowui-notice wowui-notice--${type}`}
      role="status"
      aria-live="polite"
    >
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>

      {onClose ? (
        <button type="button" onClick={onClose}>
          ×
        </button>
      ) : null}
    </div>
  );
}