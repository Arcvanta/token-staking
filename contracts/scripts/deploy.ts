import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy StakingRouter
  console.log("\n📦 Deploying StakingRouter...");
  const StakingRouter = await ethers.getContractFactory("StakingRouter");
  const router = await StakingRouter.deploy(deployer.address);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("✅ StakingRouter deployed to:", routerAddress);

  // Deploy Mock Adapters
  console.log("\n📦 Deploying Mock Adapters...");
  const MockAdapter = await ethers.getContractFactory("MockAdapter");

  const uniswapAdapter = await MockAdapter.deploy("Uniswap V3", "UNI-LP");
  await uniswapAdapter.waitForDeployment();
  const uniswapAddress = await uniswapAdapter.getAddress();
  console.log("✅ Uniswap Adapter deployed to:", uniswapAddress);

  const aaveAdapter = await MockAdapter.deploy("Aave V3", "aToken");
  await aaveAdapter.waitForDeployment();
  const aaveAddress = await aaveAdapter.getAddress();
  console.log("✅ Aave Adapter deployed to:", aaveAddress);

  const lidoAdapter = await MockAdapter.deploy("Lido", "stETH");
  await lidoAdapter.waitForDeployment();
  const lidoAddress = await lidoAdapter.getAddress();
  console.log("✅ Lido Adapter deployed to:", lidoAddress);

  // Whitelist Adapters
  console.log("\n🔐 Whitelisting Adapters...");
  await router.setAdapter(uniswapAddress, true);
  console.log("✅ Uniswap whitelisted");
  
  await router.setAdapter(aaveAddress, true);
  console.log("✅ Aave whitelisted");
  
  await router.setAdapter(lidoAddress, true);
  console.log("✅ Lido whitelisted");

  // Deploy Mock WBTC
  console.log("\n📦 Deploying Mock WBTC...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const wbtc = await MockERC20.deploy("Wrapped BTC", "WBTC", 8);
  await wbtc.waitForDeployment();
  const wbtcAddress = await wbtc.getAddress();
  console.log("✅ Mock WBTC deployed to:", wbtcAddress);

  // Prepare deployment info
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      StakingRouter: routerAddress,
      Adapters: {
        Uniswap: uniswapAddress,
        Aave: aaveAddress,
        Lido: lidoAddress
      },
      MockTokens: {
        WBTC: wbtcAddress
      }
    }
  };

  // Save deployment info
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const networkName = (await ethers.provider.getNetwork()).name;
  const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n✅ Deployment complete!");
  console.log("-----------------------------------");
  console.log("📄 Deployment info saved to:", deploymentFile);
  console.log("\n📋 Contract Addresses:");
  console.log(`   Router:   ${routerAddress}`);
  console.log(`   Uniswap:  ${uniswapAddress}`);
  console.log(`   Aave:     ${aaveAddress}`);
  console.log(`   Lido:     ${lidoAddress}`);
  console.log(`   WBTC:     ${wbtcAddress}`);
  console.log("\n💡 Update your .env files with these addresses!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
