// components/ui/ToastNotification.tsx
'use client';

import { toast, ToastOptions } from 'react-toastify';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

/**
 * Custom toast notification utility
 * Replaces window.alert() with modern, non-blocking notifications
 */

const defaultOptions: ToastOptions = {
  position: 'top-center',
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const showToast = {
  /**
   * Success notification (green)
   * Use for: successful operations, confirmations
   */
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, {
      ...defaultOptions,
      ...options,
      icon: <CheckCircle2 className="w-5 h-5" />,
    });
  },

  /**
   * Error notification (red)
   * Use for: errors, failed operations
   */
  error: (message: string, options?: ToastOptions) => {
    toast.error(message, {
      ...defaultOptions,
      ...options,
      icon: <XCircle className="w-5 h-5" />,
    });
  },

  /**
   * Warning notification (yellow/orange)
   * Use for: warnings, cautions
   */
  warning: (message: string, options?: ToastOptions) => {
    toast.warning(message, {
      ...defaultOptions,
      ...options,
      icon: <AlertCircle className="w-5 h-5" />,
    });
  },

  /**
   * Info notification (blue)
   * Use for: informational messages
   */
  info: (message: string, options?: ToastOptions) => {
    toast.info(message, {
      ...defaultOptions,
      ...options,
      icon: <Info className="w-5 h-5" />,
    });
  },

  /**
   * Promise-based toast
   * Use for: async operations with loading/success/error states
   */
  promise: async <T,>(
    promise: Promise<T>,
    messages: {
      pending: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: ToastOptions
  ) => {
    return toast.promise(
      promise,
      messages,
      {
        ...defaultOptions,
        ...options,
      }
    );
  },
};

/**
 * Confirmation dialog replacement
 * Modern replacement for window.confirm()
 */
export const showConfirm = (
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) => {
  const toastId = toast.info(
    <div className="space-y-4">
      <p className="text-sm text-white">{message}</p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => {
            if (onCancel) onCancel();
            toast.dismiss(toastId);
          }}
          className="px-4 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onConfirm();
            toast.dismiss(toastId);
          }}
          className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Confirm
        </button>
      </div>
    </div>,
    {
      position: 'top-center',
      autoClose: false,
      closeOnClick: false,
      closeButton: false,
      draggable: false,
      style: {
        background: '#1a1a1a',
        border: '1px solid #333',
      },
    }
  );

  return toastId;
};

export default showToast;
