import * as _ from "lodash";
import { wordlists as bip39wordlists } from "bip39";

import englishAlgo from "./english_algo";

export default _.uniq([...englishAlgo, ...bip39wordlists.english]);
