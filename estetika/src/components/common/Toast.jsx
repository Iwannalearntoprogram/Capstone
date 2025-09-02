import { useEffect } from "react";
import { FiCheck, FiX, FiAlertCircle, FiInfo } from "react-icons/fi";

const Toast = ({
  isVisible,
  message,
  type = "success", // 'success', 'error', 'warning', 'info'
  duration = 3000,
  onClose,
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getToastStyles = () => {
    switch (type) {
      case "success":
        return {
          bg: "bg-green-50 border-green-200",
          icon: <FiCheck className="text-green-600" size={20} />,
          text: "text-green-800",
        };
      case "error":
        return {
          bg: "bg-red-50 border-red-200",
          icon: <FiAlertCircle className="text-red-600" size={20} />,
          text: "text-red-800",
        };
      case "warning":
        return {
          bg: "bg-yellow-50 border-yellow-200",
          icon: <FiAlertCircle className="text-yellow-600" size={20} />,
          text: "text-yellow-800",
        };
      case "info":
        return {
          bg: "bg-blue-50 border-blue-200",
          icon: <FiInfo className="text-blue-600" size={20} />,
          text: "text-blue-800",
        };
      default:
        return {
          bg: "bg-gray-50 border-gray-200",
          icon: <FiInfo className="text-gray-600" size={20} />,
          text: "text-gray-800",
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div
        className={`${styles.bg} border rounded-lg shadow-lg p-4 min-w-80 max-w-md`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>
          <div className="flex-1">
            <p className={`${styles.text} font-medium text-sm`}>{message}</p>
          </div>
          <button
            onClick={onClose}
            className={`${styles.text} hover:opacity-70 transition-opacity`}
          >
            <FiX size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
