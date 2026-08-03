const Notice = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="notice">
      <div className="notice-box">
        <div className="content">{message}</div>
        <button onClick={onClose}>OK</button>
      </div>
    </div>
  );
}

export default Notice;