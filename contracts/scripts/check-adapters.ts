import { ethers } from "hardhat";

async function main() {
  // Addresses from your deployment/logs
  const STAKING_ROUTER = "0xe7489b54feF646bf318F043AB7E8A6a1cb456116";
  
  // Addresses we are using in frontend/seed
  const UNISWAP_ADAPTER = "0x5e01a1cBdfddA63D20d74E121B778d87A5AC0178";
  const AAVE_ADAPTER = "0xFbe1cE67358c2333663738020F861438B7FAe929";
  const LIDO_ADAPTER = "0x1D42Ad1bdb32bEb309F184C3AA0D5BA7B8Bd3f6F";

  const ROUTER_ABI = [
    "function supportedAdapters(address adapter) view returns (bool)",
    "function owner() view returns (address)"
  ];

  console.log("🔍 Checking Adapter Status on StakingRouter...\n");
  console.log(`Router Address: ${STAKING_ROUTER}`);

  const router = await ethers.getContractAt(ROUTER_ABI, STAKING_ROUTER);

  // Check Uniswap
  const isUniswapSupported = await router.supportedAdapters(UNISWAP_ADAPTER);
  console.log(`\nUniswap Adapter (${UNISWAP_ADAPTER}):`);
  console.log(`  Supported: ${isUniswapSupported ? "✅ YES" : "❌ NO"}`);

  // Check Aave (Reference)
  const isAaveSupported = await router.supportedAdapters(AAVE_ADAPTER);
  console.log(`\nAave Adapter (${AAVE_ADAPTER}):`);
  console.log(`  Supported: ${isAaveSupported ? "✅ YES" : "❌ NO"}`);

  // Check Lido (Reference)
  const isLidoSupported = await router.supportedAdapters(LIDO_ADAPTER);
  console.log(`\nLido Adapter (${LIDO_ADAPTER}):`);
  console.log(`  Supported: ${isLidoSupported ? "✅ YES" : "❌ NO"}`);

  const owner = await router.owner();
  console.log(`\nRouter Owner: ${owner}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
