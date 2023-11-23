const replaceSymbols = (text: string, lang: string = "en"): string => {
  // Replace ';' with ','
  text = text.replace(/;/g, ",");

  // Replace '-' based on language
  if (lang !== "ca") {
    text = text.replace(/-/g, " ");
  } else {
    text = text.replace(/-/g, "");
  }

  // Replace ':' with ','
  text = text.replace(/:/g, ",");

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

const collapseWhitespace = (text: string): string => {
  const whitespaceRe = /\s+/g;

  return text.replace(whitespaceRe, " ").trim();
};

const removeAuxSymbols = (text: string): string => {
  return text.replace(/[<>()\[\]"]+/g, "");
};

const processText = (text: string) => {
  //const lowercase = text.toLowerCase();
  const nosymbols = replaceSymbols(text, "en");
  const noauxymbols = removeAuxSymbols(nosymbols);
  const noWhiteSpace = collapseWhitespace(noauxymbols);

  return noWhiteSpace;
};

export { processText };
