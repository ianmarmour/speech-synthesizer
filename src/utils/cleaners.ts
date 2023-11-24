/**
 * Replaces any symbols that shouldn't remain in the text with their
 * language specific representations.
 *
 * @param text - Input text to process.
 * @param lang - The language you want to replace symbols for.
 * @returns - Text.
 */
const replaceSymbols = (text: string, lang: string = "en"): string => {
  text = text.replace(/;/g, ",");
  text = text.replace(/:/g, ",");

  // Replace '-' based on language
  if (lang !== "ca") {
    text = text.replace(/-/g, " ");
  } else {
    text = text.replace(/-/g, "");
  }

  // Replace '&' based on language
  switch (lang) {
    case "en":
      text = text.replace(/&/g, " and ");
      break;
    case "fr":
      text = text.replace(/&/g, " et ");
      break;
    case "pt":
      text = text.replace(/&/g, " e ");
      break;
    case "ca":
      text = text.replace(/&/g, " i ");
      text = text.replace(/'/g, "");
      break;
  }

  return text;
};

/**
 * Removes multi character whitespace from text and trims
 * leading and trailing white space.
 *
 * @param text - Input text to process.
 * @returns - Text
 */
const collapseWhitespace = (text: string): string => {
  return text.replace(/\s+/g, " ").trim();
};

/**
 * Removes symbols that don't typically have a textual
 * representation or are considered auxilery to the real
 * contents of text.
 *
 * @param text - Input text to process.
 * @returns - Text
 */
const removeAuxSymbols = (text: string): string => {
  return text.replace(/[<>()\[\]"]+/g, "");
};

/**
 * Processes input text through a cleaning pipline to ensure
 * that it's ready to be converted to phonemes by common phonemizers.
 *
 * @remarks - This method assumes that the input language is english.
 * @param text - Input text to process and make ready for a TTS system.
 * @returns - Text.
 */
const phonemeCleaner = (text: string) => {
  // TODO: Implement missing number normalization: https://github.com/ianmarmour/speech-synthesizer/issues/1
  // TODO: Implement missing abbreviation expansion: https://github.com/ianmarmour/speech-synthesizer/issues/2
  text = replaceSymbols(text);
  text = removeAuxSymbols(text);
  text = collapseWhitespace(text);

  return text;
};

export { phonemeCleaner };
