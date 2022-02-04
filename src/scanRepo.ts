import { promises as fs } from "fs";
import * as git from "nodegit";
import * as _ from "lodash";
import asyncPool from "tiny-async-pool";

import { randomString, validateMnemonic } from "./utils";

const KEY_REGEX =
  /(?<=["'])(?:\b[a-z]{3,8}\b[\s])(?:\b[a-z]{3,8}\b[\s]){10,23}(?:\b[a-z]{3,8}\b(?=["']))|(?:(0[xX])?[0-9a-fA-F]{64})/;

export interface Key {
  type: KeyType;
  data: string;
}

export interface Results {
  hex: string[];
  mnemonic: string[];
}

export enum KeyType {
  HEX = "HEX",
  MNEMONIC = "MNEMONIC",
}

export const createKeyData = (rawData: string = ""): Key => {
  const clean = rawData.trim();

  if (clean.startsWith("0x")) {
    return {
      type: KeyType.HEX,
      data: clean.slice(2),
    };
  }

  if (clean.length === 64 && !clean.includes(" ")) {
    return {
      type: KeyType.HEX,
      data: clean,
    };
  }

  if (validateMnemonic(clean)) {
    return {
      type: KeyType.MNEMONIC,
      data: clean,
    };
  }

  return null;
};

const getMatches = async (hunk) => {
  const lines = await hunk.lines();
  return lines.reduce((matchesResults, line) => {
    const matches = KEY_REGEX.exec(line.content());
    if (!matches) {
      return matchesResults;
    }

    return [...matchesResults, matches[0]];
  }, []);
};

const getPatchLines = async (patch) => {
  const hunks = await patch.hunks();
  const lines = await Promise.all(hunks.map(getMatches));

  return lines.flat();
};

const getDiffKeys = async (diff) => {
  const patches = await diff.patches();
  const lines = await Promise.all(patches.map(getPatchLines));

  return lines.flat();
};

const getCommitKeys = async (commit) => {
  const diffList = await commit.getDiff();
  const diffKeys = await Promise.all(diffList.map(getDiffKeys));

  return diffKeys.flat();
};

const MAX_COMMITS = 5000;

const getKeys = async (repoUrl: string, dataDir: string) => {
  const repo = await git.Clone(repoUrl, dataDir, { bare: 1 });
  const headCommit = await repo.getHeadCommit();
  const revWalk = repo.createRevWalk();

  revWalk.reset();
  revWalk.push(headCommit.id());
  revWalk.sorting(git.Revwalk.SORT.TIME, git.Revwalk.SORT.REVERSE);

  const commits = await revWalk.getCommits(MAX_COMMITS);
  const results = await asyncPool(100, commits, getCommitKeys);

  return results;
};

const scanRepo = async (repoUrl: string): Promise<Results> => {
  const dataDir = `./data/${randomString()}`;
  const allKeys = await getKeys(repoUrl, dataDir);

  await fs.rm(dataDir, { recursive: true });

  const defaultResults: Results = {
    hex: [],
    mnemonic: [],
  };

  return _.uniq(allKeys.flat()).reduce((keyResults, rawKey) => {
    const key: Key = createKeyData(rawKey);

    if (!key) {
      return keyResults;
    }

    if (key.type === KeyType.HEX) {
      keyResults.hex.push(key.data);
    }

    if (key.type === KeyType.MNEMONIC) {
      keyResults.mnemonic.push(key.data);
    }

    return keyResults;
  }, defaultResults);
};

export default scanRepo;
