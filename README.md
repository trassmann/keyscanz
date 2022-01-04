# keyscan

Scan git repos for private keys and mnemonics.

- Needs `git` installed
- Will clone the repo to a local dir and delete it after the scan is done

## Installation

```js
npm install keyscan
```

## Usage

```js
import keyscan from "keyscan";

const runScan = async () => {
  const results = await keyscan.github("trassmann/keyscan");

  // Results look like this:
  // {
  //   keys: [],
  //   keys0x: [],
  //   mnemonics: [],
  //  }
};

runScan();
```

## General

- Scans for BIP39 valid mnemonics between 12 and 25 words
- Scans for 64 character hex strings (either starting with `0x` or not)
