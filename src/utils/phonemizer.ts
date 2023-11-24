import { Punctuation } from "./punctuation.js";
import ESpeakNg from "../espeak/espeak-ng.js";

class EspeakPhonemizer {
  private punctuation: Punctuation;
  private language: string;
  private ipaFlag: number;

  /**
   * Creates a new instance of a phenomizer that calls E-Speak via WASM.
   *
   * @param language - A language code used by E-Speak to phenomize your text.
   * @param ipaFlag - The IPA version you want E-Speak to generate.
   */
  constructor(language: string = "en", ipaFlag: number = 3) {
    this.language = language;
    this.ipaFlag = ipaFlag;
    this.punctuation = new Punctuation();
  }

  public async phonemize(text: string): Promise<string> {
    // Note: Splits text based on punctuation this is needed
    // to retain punctuation as E-Speak does not include
    // any punctuation in it's phonetic output.
    const [segments, puncMap] = this.punctuation.strip_to_restore(text);

    const phonemizedText: Array<string> = [];

    for (const segment of segments) {
      try {
        // Note: This is a WASM module that we're using
        // to call the E-Speak CLI. There is most likely
        // a more performant way to accomplish what we
        // want long term by calling C functions directly.
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
            `"${segment}"`,
          ],
        });

        const phenoms = espeak.FS.readFile("generated", { encoding: "utf8" });

        phonemizedText.push(this.clean(phenoms));
      } catch (error) {
        console.error("Error calling E-Speak:", error);
        throw error;
      }
    }

    // TODO: We may need to add logic here to remove/clean up the espeak
    // WASM module after it's execution is completed.

    return Punctuation.restore(phonemizedText, puncMap);
  }

  private clean(text: string): string {
    // Note: E-Speak likes to include newlines, returns, etc...
    // for our use case we need all of these removed as they
    // will never exist in our models vocabulary.
    text = text.replace(/\r\n|\n|\r/gm, " ").trim();

    // NOTE: Here there be dragons, for some reason espeak-ng
    // attaches ZJW characters that don't exist in our vocab.
    text = text.replace(/[\u200B-\u200D\uFEFF]/g, "");

    return text;
  }
}

export { EspeakPhonemizer };
