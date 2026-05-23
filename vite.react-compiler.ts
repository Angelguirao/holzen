import babel from "vite-plugin-babel";
import type { Plugin } from "vite";

/** Pilot surfaces — ADR 2026-05-23 track A; expand only after profiling. */
const REACT_COMPILER_PILOT_SUFFIXES = [
  "HomeDashboardLayout.tsx",
  "PauseSessionScaffoldShell.tsx",
] as const;

/**
 * React Compiler (annotation mode): only files marked with `"use memo"` in the
 * pilot list above are transformed. Set `HOLZEN_REACT_COMPILER=0` to disable.
 */
export function reactCompilerPilotPlugin(): Plugin | false {
  if (process.env.HOLZEN_REACT_COMPILER === "0") return false;

  return babel({
    enforce: "pre",
    include: REACT_COMPILER_PILOT_SUFFIXES.map(
      (suffix) => new RegExp(`${suffix.replace(".", "\\.")}$`),
    ),
    babelConfig: {
      presets: [
        ["@babel/preset-typescript", { isTSX: true, allExtensions: true }],
      ],
      plugins: [
        ["babel-plugin-react-compiler", { compilationMode: "annotation" }],
      ],
    },
  }) as Plugin;
}
