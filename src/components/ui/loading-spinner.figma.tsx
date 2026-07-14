import figma from "@figma/code-connect/react";

import { LoadingSpinner } from "@/components/ui/loading-spinner";

figma.connect(
  LoadingSpinner,
  "https://www.figma.com/design/5CTApv6IlReBfdB0YS6zxq/Nox-Components?node-id=71-434",
  {
    example: () => <LoadingSpinner />,
  },
);
