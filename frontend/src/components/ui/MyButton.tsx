/**
 * MyButton - Componente de botón reutilizable al estilo Kahoot
 * Soporta variantes: primary, secondary, danger, purple, blue, yellow
 * Muestra estado "Cargando..." con isSubmitting
 */
import React, { CSSProperties } from 'react';

interface MyButtonProps {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger" | "purple" | "blue" | "yellow";
  disabled?: boolean;
  isSubmitting?: boolean;
  fullWidth?: boolean;
  style?: CSSProperties;
}

export default function MyButton({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  isSubmitting = false,
  fullWidth = false,
  style: customStyle = {},
}: MyButtonProps) {
  const base: CSSProperties = {
    padding: "12px 24px",
    borderRadius: "12px",
    border: "none",
    fontWeight: "800",
    fontSize: "1rem",
    cursor: disabled || isSubmitting ? "not-allowed" : "pointer",
    transition: "transform 0.1s, box-shadow 0.1s, background-color 0.2s",
    opacity: disabled || isSubmitting ? 0.6 : 1,
    width: fullWidth ? "100%" : "auto",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    userSelect: "none",
  };

  const variants = {
    primary: {
      backgroundColor: "var(--color-primary)",
      color: "#ffffff",
      boxShadow: "0 4px 0 #113f15",
    },
    secondary: {
      backgroundColor: "var(--color-bg-card)",
      color: "var(--color-text)",
      boxShadow: "0 4px 0 var(--color-border)",
      border: "2px solid var(--color-border)",
    },
    danger: {
      backgroundColor: "var(--color-kahoot-red)",
      color: "#fff",
      boxShadow: "0 4px 0 #a9132d",
    },
    purple: {
      backgroundColor: "var(--color-kahoot-purple)",
      color: "#fff",
      boxShadow: "0 4px 0 #331169",
    },
    blue: {
      backgroundColor: "var(--color-kahoot-blue)",
      color: "#fff",
      boxShadow: "0 4px 0 #04328a",
    },
    yellow: {
      backgroundColor: "var(--color-kahoot-yellow)",
      color: "#fff",
      boxShadow: "0 4px 0 #a17600",
    },
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isSubmitting) return;
    e.currentTarget.style.transform = "translateY(2px)";
    e.currentTarget.style.boxShadow = "0 2px 0 rgba(0,0,0,0.2)";
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isSubmitting) return;
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = variants[variant]?.boxShadow || "none";
  };

  return (
    <button
      type={type}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      disabled={disabled || isSubmitting}
      style={{ ...base, ...variants[variant], ...customStyle }}
    >
      {isSubmitting ? "..." : children}
    </button>
  );
}
