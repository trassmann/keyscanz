import simpleGit, { SimpleGit } from "simple-git";
import { promises as fs } from "fs";
import * as _ from "lodash";

import { randomString, removeQuotes, validateMnemonic } from "./utils";

const MNEMONIC_REGEX = /("|'|\s)(?:\b\w+\b[\s]*){12,25}("|'|\s)/gim;
const HEX_KEY_0X_REGEX = /("|'|\s)(0[xX][0-9a-fA-F]{64})("|'|\s)/gim;
const HEX_KEY_REGEX = /("|'|\s)([0-9a-fA-F]{64})("|'|\s)/gim;

const MAX_COMMITS = 5000;

interface Results {
  keys: string[];
  keys0x: string[];
  mnemonics: string[];
}

const scanRepo = async (repoUrl: string): Promise<Results> => {
  const git: SimpleGit = simpleGit({
    maxConcurrentProcesses: 10,
  });

  const dataDir = `./data/${randomString()}`;

  try {
    await git.clone(repoUrl, dataDir);
    await git.cwd(dataDir);
  } catch (err) {
    console.log("Failed to clone repo", repoUrl);
    return {
      keys: [],
      keys0x: [],
      mnemonics: [],
    };
  }

  const logData = await git.log({
    "--reverse": null,
  });
  const allCommits = logData.all || [];
  const commitsToCheck =
    allCommits.length > MAX_COMMITS
      ? _.take(allCommits, MAX_COMMITS)
      : allCommits;

  const commitHashes = commitsToCheck.map((commit) => commit.hash);
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
