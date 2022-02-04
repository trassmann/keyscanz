import scanRepo from "./scanRepo";

export const github = (repo) => scanRepo(`https://github.com/${repo}`);
export const gitlab = (repo) => scanRepo(`https://gitlab.com/${repo}`);

export default { github, gitlab, scan: scanRepo };
