import wordlist from "./wordlist";

export const randomString = (): string =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

export const removeQuotes = (rawStr: string): string =>
  rawStr.slice(1, rawStr.length - 1);

const isValidWord = (word: string): boolean => wordlist.indexOf(word) !== -1;

export const validateMnemonic = (mnemonic: string): boolean => {
  const words = mnemonic?.split(" ");

  if (!words || words.length < 12 || words.length > 25) {
    return false;
  }

  return words.every(isValidWord);
};
