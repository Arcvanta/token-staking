import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log('Whitelisting adapters with account:', deployer.address);
  console.log('Account balance:', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'ETH');

  // Addresses from deployment
  const STAKING_ROUTER_ADDRESS = '0xe7489b54feF646bf318F043AB7E8A6a1cb456116';
  const UNISWAP_ADAPTER = '0x5e01a1cBdfddA63D20d74E121B778d87A5AC0178';
  const AAVE_ADAPTER = '0xFbe1cE67358c2333663738020F861438B7FAe929';
  const LIDO_ADAPTER = '0x1D42Ad1bdb32bEb309F184C3AA0D5BA7B8Bd3f6F';

  const stakingRouter = await ethers.getContractAt('StakingRouter', STAKING_ROUTER_ADDRESS);

  console.log('\n🔐 Whitelisting Adapters...');

  try {
    // Whitelist Uniswap
    console.log('Whitelisting Uniswap adapter...');
    const tx1 = await stakingRouter.setAdapter(UNISWAP_ADAPTER, true, {
      gasLimit: 100000,
    });
    await tx1.wait();
    console.log('✅ Uniswap whitelisted');

    // Wait a bit to avoid nonce issues
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Whitelist Aave
    console.log('Whitelisting Aave adapter...');
    const tx2 = await stakingRouter.setAdapter(AAVE_ADAPTER, true, {
      gasLimit: 100000,
    });
    await tx2.wait();
    console.log('✅ Aave whitelisted');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Whitelist Lido
    console.log('Whitelisting Lido adapter...');
    const tx3 = await stakingRouter.setAdapter(LIDO_ADAPTER, true, {
      gasLimit: 100000,
    });
    await tx3.wait();
    console.log('✅ Lido whitelisted');

    console.log('\n✅ All adapters whitelisted successfully!');

    // Verify
    console.log('\n🔍 Verifying whitelist status...');
    const isUniswapWhitelisted = await stakingRouter.whitelistedAdapters(UNISWAP_ADAPTER);
    const isAaveWhitelisted = await stakingRouter.whitelistedAdapters(AAVE_ADAPTER);
    const isLidoWhitelisted = await stakingRouter.whitelistedAdapters(LIDO_ADAPTER);

    console.log('Uniswap whitelisted:', isUniswapWhitelisted);
    console.log('Aave whitelisted:', isAaveWhitelisted);
    console.log('Lido whitelisted:', isLidoWhitelisted);

  } catch (error: any) {
    console.error('Error whitelisting adapters:', error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
