import simpleGit, { SimpleGit } from "simple-git";
import { promises as fs } from "fs";
import * as _ from "lodash";

import { randomString, removeQuotes, validateMnemonic } from "./utils";

const MNEMONIC_REGEX = /("|')(?:\b\w+\b[\s]*){12,25}("|')/gim;
const HEX_KEY_0X_REGEX = /("|')(0[xX][0-9a-fA-F]{64})("|')/gim;
const HEX_KEY_REGEX = /("|')([0-9a-fA-F]{64})("|')/gim;

const scanRepo = async (repoUrl: string) => {
  const git: SimpleGit = simpleGit({
    maxConcurrentProcesses: 10,
  });

  const dataDir = `./data/${randomString()}`;
  await git.clone(repoUrl, dataDir);
  await git.cwd(dataDir);

  const logDataAsc = await git.log({
    maxCount: 1000,
    "--reverse": null,
  });
  const logDataDesc = await git.log({
    maxCount: 1000,
  });

  const commitHashes = _.uniq(
    [...logDataAsc.all, ...logDataDesc.all].map((commit) => commit.hash)
  );
  const commitScans = commitHashes.map(async (commitHash) => {
    try {
      const data = await git.show(commitHash);

      const key0xMatches = data.match(HEX_KEY_0X_REGEX);
      const keyMatches = data.match(HEX_KEY_REGEX);
      const mnemonicMatches = data.match(MNEMONIC_REGEX);

      return {
        keys: keyMatches?.map(removeQuotes) || [],
        keys0x: key0xMatches?.map(removeQuotes) || [],
        mnemonics:
          mnemonicMatches?.map(removeQuotes)?.filter(validateMnemonic) || [],
      };
    } catch (err) {
      return [];
    }
  });

  const allCommitMatches = await Promise.all(commitScans);

  const defaultResults = {
    keys: [],
    keys0x: [],
    mnemonics: [],
  };
  const resultsMerger = (objValue, srcValue) =>
    _.uniq([...objValue, ...srcValue]);
  const results = allCommitMatches.reduce(
    (keysResult, keysObj) => _.mergeWith(keysResult, keysObj, resultsMerger),
    defaultResults
  );

  await fs.rm(dataDir, { recursive: true });

  return results;
};

export default scanRepo;
