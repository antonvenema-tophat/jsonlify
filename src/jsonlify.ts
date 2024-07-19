import chalk from "chalk";
import fs from "fs";
import path from "path";

const escapeUTF = (s: string): string => {
  return s.replace(/[^\x20-\x7F]/g, (x: any) => "\\u" + ("000"+x.codePointAt(0).toString(16)).slice(-4));
};

const processQuestion = (data: any): string => {
  let content = `Question: ${data.question}`;
  if (data.choices?.length) {
    content += `\nChoices: [${data.choices.join(", ")}]`;
  }
  if (data.correct_answers?.length) {
    content += `\nCorrect Answers: [${data.correct_answers.join(", ")}]`;
  }
  if (data.explanation_text) {
    content += `\nExplanation Text: ${data.explanation_text}`;
  }
  if (data.formula) {
    content += `\nFormula: ${data.formula}`;
  }
  if (data.image_url) {
    content += `\nImage: ${data.image_url}`;
  }
  if (data.match_a?.length) {
    content += `\nMatch A: [${data.match_a.join(", ")}]`;
  }
  if (data.match_b?.length) {
    content += `\nMatch B: [${data.match_b.join(", ")}]`;
  }
  if (data.numeric_blanks) {
    for (const numeric_blank of data.numeric_blanks) {
      content += `\nNumeric Blank (${numeric_blank.keyword}): ${numeric_blank.answer}`;
    }
  }
  if (data.sorted_options?.length) {
    content += `\nSorted Options: [${data.sorted_options.join(", ")}]`;
  }
  if (data.word_blanks) {
    for (const word_blank of data.word_blanks) {
      content += `\nWord Blank (${word_blank.keyword}): [${word_blank.correct_answers_list.join(", ")}]`;
    }
  }
  return content;
}

const toJsonL = (document: any): string => {
  let jsonl = "";
  if (document.data != "{}") {
    const data = JSON.parse(document.data);
    if (data.content) {
      if (data.tag_text != undefined) {
        data.content = data.tag_text;
        delete data.tag_text;
      } else if (data.item_details != undefined) {
        if (data.item_details.content) {
          data.content = data.item_details.content;
        } else if (data.item_details.question) {
          data.content = processQuestion(data.item_details);
        } else if (data.item_details.question_variants) {
          data.content = data.item_details.question_variants.map((x: any) => processQuestion(x)).join("\n\n");
        } else if (data.item_details.body) {
          data.content = data.item_details.body;
        }
        delete data.item_details;
      }
    } else if (data.display_name) {
      data.content = data.display_name;
      delete data.display_name;;
    }
    if (data.content) {
      jsonl += `${escapeUTF(JSON.stringify({
        content: data.content,
      }))}\n`;
    }
  }
  if (document.children) {
    for (const child of document.children) {
      jsonl += toJsonL(child);
    }
  }
  return jsonl;
};

const jsonlify = async (o: Options) => {
  const inputPath = path.join(__dirname, o.inputPath);
  const outputPath = path.join(__dirname, o.outputPath);

  console.log(chalk.green("Testing output directory..."));
  try { await fs.promises.mkdir(outputPath); } catch { }

  for (const inputFileName of await fs.promises.readdir(inputPath)) {
    if (!inputFileName.endsWith(".json")) continue;
    const outputFileName = inputFileName.replace(".json", ".jsonl");

    console.log();
    console.log(chalk.green(`Reading ${inputFileName}...`));
    const inputFile = await fs.promises.readFile(path.join(inputPath, inputFileName), "utf-8");

    console.log(chalk.green(`Parsing ${inputFileName}...`));
    const inputObject = JSON.parse(inputFile);

    console.log(chalk.green(`Opening ${outputFileName}...`));
    const outputFile = await fs.promises.open(path.join(outputPath, outputFileName), "w");
    try {
      console.log(chalk.green(`Writing ${outputFileName}...`));
      await outputFile.write(toJsonL(inputObject["learning_material_data"]));

      console.log(chalk.green(`Closing ${outputFileName}...`));
      await outputFile.close();
    } catch (error) {
      console.log(chalk.red(`Error: ${error}`));
      outputFile.close();

      console.log(chalk.red(`Deleting ${outputFileName}...`));
      await fs.promises.rm(path.join(outputPath, outputFileName));
    }
  }
};

export { jsonlify };