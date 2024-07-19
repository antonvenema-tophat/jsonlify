import { jsonlify } from "./jsonlify";
import { program } from "commander";

program
  .name("jsonlify")
  .option("-i, --input <PATH>", "Input JSON directory.", "./assets")
  .option("-o, --output <PATH>", "Output JSONL directory.", "./assets/out")
  .description("CLI to convert courses from a JSON export to JSONL.");

program.parse();

const options = program.opts();

(async () => {
  await jsonlify({
    inputPath: options.input,
    outputPath: options.output,
  });
})();