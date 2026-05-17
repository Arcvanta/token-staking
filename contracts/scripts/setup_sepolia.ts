import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const network = "sepolia";
  const deploymentPath = path.join(__dirname, `../deployments/${network}.json`);

  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found for ${network}`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
  const routerAddress = deployment.contracts.StakingRouter;
  const adapters = deployment.contracts.Adapters;

  console.log(`Configuring StakingRouter at ${routerAddress}...`);

  const StakingRouter = await ethers.getContractFactory("StakingRouter");
  const router = StakingRouter.attach(routerAddress);

  // Helper para esperar
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Whitelist Uniswap
  console.log("Whitelisting Uniswap...");
  try {
    const tx1 = await router.setAdapter("Uniswap V3", adapters.Uniswap);
    await tx1.wait();
    console.log("✅ Uniswap whitelisted");
  } catch (e) {
    console.log("⚠️ Failed to whitelist Uniswap (might be already done):", e);
  }
  
  await wait(5000); // Esperar 5s para evitar problemas de nonce

  // Whitelist Aave
  console.log("Whitelisting Aave...");
  try {
    const tx2 = await router.setAdapter("Aave V3", adapters.Aave);
    await tx2.wait();
    console.log("✅ Aave whitelisted");
  } catch (e) {
    console.log("⚠️ Failed to whitelist Aave:", e);
  }

  await wait(5000);

  // Whitelist Lido
  console.log("Whitelisting Lido...");
  try {
    const tx3 = await router.setAdapter("Lido", adapters.Lido);
    await tx3.wait();
    console.log("✅ Lido whitelisted");
  } catch (e) {
    console.log("⚠️ Failed to whitelist Lido:", e);
  }

  console.log("🎉 Configuration complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
