export type LessonkitTheme = {
  name: string;
  colors?: {
    background?: string;
    foreground?: string;
    primary?: string;
    muted?: string;
  };
  radius?: {
    sm?: string;
    md?: string;
    lg?: string;
  };
};

export const defaultTheme: LessonkitTheme = {
  name: "default",
  colors: {
    background: "#ffffff",
    foreground: "#111827",
    primary: "#2563eb",
    muted: "#6b7280"
  },
  radius: {
    sm: "6px",
    md: "10px",
    lg: "14px"
  }
};

