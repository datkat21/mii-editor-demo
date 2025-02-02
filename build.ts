/**
 * Builds a TypeScript file to a directory.
 * @param filePath The file path.
 * @param outputDir Directory to output the compiled file.
 * @param minify Whether or not to minify the compiled output. Useful for debugging.
 * @returns void
 */
export async function compile(
  filePath: string,
  outputDir: string
): Promise<any> {
  let output = (await Bun.build({
    entrypoints: [filePath],
    outdir: outputDir,
    splitting: false,
    emitDCEAnnotations: true,
    sourcemap: "linked",
    minify: {
      // identifiers: true,
      // syntax: true,
      // whitespace: true,
    },
  }).catch((e) => {
    console.error("Failed to build:", e);
  })) as BuildOutput;
  if (output.logs) {
    for (const log of output.logs) {
      console.error(log.message);
    }
  }
}

import { join } from "path";
import { watch } from "fs";

import type { BuildOutput } from "bun";

async function build() {
  try {
    await compile("./src/main.ts", "./public/dist/");
  } catch (e) {
    console.log(e);
  }
}

const watcher = watch(
  join(import.meta.dir, "./src"),
  { recursive: true },
  async (event, filename) => {
    console.log(`Detected ${event} in ${filename}`);
    build();
  }
);

console.log("Watching!");
build();
