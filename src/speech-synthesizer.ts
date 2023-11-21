import ort from "onnxruntime-node";
import * as fs from "fs";
import { execSync } from "child_process";
import { processText } from "./text-utils.js";
import ESpeakNg from "./espeak-ng.js";
import { resolve } from "path";
import { Module } from "module";

// This resolves a bug with WASM in nodejs.
ort.env.wasm.numThreads = 1;
ort.env.remoteModels = false;

class EspeakPhonemizer {
  private language: string;
  private ipaFlag: number;

  constructor(
    language: string = "en-us",
    ipaFlag: number = 1,
  ) {
    this.language = language;
    this.ipaFlag = ipaFlag;
  }

  public async phonemize(text: string): Promise<string> {
    try {
      const espeak = await ESpeakNg({
        arguments: ["--phonout", "generated", "-q", "-b", "1" ,"--ipa=1", "-v", "en-us", `"${text}"`],
      })

      const output = espeak.FS.readFile('generated', { encoding: 'utf8'})

      console.log("Output: " + output)

      return this.cleanOutput(output);
    } catch (error) {
      console.error("Error executing espeak command:", error);
      return "";
    }
  }

  private cleanOutput(output: string): string {
    output = output.replace(/\r?\n|\r/g, " ").trim();
    // Everything is a lie epseak only needs a single character stripped at the front.
    //output = output.replace(/^.{1}/g, "");
    // Clean and process the output as needed
    // This function can be modified based on how you want to process the output from espeak
    return output;
  }
}

type VocabDictionary = { [character: string]: number };

class TextTokenizer {
  protected vocab: VocabDictionary;
  protected pad: string;
  protected eos: string;
  protected bos: string;
  protected blank: string;
  protected characters: string;
  protected punctuations: string;

  constructor(
    characters: string,
    punctuations: string,
    pad: string = "<PAD>",
    eos: string = "<EOS>",
    bos: string = "<BOS>",
    blank: string = "<BLNK>"
  ) {
    this.pad = pad;
    this.eos = eos;
    this.bos = bos;
    this.blank = blank;
    this.characters = characters;
    this.punctuations = punctuations;
    this.vocab = this.createVocab();
  }

  protected createVocab(): VocabDictionary {
    const vocab: VocabDictionary = {};
    let index = 0;

    // Add special symbols conditionally
    [this.pad, this.eos, this.bos, this.blank].forEach((symbol) => {
      if (symbol && symbol.length > 0) vocab[symbol] = index++;
    });

    // Add characters and punctuations
    this.characters.split("").concat(this.punctuations.split("")).forEach((char) => {
      if (!vocab.hasOwnProperty(char)) {
        vocab[char] = index++;
      }
    });

    return vocab;
  }

  public tokenize(text: string): number[] {
    return text.split("").map((char) => {
      if (this.vocab.hasOwnProperty(char)) {
        return this.vocab[char];
      }
      throw new Error(`Character ${char} not in vocabulary.`);
    });
  }
}

class VitsCharacters extends TextTokenizer {
  constructor(
    graphemes: string = "",
    punctuations: string = "",
    pad: string = "_",
    ipaCharacters: string = ""
  ) {
    // Concatenate graphemes and IPA characters if IPA characters are provided
    if (ipaCharacters) {
      graphemes += ipaCharacters;
    }

    // Call the super constructor of TextTokenizer
    super(graphemes, punctuations, pad, undefined, undefined, "<BLNK>");
  }

  public intersperseBlankChar(charSequence): Array<string> {
    const charToUse = this.blank ? this.vocab[this.blank] + 1 : this.vocab[this.pad];
    let result = new Array(charSequence.length * 2 + 1).fill(charToUse);
    for (let i = 0; i < charSequence.length; i++) {
        result[i * 2 + 1] = charSequence[i];
    }
    return result;
  }

  protected createVocab(): VocabDictionary {
    const vocab: VocabDictionary = {};

    console.log(this.blank);
    // Add pad and punctuations to vocab
    [
      this.pad,
      ...this.punctuations.split(""),
      ...this.characters.split(""),
      this.blank
    ].forEach((symbol) => {
      if (symbol && !vocab.hasOwnProperty(symbol)) {
        vocab[symbol] = Object.keys(vocab).length;
      }
    });

    return vocab;
  }
}

class SpeechSynthesizer {
  private session: ort.InferenceSession;

  private constructor(session: ort.InferenceSession) {
    this.session = session;
  }

  static async create(uri: string = "./model/vits.onnx") {
    const opt: ort.InferenceSession.SessionOptions = {
      executionProviders: ["cpu"],
      logSeverityLevel: 3,
      logVerbosityLevel: 3,
      enableCpuMemArena: false,
      enableMemPattern: false,
      enableProfiling: false,
      graphOptimizationLevel: "disabled",

    };

    // For compatability convert the URI into a properly
    // formatted URL. This will work for NodeJS and Web.
    const path = new URL(uri, import.meta.url);

    let session: ort.InferenceSession;

    if (typeof window === "undefined") {
      // Only read in the model file in NodeJS.
      const model = fs.readFileSync(path);

      session = await ort.InferenceSession.create(model, opt);
    } else {
      session = await ort.InferenceSession.create(uri, opt);
    }

    return new SpeechSynthesizer(session);
  }

  async process(text: string): Promise<any> {
    console.log("Text: " + processText(text));
    const phenomizer = new EspeakPhonemizer("en-us", 1);
    const phenomes = await phenomizer.phonemize(processText(text));
    console.log("Phenomes: " + phenomes)

    const tokenizer = new VitsCharacters(
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
      ";:,.!?¡¿—…\"«»“” ",
      "_",
      "ɑɐɒæɓʙβɔɕçɗɖðʤəɘɚɛɜɝɞɟʄɡɠɢʛɦɧħɥʜɨɪʝɭɬɫɮʟɱɯɰŋɳɲɴøɵɸθœɶʘɹɺɾɻʀʁɽʂʃʈʧʉʊʋⱱʌɣɤʍχʎʏʑʐʒʔʡʕʢǀǁǂǃˈˌːˑʼʴʰʱʲʷˠˤ˞↓↑→↗↘'̩'ᵻ"
    );

    const tokens = tokenizer.tokenize(phenomes);
    console.log("Tokens: " + tokens)

    const interspersed = tokenizer.intersperseBlankChar(tokens);
    console.log("Interspersed: " + interspersed)

    const x = new ort.Tensor("int64", interspersed, [1, interspersed.length]);
    const x_length = new ort.Tensor("int64", [x.dims[1]]);
    const noiseScale = 0.667;
    const lengthScale = 1.0;
    const noiseScaleDP = 0.8;

    const scales = new ort.Tensor(
      "float32",
      new Float32Array([noiseScale, lengthScale, noiseScaleDP])
    );

    const input: Record<string, any> = {
      input: x,
      input_lengths: x_length,
      scales: scales
    };

    const output = await this.session.run(input, {});

    return output.output.data;
  }
}

export { SpeechSynthesizer };
