import { ethers } from "hardhat";

async function main() {
  const userAddress = "0x0C1ee65e59Cd82C1C6FF3bc0d5E612190F45264D";
  
  // Addresses
  const STAKING_ROUTER = "0xe7489b54feF646bf318F043AB7E8A6a1cb456116";
  const WETH = "0x918530d86c239f92E58A98CE8ed446DC042613DB";
  const WBTC = "0xA32ecf29Ed19102A639cd1a9706079d055f3CF2B";
  const UNISWAP_ADAPTER = "0x5e01a1cBdfddA63D20d74E121B778d87A5AC0178";

  // ABIs
  const ERC20_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];

  const ROUTER_ABI = [
    "function supportedAdapters(address adapter) view returns (bool)"
  ];

  console.log("🔍 Checking user state...\n");

  // Check WETH
  const weth = await ethers.getContractAt(ERC20_ABI, WETH);
  const wethBalance = await weth.balanceOf(userAddress);
  const wethAllowance = await weth.allowance(userAddress, STAKING_ROUTER);
  const wethDecimals = await weth.decimals();
  
  console.log("WETH:");
  console.log(`  Balance: ${ethers.formatUnits(wethBalance, wethDecimals)}`);
  console.log(`  Allowance to Router: ${ethers.formatUnits(wethAllowance, wethDecimals)}`);

  // Check WBTC
  const wbtc = await ethers.getContractAt(ERC20_ABI, WBTC);
  const wbtcBalance = await wbtc.balanceOf(userAddress);
  const wbtcAllowance = await wbtc.allowance(userAddress, STAKING_ROUTER);
  const wbtcDecimals = await wbtc.decimals();
  
  console.log("\nWBTC:");
  console.log(`  Balance: ${ethers.formatUnits(wbtcBalance, wbtcDecimals)}`);
  console.log(`  Allowance to Router: ${ethers.formatUnits(wbtcAllowance, wbtcDecimals)}`);

  // Check if adapter is whitelisted
  const router = await ethers.getContractAt(ROUTER_ABI, STAKING_ROUTER);
  const isWhitelisted = await router.supportedAdapters(UNISWAP_ADAPTER);
  
  console.log("\nUniswap Adapter:");
  console.log(`  Whitelisted: ${isWhitelisted}`);
  console.log(`  Address: ${UNISWAP_ADAPTER}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
