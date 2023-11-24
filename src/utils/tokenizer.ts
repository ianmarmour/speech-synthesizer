type Vocabulary = { [character: string]: number };

class TextTokenizer {
  protected vocab: Vocabulary;
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

  protected createVocab(): Vocabulary {
    const vocab: Vocabulary = {};
    let index = 0;

    // Add special symbols conditionally
    [this.pad, this.eos, this.bos, this.blank].forEach((symbol) => {
      if (symbol && symbol.length > 0) vocab[symbol] = index++;
    });

    // Add characters and punctuations
    [...this.characters].concat([...this.punctuations]).forEach((char) => {
      if (!vocab.hasOwnProperty(char)) {
        vocab[char] = index++;
      }
    });

    return vocab;
  }

  public tokenize(text: string): number[] {
    // NOTE: We use the spread operator here
    // to avoid any issues with multi-point
    // unicode characters that could exist.
    return [...text].map((char) => {
      if (char in this.vocab) {
        return this.vocab[char];
      } else {
        throw new Error(`Character: ${char}, does not exist in vocabulary.`);
      }
    });
  }
}

export { TextTokenizer, Vocabulary };
