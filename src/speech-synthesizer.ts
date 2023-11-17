import ort from "onnxruntime-web";
import * as fs from "fs";
import { execSync } from "child_process";
import { processText } from "./text-utils.js";

// This resolves a bug with WASM in nodejs.
ort.env.wasm.numThreads = 1;
ort.env.remoteModels = false;

class EspeakPhonemizer {
  private language: string;
  private ipaFlag: number;

  constructor(
    language: string = "en",
    ipaFlag: number = 1,
  ) {
    this.language = language;
    this.ipaFlag = ipaFlag;
  }

  public phonemize(text: string): string {
    try {
      const command = `espeak --ipa=${this.ipaFlag} -q -b 1 -v ${this.language} "${text}"`;
      const output = execSync(command).toString("utf8");
      return this.cleanOutput(output);
    } catch (error) {
      console.error("Error executing espeak command:", error);
      return "";
    }
  }

  private cleanOutput(output: string): string {
    console.log("output: " + output);
    output = output.replace(/\r?\n|\r/g, "");
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
    blank: string = " "
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

    // Add special symbols
    [this.blank, this.bos, this.eos, this.pad].forEach((symbol) => {
      if (symbol) vocab[symbol] = index++;
    });

    // Add characters and punctuations
    (this.characters + this.punctuations).split("").forEach((char) => {
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
    super(graphemes, punctuations, pad, undefined, undefined, "_");
  }

  protected createVocab(): VocabDictionary {
    const vocab: VocabDictionary = {};

    // Add pad and punctuations to vocab
    [
      this.pad,
      ...this.punctuations.split(""),
      ...this.characters.split(""),
      this.blank,
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

  static async create(uri: string = "./model/vits-2.onnx") {
    const opt: ort.InferenceSession.SessionOptions = {
      executionProviders: ["cpu"],
      logSeverityLevel: 3,
      logVerbosityLevel: 3,
      executionMode: "parallel"
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
    console.log("Text to synthesize: " + text);
    const phenomizer = new EspeakPhonemizer("en-us", 1);
    const phenomes = phenomizer.phonemize(processText(text));

    const tokenizer = new VitsCharacters(
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
      ';:,.!?¡¿—…"«»“” ',
      "_",
      "ɑɐɒæɓʙβɔɕçɗɖðʤəɘɚɛɜɝɞɟʄɡɠɢʛɦɧħɥʜɨɪʝɭɬɫɮʟɱɯɰŋɳɲɴøɵɸθœɶʘɹɺɾɻʀʁɽʂʃʈʧʉʊʋⱱʌɣɤʍχʎʏʑʐʒʔʡʕʢǀǁǂǃˈˌːˑʼʴʰʱʲʷˠˤ˞↓↑→↗↘'̩'ᵻ"
    );
    const tokens = tokenizer.tokenize(phenomes);

    const x = new ort.Tensor("int64", tokens, [1, tokens.length]);
    const x_length = new ort.Tensor("int64", [tokens.length]);
    const noiseScale = 0.667;
    const lengthScale = 1.0;
    const noiseScaleW = 0.8;

    const scales = new ort.Tensor(
      "float32",
      new Float32Array([noiseScale, lengthScale, noiseScaleW])
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
