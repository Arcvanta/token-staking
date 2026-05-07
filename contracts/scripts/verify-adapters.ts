import { ethers } from 'hardhat';

async function main() {
  const STAKING_ROUTER_ADDRESS = '0xd965b8FA53a1b33B19079b9e998F4A928354B826';
  const UNISWAP_ADAPTER = '0xC53d3B458D3393dA5989285905337E94fd1f9b60';
  const AAVE_ADAPTER = '0x6b1A165252ADD50d3a833C628Edd36Eab0325f8e';
  const LIDO_ADAPTER = '0xa3a7f23aa87a50b3F02F0d1d6950e07c4bA50DF6';

  const stakingRouter = await ethers.getContractAt('StakingRouter', STAKING_ROUTER_ADDRESS);

  console.log('\n🔍 Verifying whitelist status...');
  
  // Use supportedAdapters instead of whitelistedAdapters
  const isUniswapWhitelisted = await stakingRouter.supportedAdapters(UNISWAP_ADAPTER);
  const isAaveWhitelisted = await stakingRouter.supportedAdapters(AAVE_ADAPTER);
  const isLidoWhitelisted = await stakingRouter.supportedAdapters(LIDO_ADAPTER);

  console.log('Uniswap whitelisted:', isUniswapWhitelisted);
  console.log('Aave whitelisted:', isAaveWhitelisted);
  console.log('Lido whitelisted:', isLidoWhitelisted);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
