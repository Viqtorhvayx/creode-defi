// Real market data for the P2P tab — Pyth Network (majors) + GeckoTerminal
// (Hedera/SaucerSwap DEX) for the small-caps. No mock data. Shared by the
// client components and the /api/market/* server routes (which do the actual
// upstream fetch to sidestep CORS and add caching).

export type Timeframe = '15m' | '1H' | '4H' | '1D' | '1W';

export interface Candle { time: number; open: number; high: number; low: number; close: number }

export interface PairIcon { label: string; bg: string; fg: string }

export interface MarketPair {
  id: string;            // 'HBAR-USDC'
  base: string;
  quote: string;
  source: 'pyth' | 'gecko' | 'derived';
  pythSymbol?: string;   // for source === 'pyth' (and derived numerator)
  geckoPool?: string;    // for source === 'gecko' (and derived denominator, priced in USD)
  volumePool: string;    // GeckoTerminal Hedera pool used for the real 24h volume badge
  baseIcon: PairIcon;
  quoteIcon: PairIcon;
  tradeable: boolean;
}

const USDC: PairIcon = { label: '$', bg: '#2775CA', fg: '#fff' };
const USDT: PairIcon = { label: '₮', bg: '#26A17B', fg: '#fff' };
const HBAR: PairIcon = { label: 'ℏ', bg: '#000', fg: '#fff' };
const WBTC: PairIcon = { label: '₿', bg: '#F7931A', fg: '#fff' };
const WETH: PairIcon = { label: 'Ξ', bg: '#627EEA', fg: '#fff' };
const SAUCE: PairIcon = { label: 'S', bg: '#E1274B', fg: '#fff' };
const DOVU: PairIcon = { label: 'D', bg: '#11A67A', fg: '#fff' };

// Hedera pools verified live on GeckoTerminal (real 24h volume / OHLCV).
const POOL_HBAR_USDC = '0xc5b707348da504e9be1bd4e21525459830e7b11d'; // WHBAR/USDC
const POOL_USDT_USDC = '0x017ee56b8a9098f5a9bde20075deb0c5a6906ef1'; // USDT0/USDC
const POOL_WBTC_USDC = '0x3c8dbcb8475450569091f8c311b558d62cc39cf7'; // WBTC/USDC
const POOL_WETH_USDC = '0xca10a83f75df85c2796023bb6b52473302d6f63a'; // WETH/USDC
const POOL_SAUCE_USDC = '0x36acdfe1cbf9098bdb7a3c62b8eaa1016c111e31'; // SAUCE/USDC
const POOL_DOVU_HBAR = '0x6a1ab8ed2e95c14843be797129936a7b40e39d8b'; // DOVU/WHBAR (USD-denominated)
const POOL_SAUCE_HBAR = '0x5fc19c944f1bccf5159e6ae92dc3bf2ff2576b98'; // SAUCE/WHBAR

export const PAIRS: MarketPair[] = [
  { id: 'HBAR-USDC', base: 'HBAR', quote: 'USDC', source: 'pyth', pythSymbol: 'Crypto.HBAR/USD', volumePool: POOL_HBAR_USDC, baseIcon: HBAR, quoteIcon: USDC, tradeable: true },
  { id: 'USDT-USDC', base: 'USDT', quote: 'USDC', source: 'pyth', pythSymbol: 'Crypto.USDT/USD', volumePool: POOL_USDT_USDC, baseIcon: USDT, quoteIcon: USDC, tradeable: true },
  { id: 'WBTC-USDC', base: 'WBTC', quote: 'USDC', source: 'pyth', pythSymbol: 'Crypto.WBTC/USD', volumePool: POOL_WBTC_USDC, baseIcon: WBTC, quoteIcon: USDC, tradeable: true },
  { id: 'WETH-USDC', base: 'WETH', quote: 'USDC', source: 'pyth', pythSymbol: 'Crypto.WETH/USD', volumePool: POOL_WETH_USDC, baseIcon: WETH, quoteIcon: USDC, tradeable: true },
  { id: 'SAUCE-USDC', base: 'SAUCE', quote: 'USDC', source: 'gecko', geckoPool: POOL_SAUCE_USDC, volumePool: POOL_SAUCE_USDC, baseIcon: SAUCE, quoteIcon: USDC, tradeable: true },
  { id: 'DOVU-USDC', base: 'DOVU', quote: 'USDC', source: 'gecko', geckoPool: POOL_DOVU_HBAR, volumePool: POOL_DOVU_HBAR, baseIcon: DOVU, quoteIcon: USDC, tradeable: true },
  { id: 'HBAR-SAUCE', base: 'HBAR', quote: 'SAUCE', source: 'derived', pythSymbol: 'Crypto.HBAR/USD', geckoPool: POOL_SAUCE_USDC, volumePool: POOL_SAUCE_HBAR, baseIcon: HBAR, quoteIcon: SAUCE, tradeable: true },
];

export const getPair = (id: string): MarketPair => PAIRS.find((p) => p.id === id) || PAIRS[0];

// Pyth Hermes price-feed ids (verified against https://hermes.pyth.network/v2/price_feeds)
// for the "majors" pairs, keyed by the same pythSymbol string already on each
// pair. Used to open a live price stream instead of polling for a snapshot.
export const PYTH_FEED_IDS: Record<string, string> = {
  'Crypto.HBAR/USD': '3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd',
  'Crypto.USDT/USD': '2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
  'Crypto.WBTC/USD': 'c9d8b075a5c69303365ae23633d4e085199bf5c520a3b90fed1322a0342ffc33',
  'Crypto.WETH/USD': '9d4294bbcd1174d6f2003ec365831e64cc31d9f6f15a2b85399db8d5000960f6',
};

// Vault tab's "Market" chart — a fast, multi-pair price watch (display only,
// not tied to what's depositable in the Vault). Every feed id below was
// verified live against https://hermes.pyth.network/v2/price_feeds. CoinGecko
// ids drive the market-cap/rank/volume footer stats (best-effort — if a
// CoinGecko call fails, those stats just fall back to blanks, same tolerance
// pattern already used for token logos elsewhere in the app).
export interface VaultWatchToken { sym: string; name: string; pythFeedId: string; coingeckoId: string }
export const VAULT_WATCH_TOKENS: VaultWatchToken[] = [
  { sym: 'HBAR', name: 'Hedera', pythFeedId: '3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd', coingeckoId: 'hedera-hashgraph' },
  { sym: 'BTC', name: 'Bitcoin', pythFeedId: 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43', coingeckoId: 'bitcoin' },
  { sym: 'ETH', name: 'Ethereum', pythFeedId: 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace', coingeckoId: 'ethereum' },
  { sym: 'SOL', name: 'Solana', pythFeedId: 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d', coingeckoId: 'solana' },
  { sym: 'HYPE', name: 'Hyperliquid', pythFeedId: '4279e31cc369bbcc2faf022b382b080e32a8e689ff20fbc530d2a603eb6cd98b', coingeckoId: 'hyperliquid' },
  { sym: 'XRP', name: 'XRP', pythFeedId: 'ec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8', coingeckoId: 'ripple' },
  { sym: 'BNB', name: 'BNB', pythFeedId: '2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f', coingeckoId: 'binancecoin' },
  { sym: 'DOGE', name: 'Dogecoin', pythFeedId: 'dcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c', coingeckoId: 'dogecoin' },
  { sym: 'SUI', name: 'Sui', pythFeedId: '23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744', coingeckoId: 'sui' },
  { sym: 'AVAX', name: 'Avalanche', pythFeedId: '93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7', coingeckoId: 'avalanche-2' },
  { sym: 'LINK', name: 'Chainlink', pythFeedId: '8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221', coingeckoId: 'chainlink' },
  { sym: 'AAVE', name: 'Aave', pythFeedId: '2b9ab1e972a281585084148ba1389800799bd4be63b957507db1349314e47445', coingeckoId: 'aave' },
  { sym: 'TON', name: 'Toncoin', pythFeedId: '8963217838ab4cf5cadc172203c1f0b763fbaa45f346d8ee50ba994bbcac3026', coingeckoId: 'the-open-network' },
  { sym: 'NEAR', name: 'NEAR Protocol', pythFeedId: 'c415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750', coingeckoId: 'near' },
  { sym: 'TAO', name: 'Bittensor', pythFeedId: '410f41de235f2db824e562ea7ab2d3d3d4ff048316c61d629c0b93f58584e1af', coingeckoId: 'bittensor' },
  { sym: 'ZEC', name: 'Zcash', pythFeedId: 'be9b59d178f0d6a97ab4c343bff2aa69caa1eaae3e9048a65788c529b125bb24', coingeckoId: 'zcash' },
  { sym: 'PENGU', name: 'Pudgy Penguins', pythFeedId: 'bed3097008b9b5e3c93bec20be79cb43986b85a996475589351a21e67bae9b61', coingeckoId: 'pudgy-penguins' },
  { sym: 'PEPE', name: 'Pepe', pythFeedId: 'd69731a2e74ac1ce884fc3890f7ee324b6deb66147055249568869ed700882e4', coingeckoId: 'pepe' },
  { sym: 'ASTER', name: 'Aster', pythFeedId: 'a903b5a82cb572397e3d47595d2889cf80513f5b4cf7a36b513ae10cc8b1e338', coingeckoId: 'aster-2' },
  { sym: 'WLFI', name: 'World Liberty Financial', pythFeedId: 'd41369178d64f41d51ca95465c144a2c74d2fff30be69164835911943fa64c3e', coingeckoId: 'world-liberty-financial' },
  { sym: 'FARTCOIN', name: 'Fartcoin', pythFeedId: '58cd29ef0e714c5affc44f269b2c1899a52da4169d7acc147b9da692e6953608', coingeckoId: 'fartcoin' },
  // Expansion below: every Hotstuff/Hyperliquid-listed token not already
  // above that has BOTH a live Binance USDT pair (for this relay's direct
  // feed) AND a stable, active Pyth feed (cross-checked against
  // hermes_id/state, not just a name match — several otherwise-matching
  // tickers turned out to be Pyth's own inactive/deprecated listings and
  // were excluded). CoinGecko ids below are each a unique ticker match;
  // ambiguous tickers (multiple unrelated coins sharing a symbol) were
  // deliberately left out rather than guessed.
  { sym: 'ATOM', name: 'Cosmos Hub', pythFeedId: 'b00b60f88b03a6a625a8d1c048c3f66653edf217439983d037e7222c4e612819', coingeckoId: 'cosmos' },
  { sym: 'INJ', name: 'Injective', pythFeedId: '7a5bc1d2b56ad029048cd63964b3ad2776eadf812edc1a43a31406cb54bff592', coingeckoId: 'injective-protocol' },
  { sym: 'STX', name: 'Stacks', pythFeedId: 'ec7a775f46379b5e943c3526b1c8d54cd49749176b0b98e02dde68d1bd335c17', coingeckoId: 'blockstack' },
  { sym: 'GMX', name: 'GMX', pythFeedId: 'b962539d0fcb272a494d65ea56f94851c2bcf8823935da05bd628916e2e9edbf', coingeckoId: 'gmx' },
  { sym: 'SNX', name: 'Synthetix', pythFeedId: '39d020f60982ed892abbcd4a06a276a9f9b7bfbce003204c110b6e488f502da3', coingeckoId: 'havven' },
  { sym: 'APT', name: 'Aptos', pythFeedId: '03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5', coingeckoId: 'aptos' },
  { sym: 'COMP', name: 'Compound', pythFeedId: '4a8e42861cabc5ecb50996f92e7cfa2bce3fd0a2423b0c44c9b423fb2bd25478', coingeckoId: 'compound-governance-token' },
  { sym: 'WLD', name: 'Worldcoin', pythFeedId: 'd6835ad1f773de4a378115eb6824bd0c0e42d84d1c84d9750e853fb6b6c7794a', coingeckoId: 'worldcoin-wld' },
  { sym: 'ZRO', name: 'LayerZero', pythFeedId: '3bd860bea28bf982fa06bcf358118064bb114086cc03993bd76197eaab0b8018', coingeckoId: 'layerzero' },
  { sym: 'FTT', name: 'FTX', pythFeedId: '6c75e52531ec5fd3ef253f6062956a8508a2f03fa0a209fb7fbc51efd9d35f88', coingeckoId: 'ftx-token' },
  { sym: 'BLUR', name: 'Blur', pythFeedId: '856aac602516addee497edf6f50d39e8c95ae5fb0da1ed434a8c2ab9c3e877e9', coingeckoId: 'blur' },
  { sym: 'MINA', name: 'Mina Protocol', pythFeedId: 'e322f437708e16b033d785fceb5c7d61c94700364281a10fabc77ca20ef64bf1', coingeckoId: 'mina-protocol' },
  { sym: 'PENDLE', name: 'Pendle', pythFeedId: '9a4df90b25497f66b1afb012467e316e801ca3d839456db028892fe8c70c8016', coingeckoId: 'pendle' },
  { sym: 'FET', name: 'Artificial Superintelligence Alliance', pythFeedId: '7da003ada32eabbac855af3d22fcf0fe692cc589f0cfd5ced63cf0bdcc742efe', coingeckoId: 'fetch-ai' },
  { sym: 'ORDI', name: 'ORDI', pythFeedId: '193c739db502aadcef37c2589738b1e37bdb257d58cf1ab3c7ebc8e6df4e3ec0', coingeckoId: 'ordinals' },
  { sym: 'PYTH', name: 'Pyth Network', pythFeedId: '0bbf28e9a841a1cc788f6a361b17ca072d0ea3098a1e5df1c3922d06719579ff', coingeckoId: 'pyth-network' },
  { sym: 'SUSHI', name: 'Sushi', pythFeedId: '26e4f737fde0263a9eea10ae63ac36dcedab2aaf629261a994e1eeb6ee0afe53', coingeckoId: 'sushi' },
  { sym: 'ILV', name: 'Illuvium', pythFeedId: 'e1cb28de6139b40cf03e15f42a89921c0650fb1c75cabfc94877830c28de30cb', coingeckoId: 'illuvium' },
  { sym: 'IMX', name: 'Immutable', pythFeedId: '941320a8989414874de5aa2fc340a75d5ed91fdff1613dd55f83844d52ea63a2', coingeckoId: 'immutable-x' },
  { sym: 'GMT', name: 'GMT', pythFeedId: 'baa284eaf23edf975b371ba2818772f93dbae72836bbdea28b07d40f3cf8b485', coingeckoId: 'stepn' },
  { sym: 'RSR', name: 'Reserve Rights', pythFeedId: 'fb7565b77267ba3f6ef770bed5d7f9b22b8542db676dbd9b934a2fcf945f4371', coingeckoId: 'reserve-rights-token' },
  { sym: 'GALA', name: 'GALA', pythFeedId: '0781209c28fda797616212b7f94d77af3a01f3e94a5d421760aef020cf2bcb51', coingeckoId: 'gala' },
  { sym: 'JTO', name: 'Jito', pythFeedId: 'b43660a5f790c69354b0729a5ef9d50d68f1df92107540210b9cccba1f947cc2', coingeckoId: 'jito-governance-token' },
  { sym: 'CAKE', name: 'PancakeSwap', pythFeedId: '2356af9529a1064d41e32d617e2ce1dca5733afa901daba9e2b68dee5d53ecf9', coingeckoId: 'pancakeswap-token' },
  { sym: 'ENS', name: 'Ethereum Name Service', pythFeedId: 'b98ab6023650bd2edc026b983fb7c2f8fa1020286f1ba6ecf3f4322cd83b72a6', coingeckoId: 'ethereum-name-service' },
  { sym: 'ETC', name: 'Ethereum Classic', pythFeedId: '7f5cc8d963fc5b3d2ae41fe5685ada89fd4f14b435f8050f28c7fd409f40c2d8', coingeckoId: 'ethereum-classic' },
  { sym: 'MANTA', name: 'Manta Network', pythFeedId: 'c3883bcf1101c111e9fcfe2465703c47f2b638e21fef2cce0502e6c8f416e0e2', coingeckoId: 'manta-network' },
  { sym: 'ONDO', name: 'Ondo', pythFeedId: 'd40472610abe56d36d065a0cf889fc8f1dd9f3b7f2a478231a5fc6df07ea5ce3', coingeckoId: 'ondo-finance' },
  { sym: 'DYM', name: 'Dymension', pythFeedId: 'a9f3b2a89c6f85a6c20a9518abde39b944e839ca49a0c92307c65974d3f14a57', coingeckoId: 'dymension' },
  { sym: 'AR', name: 'Arweave', pythFeedId: 'f610eae82767039ffc95eef8feaeddb7bbac0673cfe7773b2fde24fd1adb0aee', coingeckoId: 'arweave' },
  { sym: 'BOME', name: 'BOOK OF MEME', pythFeedId: '30e4780570973e438fdb3f1b7ad22618b2fc7333b65c7853a7ca144c39052f7a', coingeckoId: 'book-of-meme' },
  { sym: 'ETHFI', name: 'Ether.fi', pythFeedId: 'b27578a9654246cb0a2950842b92330e9ace141c52b63829cc72d5c45a5a595a', coingeckoId: 'ether-fi' },
  { sym: 'ENA', name: 'Ethena', pythFeedId: 'b7910ba7322db020416fcac28b48c01212fd9cc8fbcbaf7d30477ed8605f6bd4', coingeckoId: 'ethena' },
  { sym: 'TNSR', name: 'Tensor', pythFeedId: '05ecd4597cd48fe13d6cc3596c62af4f9675aee06e2e0b94c06d8bee2b659e05', coingeckoId: 'tensor' },
  { sym: 'EIGEN', name: 'EigenCloud (prev. EigenLayer)', pythFeedId: 'c65db025687356496e8653d0d6608eec64ce2d96e2e28c530e574f0e4f712380', coingeckoId: 'eigenlayer' },
  { sym: 'REZ', name: 'Renzo', pythFeedId: '9df307038f76e26ba0f9aaa1d5eefce919bf5b7b282d0ad247d4f77ffb506ede', coingeckoId: 'renzo' },
  { sym: 'IO', name: 'io.net', pythFeedId: '82595d1509b770fa52681e260af4dda9752b87316d7c048535d8ead3fa856eb1', coingeckoId: 'io' },
  { sym: 'ZK', name: 'ZKsync', pythFeedId: 'cc03dc09298fb447e0bf9afdb760d5b24340fd2167fd33d8967dd8f9a141a2e8', coingeckoId: 'zksync' },
  { sym: 'RENDER', name: 'Render', pythFeedId: '3d4a2bd9535be6ce8059d75eadeba507b043257321aa544717c56fa19b49e35d', coingeckoId: 'render-token' },
  { sym: 'CELO', name: 'Celo', pythFeedId: '7d669ddcdd23d9ef1fa9a9cc022ba055ec900e91c4cb960f3c20429d4447a411', coingeckoId: 'celo' },
  { sym: 'XLM', name: 'Stellar', pythFeedId: 'b7a8eba68a997cd0210c2e1e4ee811ad2d174b3611c22d9ebf16f4cb7e9ba850', coingeckoId: 'stellar' },
  { sym: 'IOTA', name: 'IOTA', pythFeedId: 'c7b72e5d860034288c9335d4d325da4272fe50c92ab72249d58f6cbba30e4c44', coingeckoId: 'iota' },
  { sym: 'VIRTUAL', name: 'Virtuals Protocol', pythFeedId: '8132e3eb1dac3e56939a16ff83848d194345f6688bff97eb1c8bd462d558802b', coingeckoId: 'virtual-protocol' },
  { sym: 'USUAL', name: 'Usual', pythFeedId: '226ae20a70afb9d55a5724e1569a6da7a6e65fdb7eb56924ef1262e05a28b505', coingeckoId: 'usual' },
  { sym: 'AIXBT', name: 'aixbt', pythFeedId: '0fc54579a29ba60a08fdb5c28348f22fd3bec18e221dd6b90369950db638a5a7', coingeckoId: 'aixbt' },
  { sym: 'BERA', name: 'Berachain', pythFeedId: '962088abcfdbdb6e30db2e340c8cf887d9efb311b1f2f17b155a63dbb6d40265', coingeckoId: 'berachain-bera' },
  { sym: 'KAITO', name: 'KAITO', pythFeedId: '7302dee641a08507c297a7b0c8b3efa74a48a3baa6c040acab1e5209692b7e59', coingeckoId: 'kaito' },
  { sym: 'PAXG', name: 'PAX Gold', pythFeedId: '273717b49430906f4b0c230e99aa1007f83758e3199edbc887c0d06c3e332494', coingeckoId: 'pax-gold' },
  { sym: 'WCT', name: 'WalletConnect Token', pythFeedId: '10948bcc05eb7ca7f9254f5ac8f2b7171edfc3868b4fd6f0b330255f26d58920', coingeckoId: 'connect-token-wct' },
  { sym: 'RESOLV', name: 'Resolv', pythFeedId: '7c2c964893278a585eef902f1d90c458666daf6dd0533e823f9fffedcec5ab5a', coingeckoId: 'resolv' },
  { sym: 'SYRUP', name: 'Maple Finance', pythFeedId: 'ed86e0c6321d790302e5d88751995ebc9079273e549005d68a83ba72e48ff1ce', coingeckoId: 'syrup' },
  { sym: 'LINEA', name: 'Linea', pythFeedId: '49e50653755fbf8018ab65a07be2f208ac8c4bdfc43200934304ca17ee663cab', coingeckoId: 'linea' },
  { sym: 'AVNT', name: 'Avantis', pythFeedId: 'c4aa2587b3d35cd526b8e7827f78399d16c7861f719331869c07e5fa499606d0', coingeckoId: 'avantis' },
  { sym: '0G', name: '0G', pythFeedId: 'fa9e8d4591613476ad0961732475dc08969d248faca270cc6c47efe009ea3070', coingeckoId: 'zero-gravity' },
  { sym: '2Z', name: 'DoubleZero', pythFeedId: 'f2b3ab1c49e35e881003c3c0482d18b181a1560b697b844c24c8f85aba1cab95', coingeckoId: 'doublezero' },
  { sym: 'ICP', name: 'Internet Computer', pythFeedId: 'c9907d786c5821547777780a1e4f89484f3417cb14dd244f2b0a34ea7a554d67', coingeckoId: 'internet-computer' },
  { sym: 'AERO', name: 'Aerodrome Finance', pythFeedId: '9db37f4d5654aad3e37e2e14ffd8d53265fb3026d1d8f91146539eebaa2ef45f', coingeckoId: 'aerodrome-finance' },
  { sym: 'FOGO', name: 'Fogo', pythFeedId: '245f89fb8084840bd098d661a026032ee21062270003426797c9196d2d8d4e43', coingeckoId: 'fogo' },
  { sym: 'AXS', name: 'Axie Infinity', pythFeedId: 'b7e3904c08ddd9c0c10c6d207d390fd19e87eb6aab96304f571ed94caebdefa0', coingeckoId: 'axie-infinity' },
];

// Timeframe → upstream resolution. secs = candle width in seconds.
export const RESOLUTIONS: Record<Timeframe, { pyth: string; geckoTf: 'minute' | 'hour' | 'day'; geckoAgg: number; secs: number }> = {
  '15m': { pyth: '15', geckoTf: 'minute', geckoAgg: 15, secs: 900 },
  '1H': { pyth: '60', geckoTf: 'hour', geckoAgg: 1, secs: 3600 },
  '4H': { pyth: '240', geckoTf: 'hour', geckoAgg: 4, secs: 14400 },
  '1D': { pyth: '1D', geckoTf: 'day', geckoAgg: 1, secs: 86400 },
  '1W': { pyth: '1W', geckoTf: 'day', geckoAgg: 1, secs: 604800 },
};

// ── Display helpers ──────────────────────────────────────────────────────
export const formatVolume = (v: number): string => {
  if (!v || v <= 0) return '$0';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}k`;
  return `$${v.toFixed(0)}`;
};

// Sensible price precision for both $60k and $0.0012 assets.
export const formatPrice = (v: number): string => {
  if (!v || v <= 0) return '0';
  if (v >= 1000) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (v >= 1) return v.toLocaleString(undefined, { maximumFractionDigits: 4 });
  if (v >= 0.01) return v.toLocaleString(undefined, { maximumFractionDigits: 5 });
  return v.toLocaleString(undefined, { maximumFractionDigits: 7 });
};

// ── Client fetchers (call our own API routes) ──────────────────────────────
export async function fetchCandles(pairId: string, tf: Timeframe): Promise<Candle[]> {
  const res = await fetch(`/api/market/candles?pair=${encodeURIComponent(pairId)}&tf=${tf}`);
  if (!res.ok) throw new Error(`candles ${res.status}`);
  const data = await res.json();
  return data.candles as Candle[];
}

export interface PairStat { volume24h: number; change24h: number; price: number }

export async function fetchPairStats(): Promise<Record<string, PairStat>> {
  const res = await fetch('/api/market/stats');
  if (!res.ok) throw new Error(`stats ${res.status}`);
  return (await res.json()).stats as Record<string, PairStat>;
}
