import React from "react";

const AlertBanner = ({ type = "error", message, onClose }) => {
  if (!message) return null;

  return (
    <div className={`alert alert-${type}`}>
      <span>{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="alert-close"
          aria-label="Close notification"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default AlertBanner;
