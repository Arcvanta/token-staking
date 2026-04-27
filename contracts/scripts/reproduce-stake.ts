import { ethers } from "hardhat";

async function main() {
  const userAddress = "0x0C1ee65e59Cd82C1C6FF3bc0d5E612190F45264D";
  const STAKING_ROUTER = "0xe7489b54feF646bf318F043AB7E8A6a1cb456116";
  const WETH = "0x918530d86c239f92E58A98CE8ed446DC042613DB";
  const UNISWAP_ADAPTER = "0x5e01a1cBdfddA63D20d74E121B778d87A5AC0178";
  const AMOUNT = ethers.parseEther("1.0");

  console.log("🚀 Attempting to reproduce stake failure...");

  // Impersonate user (only works on local fork, but we can try to simulate steps)
  // Since we are on testnet, we can't impersonate. We will use a signer if available, 
  // or just READ the state to see if PRE-CONDITIONS are met.
  
  // 1. Check Balance
  const weth = await ethers.getContractAt("IERC20", WETH);
  const balance = await weth.balanceOf(userAddress);
  console.log(`User Balance: ${ethers.formatEther(balance)} WETH`);
  
  if (balance < AMOUNT) {
    console.error("❌ Insufficient balance!");
    return;
  }

  // 2. Check Allowance
  const allowance = await weth.allowance(userAddress, STAKING_ROUTER);
  console.log(`User Allowance: ${ethers.formatEther(allowance)} WETH`);

  if (allowance < AMOUNT) {
    console.error("❌ Insufficient allowance! (This explains the revert)");
    return;
  }

  // 3. Check Adapter Whitelist
  const router = await ethers.getContractAt("StakingRouter", STAKING_ROUTER);
  const isSupported = await router.supportedAdapters(UNISWAP_ADAPTER);
  console.log(`Adapter Supported: ${isSupported}`);

  if (!isSupported) {
    console.error("❌ Adapter not supported!");
    return;
  }

  // 4. Simulate Call (staticCall)
  // We can try to simulate the transaction locally using callStatic
  // We need a signer to impersonate. We can't do this easily on public testnet without private key.
  // BUT we can try to execute the call from OUR deployer account (if we have WETH) to see if logic holds.
  
  const [deployer] = await ethers.getSigners();
  console.log(`\nTesting with Deployer: ${deployer.address}`);
  
  // Mint WETH to deployer (it's a mock, we can mint?)
  // Check if MockERC20 has mint
  try {
    const mockWeth = await ethers.getContractAt("MockERC20", WETH);
    const txMint = await mockWeth.mint(deployer.address, AMOUNT);
    await txMint.wait();
    console.log("✅ Minted WETH to deployer");
    
    // Approve
    const txApprove = await mockWeth.approve(STAKING_ROUTER, AMOUNT);
    await txApprove.wait();
    console.log("✅ Approved Router");
    
    // Stake
    console.log("Attempting stake...");
    const txStake = await router.connect(deployer).stake(WETH, AMOUNT, UNISWAP_ADAPTER);
    console.log(`Transaction sent: ${txStake.hash}`);
    await txStake.wait();
    console.log("✅ Stake SUCCESSFUL with deployer account!");
    
  } catch (error: any) {
    console.error("❌ Stake FAILED with deployer account:");
    console.error(error.message);
    if (error.data) console.error(`Data: ${error.data}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
