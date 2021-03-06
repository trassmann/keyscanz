import { promises as fs } from "fs";
import {
  Diff,
  Commit,
  ConvenientPatch,
  ConvenientHunk,
  DiffLine,
  Clone,
  Revwalk,
} from "nodegit";
import * as _ from "lodash";

import { randomString, validateMnemonic } from "./utils";

const KEY_REGEX =
  /(?<=["'])(?:\b[a-z]{3,8}\b[\s])(?:\b[a-z]{3,8}\b[\s]){10,23}(?:\b[a-z]{3,8}\b(?=["']))|(?:(0[xX])?[0-9a-fA-F]{64})|(?:\[\s*\d{1,3}\s*,\s*)(?:\d{1,3}\s*,\s*){30,62}(?:\d{1,3},*\s*\])/m;

export interface Key {
  type: KeyType;
  data: string;
}

export interface Results {
  hex: string[];
  mnemonic: string[];
  bytes: string[];
}

export enum KeyType {
  HEX = "HEX",
  MNEMONIC = "MNEMONIC",
  BYTES = "BYTES",
}

export const createKeyData = (rawData: string = ""): Key => {
  const clean = rawData.trim();

  if (clean.startsWith("[")) {
    return {
      type: KeyType.BYTES,
      data: clean,
    };
  }

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

const getHunkMatches = async (hunk: ConvenientHunk): Promise<string[]> => {
  const lines: DiffLine[] = await hunk.lines();
  return lines.reduce((matchesResults, line) => {
    const matches = KEY_REGEX.exec(line.content());
    if (!matches) {
      return matchesResults;
    }

    return [...matchesResults, matches[0]];
  }, []);
};

const getPatchMatches = async (patch: ConvenientPatch): Promise<string[]> => {
  const hunks: ConvenientHunk[] = await patch.hunks();
  const matches: string[][] = [];

  for (const hunk of hunks) {
    const hunkMatches = await getHunkMatches(hunk);
    matches.push(hunkMatches);
  }

  return matches.flat();
};

const getDiffMatches = async (diff: Diff) => {
  const patches: ConvenientPatch[] = await diff.patches();
  const matches: string[][] = [];

  for (const patch of patches) {
    if (patch.size() < 10) {
      const patchMatches = await getPatchMatches(patch);
      matches.push(patchMatches);
    }
  }

  return matches.flat();
};

const getCommitMatches = async (commit: Commit): Promise<string[]> => {
  const diffs: Diff[] = await commit.getDiff();
  const matches: string[][] = [];

  for (const diff of diffs) {
    const diffMatches = await getDiffMatches(diff);
    matches.push(diffMatches);
  }
  return matches.flat();
};

const MAX_COMMITS = 200;

const getKeys = async (
  repoUrl: string,
  dataDir: string,
  maxCommits: number = MAX_COMMITS
): Promise<string[][]> => {
  let repo;
  try {
    repo = await Clone.clone(repoUrl, dataDir, { bare: 1 });
  } catch (err) {
    console.log("Failed to clone repoUrl", err);
    return null;
  }

  const headCommit = await repo.getHeadCommit();
  const revWalk = repo.createRevWalk();

  revWalk.reset();
  revWalk.push(headCommit.id());
  revWalk.sorting(Revwalk.SORT.TIME, Revwalk.SORT.REVERSE);

  const commits = await revWalk.getCommits(maxCommits);
  const results = await Promise.all(commits.map(getCommitMatches));

  await repo.cleanup();
  return results;
};

const scanRepo = async (repoUrl: string): Promise<Results> => {
  const defaultResults: Results = {
    hex: [],
    mnemonic: [],
    bytes: [],
  };

  const dataDir: string = `./data/${randomString()}`;
  const allKeys: string[][] = await getKeys(repoUrl, dataDir);

  if (!allKeys) {
    return defaultResults;
  }

  try {
    await fs.rm(dataDir, { recursive: true });
  } catch (err) {
    console.log("Failed to delete", dataDir, err);
    return defaultResults;
  }

  return _.uniq(allKeys.flat()).reduce((keyResults, rawKey) => {
    const key: Key = createKeyData(rawKey);

    if (!key) {
      return keyResults;
    }

    if (key.type === KeyType.BYTES) {
      keyResults.bytes.push(key.data);
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
