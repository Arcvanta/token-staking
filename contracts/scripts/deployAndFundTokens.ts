import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("\n💰 Deploying and funding mock tokens...");
  console.log("📝 Deployer:", deployer.address);
  console.log("💵 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  const targetAddress = process.env.TARGET_ADDRESS || "0x0c1ee65e59cd82c1c6ff3bc0d5e612190f45264d";
  
  // Deploy MockERC20 factory
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  
  const tokens = [
    { name: "Wrapped Ether", symbol: "WETH", decimals: 18, amount: "1000" },
    { name: "Wrapped Bitcoin", symbol: "WBTC", decimals: 8, amount: "10" },
    { name: "USD Coin", symbol: "USDC", decimals: 6, amount: "10000" }
  ];

  const deployedTokens: Record<string, string> = {};

  for (const tokenConfig of tokens) {
    console.log(`\n🪙 Deploying ${tokenConfig.symbol}...`);
    
    const token = await MockERC20.deploy(tokenConfig.name, tokenConfig.symbol, tokenConfig.decimals);
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    
    console.log(`   ✅ ${tokenConfig.symbol} deployed to: ${tokenAddress}`);
    
    // Mint tokens to target address
    const amount = ethers.parseUnits(tokenConfig.amount, tokenConfig.decimals);
    console.log(`   💸 Minting ${tokenConfig.amount} ${tokenConfig.symbol} to ${targetAddress}...`);
    
    const mintTx = await token.mint(targetAddress, amount);
    await mintTx.wait();
    
    // Verify balance
    const balance = await token.balanceOf(targetAddress);
    console.log(`   ✅ Balance: ${ethers.formatUnits(balance, tokenConfig.decimals)} ${tokenConfig.symbol}`);
    
    deployedTokens[tokenConfig.symbol] = tokenAddress;
  }

  console.log("\n\n✨ All tokens deployed and funded!");
  console.log("\n📋 Update your .env files with these addresses:");
  console.log(`SEPOLIA_WETH_TOKEN=${deployedTokens.WETH}`);
  console.log(`SEPOLIA_WBTC_TOKEN=${deployedTokens.WBTC}`);
  console.log(`SEPOLIA_USDC_TOKEN=${deployedTokens.USDC}`);
  console.log("\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
