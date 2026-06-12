import React, { useEffect } from "react";

/**
 * Modal - Componente modal reutilizable
 * Se cierra con el botón X o haciendo clic fuera
 */
export default function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title?: React.ReactNode; children: React.ReactNode }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          &times;
        </button>
        {title && (
          <h2 style={{ color: "var(--color-primary)", marginBottom: "16px", fontSize: "1.4rem" }}>
            {title}
          </h2>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
}
