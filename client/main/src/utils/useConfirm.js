import { useState } from "react";
import ConfirmBox from "../components/confirmBox";

const useConfirm = () => {
  const [state, setState] = useState({
    show: false,
    message: "",
    resolve: null,
  });

  const confirm = (message) => {
    return new Promise((resolve) => {
      setState({ show: true, message, resolve });
    });
  };

  const handleOk = () => {
    state.resolve(true);
    setState({ ...state, show: false });
  };

  const handleCancel = () => {
    state.resolve(false);
    setState({ ...state, show: false });
  };

  const ConfirmComponent = state.show ? (
    <ConfirmBox message={state.message} onOk={handleOk} onCancel={handleCancel} />
  ) : null;

  return { confirm, ConfirmComponent };
}

export default useConfirm;