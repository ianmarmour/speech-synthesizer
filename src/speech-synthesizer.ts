import ort from "onnxruntime-node";
import * as fs from "fs";
import { processText } from "./text-utils.js";
import { EspeakPhonemizer } from "./phonemizer.js";
import { VitsTokenizer } from "./vits-tokenizer.js";

// This resolves a bug with WASM in nodejs.
ort.env.wasm.numThreads = 1;
ort.env.remoteModels = false;

class SpeechSynthesizer {
  private tokenizer: VitsTokenizer;
  private phenomizer: EspeakPhonemizer;
  private session: ort.InferenceSession;

  private constructor(session: ort.InferenceSession) {
    this.session = session;
    this.phenomizer = new EspeakPhonemizer("en-us");
    this.tokenizer = new VitsTokenizer(
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
      ';:,.!?¡¿—…"«»“” ',
      "_",
      "ɑɐɒæɓʙβɔɕçɗɖðʤəɘɚɛɜɝɞɟʄɡɠɢʛɦɧħɥʜɨɪʝɭɬɫɮʟɱɯɰŋɳɲɴøɵɸθœɶʘɹɺɾɻʀʁɽʂʃʈʧʉʊʋⱱʌɣɤʍχʎʏʑʐʒʔʡʕʢǀǁǂǃˈˌːˑʼʴʰʱʲʷˠˤ˞↓↑→↗↘'̩'ᵻ"
    );
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
    // Preformat text to remove random things like whitespace.
    const processedText = processText(text);

    console.log("Processed Text:" + processedText);

    // Convert text to phenomes using espeak-ng bindings.
    const phenomes = await this.phenomizer.phonemize(processedText);
    console.log("Phenomes:" + phenomes);

    // Convert phonemes to tokens using our vits tokenizer.
    const tokens = this.tokenizer.tokenize(phenomes);
    console.log("Tokens:" + tokens);

    // Add blank characters throughout our input tokens to make sure
    // the speed of our speech is correct.
    const paddedTokens = this.tokenizer.intersperseBlankChar(tokens);
    console.log("Padded Tokens:" + paddedTokens);

    const x = new ort.Tensor("int64", paddedTokens, [1, paddedTokens.length]);
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
      scales: scales,
    };

    const output = await this.session.run(input, {});

    return output.output.data;
  }
}

export { SpeechSynthesizer };
