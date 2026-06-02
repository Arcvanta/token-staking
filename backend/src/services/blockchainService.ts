import { ethers } from 'ethers';
import logger from '../utils/logger';

// ABIs
const STAKING_ROUTER_ABI = [
  "function stake(address token, uint256 amount, address adapter) external payable",
  "function feeBasisPoints() external view returns (uint256)",
  "function feeRecipient() external view returns (address)",
  "function supportedAdapters(address) external view returns (bool)",
  "event Staked(address indexed user, address indexed token, uint256 amount, address adapter, uint256 fee)"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private routerAddress: string;

  constructor() {
    const network = process.env.ACTIVE_NETWORK || 'sepolia';
    let rpcUrl: string | undefined;
    
    if (network === 'localhost') {
      rpcUrl = process.env.RPC_URL_LOCALHOST || 'http://127.0.0.1:8545';
    } else if (network === 'sepolia') {
      rpcUrl = process.env.RPC_URL_SEPOLIA
        || process.env.RPC_URL
        || 'https://ethereum-sepolia-rpc.publicnode.com';
    } else if (network === 'polygon') {
      rpcUrl = process.env.RPC_URL_POLYGON;
    }

    if (!rpcUrl) {
      throw new Error(`RPC_URL not configured for network: ${network}`);
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const privateKey = process.env.PRIVATE_KEY_RELAYER || process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY not configured. Set PRIVATE_KEY in .env to use server-side staking routes.');
    }

    this.wallet = new ethers.Wallet(privateKey, this.provider);
    
    // This will be set from environment or deployment file
    this.routerAddress = process.env.STAKING_ROUTER_ADDRESS || '';
    
    logger.info(`Blockchain service initialized for ${network} - Wallet: ${this.wallet.address}`, { 
      service: 'BlockchainService'
    });
  }

  /**
   * Get staking router contract instance
   */
  getRouterContract(): ethers.Contract {
    if (!this.routerAddress) {
      throw new Error('Router address not configured');
    }
    return new ethers.Contract(this.routerAddress, STAKING_ROUTER_ABI, this.wallet);
  }

  /**
   * Get ERC20 token contract instance
   */
  getTokenContract(tokenAddress: string): ethers.Contract {
    return new ethers.Contract(tokenAddress, ERC20_ABI, this.wallet);
  }

  /**
   * Check if adapter is supported
   */
  async isAdapterSupported(adapterAddress: string): Promise<boolean> {
    try {
      const router = this.getRouterContract();
      return await router.supportedAdapters(adapterAddress);
    } catch (error) {
      logger.error(`Error checking adapter: ${error}`, { service: 'BlockchainService' });
      return false;
    }
  }

  /**
   * Get current fee
   */
  async getCurrentFee(): Promise<number> {
    try {
      const router = this.getRouterContract();
      const feeBasisPoints = await router.feeBasisPoints();
      return Number(feeBasisPoints);
    } catch (error) {
      logger.error(`Error getting fee: ${error}`, { service: 'BlockchainService' });
      return 50; // default 0.5%
    }
  }

  /**
   * Check token allowance
   */
  async checkAllowance(tokenAddress: string, ownerAddress: string): Promise<bigint> {
    try {
      const token = this.getTokenContract(tokenAddress);
      return await token.allowance(ownerAddress, this.routerAddress);
    } catch (error) {
      logger.error(`Error checking allowance: ${error}`, { service: 'BlockchainService' });
      return BigInt(0);
    }
  }

  /**
   * Approve token spending
   */
  async approveToken(tokenAddress: string, amount: bigint): Promise<string> {
    try {
      const token = this.getTokenContract(tokenAddress);
      const tx = await token.approve(this.routerAddress, amount);
      await tx.wait();
      
      logger.success(`Token approved: ${tx.hash}`, { 
        service: 'BlockchainService',
        txHash: tx.hash
      });
      
      return tx.hash;
    } catch (error) {
      logger.error(`Error approving token: ${error}`, { service: 'BlockchainService' });
      throw error;
    }
  }

  /**
   * Execute stake transaction
   */
  async executeStake(
    tokenAddress: string,
    amount: bigint,
    adapterAddress: string,
    userAddress: string
  ): Promise<{ txHash: string; fee: bigint }> {
    try {
      const router = this.getRouterContract();
      
      // Check if adapter is supported
      const isSupported = await this.isAdapterSupported(adapterAddress);
      if (!isSupported) {
        throw new Error('Adapter not supported');
      }

      // Calculate fee
      const feeBasisPoints = await this.getCurrentFee();
      const fee = (amount * BigInt(feeBasisPoints)) / BigInt(10000);

      let tx;
      // ETH (native token)
      if (tokenAddress === ethers.ZeroAddress || tokenAddress.toLowerCase() === '0x0000000000000000000000000000000000000000') {
        tx = await router.stake(tokenAddress, amount, adapterAddress, {
          value: amount
        });
      } else {
        // ERC20 token - check allowance first
        const allowance = await this.checkAllowance(tokenAddress, this.wallet.address);
        if (allowance < amount) {
          logger.info('Insufficient allowance, approving...', { service: 'BlockchainService' });
          await this.approveToken(tokenAddress, amount);
        }
        
        tx = await router.stake(tokenAddress, amount, adapterAddress);
      }

      const receipt = await tx.wait();
      
      logger.success(`Stake executed: ${tx.hash} - User: ${userAddress}, Amount: ${amount.toString()}, Adapter: ${adapterAddress}`, { 
        service: 'BlockchainService',
        txHash: tx.hash
      });

      return {
        txHash: tx.hash,
        fee
      };
    } catch (error) {
      logger.error(`Error executing stake: ${error}`, { service: 'BlockchainService' });
      throw error;
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string) {
    try {
      return await this.provider.getTransactionReceipt(txHash);
    } catch (error) {
      logger.error(`Error getting receipt: ${error}`, { service: 'BlockchainService' });
      return null;
    }
  }

  /**
   * Monitor transaction status
   */
  async waitForTransaction(txHash: string, confirmations: number = 1): Promise<boolean> {
    try {
      const receipt = await this.provider.waitForTransaction(txHash, confirmations);
      return receipt?.status === 1;
    } catch (error) {
      logger.error(`Error waiting for transaction: ${error}`, { service: 'BlockchainService' });
      return false;
    }
  }
}

// Lazy singleton — avoids crashing at startup when blockchain env vars are missing.
let blockchainServiceInstance: BlockchainService | null = null;

export function getBlockchainService(): BlockchainService {
  if (!blockchainServiceInstance) {
    blockchainServiceInstance = new BlockchainService();
  }
  return blockchainServiceInstance;
}
