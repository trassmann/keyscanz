# keyscanz

Scan git repos for private keys and mnemonics.

- Needs `git` installed
- Will clone the repo to a local dir and delete it after the scan is done
- Will check the diff of the first 5000 commits, starting with the first commit
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
  const results = await keyscanz.github("trassmann/keyscanz");
  const results = await keyscanz.gitlab("trassmann/keyscanz");
  const results = await keyscanz.scan(
    "https://some-full-url.org/trassmann/keyscanz"
  );

  // Results look like this:
  // {
  //   keys: [
  //     '3cd7232cd6f3fc66a57a6bedc1a8ed6c228fff0a327e169c2bcc5e869ed49511',
  //     'e331b6d69882b4cb4ea581d88e0b604039a3de5967688d3dcffdd2270c0fd109',
  //     '0000000000000000000000000000000000000000000000000000000000000000',
  //   ],
  //   keys0x: [
  //     '0x4b6de53cdbc759a655d98b3b60dc2c5f1b1b0f82a762c869bfa1b15acf8597e6',
  //     '0x06de23a6d2ecbd78afda8c7fc42b84d07ef56de983d48b4e631291c607a71e5e',
  //     '0x1b677be476665ed6c357c9318ea4882fe25e7d5fee8dfe6ac2ed4049c34a1883',
  //   ],
  //   mnemonics: [
  //     'debris electric learn dove warrior grow pistol carry either curve radio hidden',
  //     'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat',
  //   ],
  //  }
};

runScan();
```
