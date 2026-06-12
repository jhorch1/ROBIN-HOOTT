import { forwardRef, InputHTMLAttributes, CSSProperties } from "react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * FormInput - Input reutilizable con soporte para errores
 * Compatible con React Hook Form via forwardRef
 */
const FormInput = forwardRef<HTMLInputElement, FormInputProps>(function FormInput(
  { label, type = "text", placeholder, error, ...rest },
  ref
) {
  const wrapperStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  };

  const labelStyle = {
    color: "var(--color-text)",
    fontSize: "0.9rem",
    fontWeight: "600",
  };

  const inputStyle = {
    padding: "12px 14px",
    borderRadius: "6px",
    border: error ? "1px solid #d32f2f" : "1px solid var(--color-border)",
    backgroundColor: "var(--color-bg-card)",
    color: "var(--color-text)",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.3s",
    width: "100%",
  };

  const errorStyle = {
    color: "#d32f2f",
    fontSize: "0.8rem",
    marginTop: "2px",
  };

  return (
    <div style={wrapperStyle}>
      {label && <label style={labelStyle}>{label}</label>}
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        style={inputStyle}
        {...rest}
      />
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
});

export default FormInput;
