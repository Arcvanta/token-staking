import { ethers } from "hardhat";

// ABI mínimo para un token ERC20 con función mint
const ERC20_MINT_ABI = [
  "function mint(address to, uint256 amount) public",
  "function balanceOf(address account) view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

async function main() {
  const [signer] = await ethers.getSigners();
  
  // Dirección a fondear
  const targetAddress = process.env.TARGET_ADDRESS || "0x0c1ee65e59cd82c1c6ff3bc0d5e612190f45264d";
  
  console.log(`\n💰 Fondeando cuenta: ${targetAddress}`);
  console.log(`📝 Usando signer: ${signer.address}\n`);

  // Tokens en Sepolia (actualizados con nuevos despliegues)
  const tokens = {
    WETH: process.env.SEPOLIA_WETH_TOKEN || "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    WBTC: process.env.SEPOLIA_WBTC_TOKEN || "0x29f2D40B0605204364af54EC677bD022dA425d03",
    USDC: process.env.SEPOLIA_USDC_TOKEN || "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8"
  };

  for (const [symbol, address] of Object.entries(tokens)) {
    try {
      console.log(`\n🪙 Procesando ${symbol} (${address})...`);
      
      const token = new ethers.Contract(address, ERC20_MINT_ABI, signer);
      
      // Obtener decimales
      const decimals = await token.decimals();
      const amount = ethers.parseUnits("1000", decimals); // 1000 tokens
      
      // Verificar balance actual
      const balanceBefore = await token.balanceOf(targetAddress);
      console.log(`   Balance actual: ${ethers.formatUnits(balanceBefore, decimals)} ${symbol}`);
      
      // Intentar mintear
      console.log(`   Minteando 1000 ${symbol}...`);
      const tx = await token.mint(targetAddress, amount);
      await tx.wait();
      
      // Verificar nuevo balance
      const balanceAfter = await token.balanceOf(targetAddress);
      console.log(`   ✅ Nuevo balance: ${ethers.formatUnits(balanceAfter, decimals)} ${symbol}`);
      
    } catch (error: any) {
      console.error(`   ❌ Error con ${symbol}: ${error.message}`);
      console.log(`   ℹ️  Este token probablemente no tiene función mint pública.`);
    }
  }

  console.log(`\n✨ Proceso completado!\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
