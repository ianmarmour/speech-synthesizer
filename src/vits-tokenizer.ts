import { TextTokenizer, Vocabulary } from "./text-tokenizer";

class VitsTokenizer extends TextTokenizer {
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

  protected createVocab(): Vocabulary {
    const vocab: Vocabulary = {};

    // Add pad and punctuations to vocab
    [
      this.pad,
      ...this.punctuations,
      ...this.characters,
      this.blank
    ].forEach((symbol) => {
      if (symbol && !vocab.hasOwnProperty(symbol)) {
        vocab[symbol] = Object.keys(vocab).length;
      }
    });

    return vocab;
  }
}

export { VitsTokenizer }
