# keyscanz

Scan git repos for private keys and mnemonics.

- Will clone the repo to a local dir and delete it after the scan is done
- Scans for BIP39 valid mnemonics between 12 and 25 words
- Scans for 64 character hex strings (either starting with `0x` or not)

## Installation

```js
npm install keyscanz
```

## Usage

```js
import keyscanz from "keyscanz";

const runScan = async () => {
  const ghResults = await keyscanz.github("trassmann/keyscanz");
  const glResults = await keyscanz.gitlab("trassmann/keyscanz");
  const rawResults = await keyscanz.scan(
    "https://some-raw-url.org/trassmann/keyscanz"
  );

  // Results look like this:
  // {
  //   hex: [
  //     '3cd7232cd6f3fc66a57a6bedc1a8ed6c228fff0a327e169c2bcc5e869ed49511',
  //     'e331b6d69882b4cb4ea581d88e0b604039a3de5967688d3dcffdd2270c0fd109',
  //     '0000000000000000000000000000000000000000000000000000000000000000',
  //   ],
  //   mnemonics: [
  //     'debris electric learn dove warrior grow pistol carry either curve radio hidden',
  //     'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat',
  //   ],
  //  }
};

runScan();
```
