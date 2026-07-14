import figma from "@figma/code-connect/react";

import { Badge } from "@/components/ui/badge";

figma.connect(
  Badge,
  "https://www.figma.com/design/5CTApv6IlReBfdB0YS6zxq/Nox-Components?node-id=203-193",
  {
    props: {
      variant: figma.enum("State", {
        Default: "outline",
        Selected: "default",
      }),
    },
    example: ({ variant }) => <Badge variant={variant}>Tag</Badge>,
  },
);
