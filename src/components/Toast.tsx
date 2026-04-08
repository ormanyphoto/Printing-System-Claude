interface ToastProps { message: string; visible: boolean; }

export default function Toast({ message, visible }: ToastProps) {
  return (
    <div id="toast" className={visible ? 'show' : ''}>
      <div className="toast-dot"></div>
      <span>{message}</span>
    </div>
  );
}
