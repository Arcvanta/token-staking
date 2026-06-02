import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production' && !process.env.RAILWAY_ENVIRONMENT) {
  dotenv.config();
}

const DEV_DEFAULTS: Record<string, string> = {
  PORT: '4001',
  ACTIVE_NETWORK: 'sepolia',
  MONGO_URI: 'mongodb://127.0.0.1:27017/poc-stake',
  REDIS_URL: 'redis://127.0.0.1:6379',
  RPC_URL: 'https://ethereum-sepolia-rpc.publicnode.com',
  STAKING_ROUTER_ADDRESS: '0xe7489b54feF646bf318F043AB7E8A6a1cb456116',
  ADAPTER_UNISWAP: '0x5e01a1cBdfddA63D20d74E121B778d87A5AC0178',
  ADAPTER_AAVE: '0xFbe1cE67358c2333663738020F861438B7FAe929',
  ADAPTER_LIDO: '0x1D42Ad1bdb32bEb309F184C3AA0D5BA7B8Bd3f6F',
  SEPOLIA_WETH_TOKEN: '0x918530d86c239f92E58A98CE8ed446DC042613DB',
  SEPOLIA_WBTC_TOKEN: '0xA32ecf29Ed19102A639cd1a9706079d055f3CF2B',
  SEPOLIA_USDC_TOKEN: '0xaDD1Fbe72192A8328AeD0EA6E1f729fde11Fd8Ad',
};

const PLACEHOLDER_PATTERNS = [
  /username:password@/i,
  /password@host:port/i,
  /your-private-key/i,
  /your-redis-password/i,
  /your-relayer-private-key/i,
  /your-project-id/i,
  /your_etherscan_key/i,
  /database-name/i,
];

function isUnset(value: string | undefined): boolean {
  if (!value || !value.trim()) return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

for (const [key, value] of Object.entries(DEV_DEFAULTS)) {
  if (isUnset(process.env[key])) {
    process.env[key] = value;
  }
}

export function env(key: string, fallback = ''): string {
  return process.env[key] || fallback;
}
