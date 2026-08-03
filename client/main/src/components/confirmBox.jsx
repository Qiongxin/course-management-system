const confirmBox = ({ message, onOk, onCancel }) => {
  return (
    <div className="notice">
      <div className="notice-box">
        <p className="content">{message}</p>
        <div className="btn-row">
          <button onClick={onOk}>OK</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default confirmBox;