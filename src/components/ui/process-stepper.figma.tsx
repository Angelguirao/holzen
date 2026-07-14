import figma from "@figma/code-connect/react";

import { ProcessStepper } from "@/components/ui/process-stepper";

figma.connect(
  ProcessStepper,
  "https://www.figma.com/design/5CTApv6IlReBfdB0YS6zxq/Nox-Components?node-id=61-217",
  {
    props: {
      activeIndex: figma.enum("Step", {
        One: 0,
        Two: 1,
        Tree: 2,
        Four: 3,
        Full: 4,
      }),
    },
    example: ({ activeIndex }) => (
      <ProcessStepper
        activeIndex={activeIndex}
        steps={["Feel", "Breathe", "Reflect", "Decide", "Done"]}
      />
    ),
  },
);
