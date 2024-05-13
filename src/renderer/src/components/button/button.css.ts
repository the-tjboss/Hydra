import { style, styleVariants } from "@vanilla-extract/css";
import { SPACING_UNIT, vars } from "../../theme.css";

const base = style({
  padding: `${SPACING_UNIT}px ${SPACING_UNIT * 2}px`,
  backgroundColor: vars.color.muted,
  borderRadius: "8px",
  border: "solid 1px transparent",
  transition: "all ease 0.2s",
  cursor: "pointer",
  minHeight: "40px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: `${SPACING_UNIT}px`,
  ":active": {
    opacity: vars.opacity.active,
  },
  ":disabled": {
    opacity: vars.opacity.disabled,
    pointerEvents: "none",
    cursor: "not-allowed",
  },
});

export const button = styleVariants({
  primary: [
    base,
    {
      ":hover": {
        backgroundColor: "#DADBE1",
      },
    },
  ],
  outline: [
    base,
    {
      backgroundColor: "transparent",
      border: `solid 1px ${vars.color.border}`,
      color: vars.color.muted,
      ":hover": {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
      },
    },
  ],
  dark: [
    base,
    {
      backgroundColor: vars.color.darkBackground,
      color: "#c0c1c7",
    },
  ],
});
