import { Punctuation } from "./punctuation.js";
import ESpeakNg from "./espeak-ng.js";

class EspeakPhonemizer {
  private punctuation: Punctuation;
  private language: string;
  private ipaFlag: number;

  constructor(language: string = "en-us", ipaFlag: number = 3) {
    this.language = language;
    this.ipaFlag = ipaFlag;
    this.punctuation = new Punctuation();
  }

  public async phonemize(text: string): Promise<string> {
    const [preprocessedText, puncMap] = this.punctuation.strip_to_restore(text);

    let phenomized: Array<string> = [];

    for (const text of preprocessedText) {
      try {
        const espeak = await ESpeakNg({
          arguments: [
            "--phonout",
            "generated",
            '--sep=""',
            "-q",
            "-b=1",
            `--ipa=${this.ipaFlag}`,
            "-v",
            `${this.language}`,
            `"${text}"`,
          ],
        });

        const output = espeak.FS.readFile("generated", { encoding: "utf8" });

        phenomized.push(this.cleanOutput(output));
      } catch (error) {
        console.error("Error executing espeak command:", error);
        return "";
      }
    }

    return Punctuation.restore(phenomized, puncMap);
  }

  private cleanOutput(output: string): string {
    output = output.replace(/\r\n|\n|\r/gm, " ").trim();
    output = output.replace(/\u0000/g, "");
    output = output.replace(/[\u200B-\u200D\uFEFF]/g, "");
    // Everything is a lie epseak only needs a single character stripped at the front.
    //output = output.replace(/^.{1}/g, "");
    // Clean and process the output as needed
    // This function can be modified based on how you want to process the output from espeak
    return output;
  }
}

export { EspeakPhonemizer };
