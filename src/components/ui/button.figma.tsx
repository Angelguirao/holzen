import figma from "@figma/code-connect/react";

import { Button } from "@/components/ui/button";

figma.connect(
  Button,
  "https://www.figma.com/design/5CTApv6IlReBfdB0YS6zxq/Nox-Components?node-id=23-432",
  {
    props: {
      disabled: figma.enum("State", {
        Active: false,
        Pressed: false,
        Disabled: true,
      }),
      variant: figma.enum("Type", {
        Primary: "primary",
        Secondary: "secondary",
        Tertiary: "tertiary",
      }),
      label: figma.textContent("Button"),
    },
    example: ({ disabled, variant, label }) => (
      <Button variant={variant} disabled={disabled}>
        {label}
      </Button>
    ),
  },
);
