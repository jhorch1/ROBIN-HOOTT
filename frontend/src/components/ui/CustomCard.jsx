/**
 * CustomCard - Tarjeta reutilizable con estilo de mosaico (Kahoot-inspired)
 * Acepta título, ícono, children y variante de color
 */
export default function CustomCard({ 
  title, 
  icon, 
  children, 
  variant = "default",
  style: customStyle = {} 
}) {
  const variants = {
    default: { borderTop: "4px solid var(--color-primary)", color: "var(--color-primary)" },
    purple: { borderTop: "4px solid var(--color-kahoot-purple)", color: "var(--color-kahoot-purple)" },
    blue: { borderTop: "4px solid var(--color-kahoot-blue)", color: "var(--color-kahoot-blue)" },
    red: { borderTop: "4px solid var(--color-kahoot-red)", color: "var(--color-kahoot-red)" },
    yellow: { borderTop: "4px solid var(--color-kahoot-yellow)", color: "var(--color-kahoot-yellow)" },
  };

  const currentVariant = variants[variant] || variants.default;

  const cardStyle = {
    backgroundColor: "var(--color-bg-card)",
    borderRadius: "var(--border-radius)",
    padding: "32px",
    border: "1px solid var(--color-border)",
    boxShadow: "var(--shadow-md), var(--shadow-tactile)",
    transition: "transform 0.2s, box-shadow 0.2s",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    ...currentVariant,
    ...customStyle,
  };

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  };

  const iconStyle = {
    fontSize: "1.5rem",
    backgroundColor: "var(--color-icon-bg)",
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
    color: "inherit",
    flexShrink: 0
  };


  const titleStyle = {
    fontSize: "1.25rem",
    fontWeight: "800",
    color: "inherit",
    margin: 0,
  };

  return (
    <div className="custom-card hover-lift" style={cardStyle}>
      {(icon || title) && (
        <div style={headerStyle}>
          {icon && <span style={iconStyle}>{icon}</span>}
          {title && <h3 style={titleStyle}>{title}</h3>}
        </div>
      )}
      <div style={{ color: "var(--color-text-muted)", lineHeight: "1.6", fontSize: "0.95rem" }}>
        {children}
      </div>
    </div>
  );
}
