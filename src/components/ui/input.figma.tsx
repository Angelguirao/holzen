import figma from "@figma/code-connect/react";

import { Input } from "@/components/ui/input";

figma.connect(
  Input,
  "https://www.figma.com/design/5CTApv6IlReBfdB0YS6zxq/Nox-Components?node-id=111-67",
  {
    example: () => <Input placeholder="Label" />,
  },
);
