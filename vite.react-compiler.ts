import babel from "vite-plugin-babel";
import type { Plugin } from "vite";

/**
 * Home + pause presentation shells (annotation mode — only `"use memo"` functions compile).
 * ADR 2026-05-23 track A.
 */
const REACT_COMPILER_PILOT_INCLUDE = [
  /[/\\]src[/\\]screens[/\\]home[/\\]components[/\\][^/\\]+\.tsx$/,
  /[/\\]src[/\\]screens[/\\]pause[/\\]components[/\\][^/\\]+\.tsx$/,
] as const;

/**
 * React Compiler (annotation mode): opt in per function with `"use memo"`.
 * Set `HOLZEN_REACT_COMPILER=0` to disable.
 */
export function reactCompilerPilotPlugin(): Plugin | false {
  if (process.env.HOLZEN_REACT_COMPILER === "0") return false;

  return babel({
    enforce: "pre",
    include: [...REACT_COMPILER_PILOT_INCLUDE],
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
