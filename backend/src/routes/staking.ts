import { Request, Response } from 'express';
import { getBlockchainService } from '../services/blockchainService';
import StakingTransaction from '../models/StakingTransaction';
import ProtocolOption from '../models/ProtocolOption';
import logger from '../utils/logger';
import { ethers } from 'ethers';

/**
 * @swagger
 * /api/stake/execute:
 *   post:
 *     summary: Ejecutar staking en blockchain
 *     description: Ejecuta una transacción de staking en la blockchain a través del StakingRouter
 *     tags: [Staking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userAddress
 *               - token
 *               - amount
 *               - optionId
 *             properties:
 *               userAddress:
 *                 type: string
 *                 description: Dirección del usuario
 *                 example: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
 *               token:
 *                 type: string
 *                 description: Token a stakear
 *                 enum: [ETH, WBTC, USDC]
 *                 example: "ETH"
 *               amount:
 *                 type: string
 *                 description: Cantidad en wei/unidades mínimas
 *                 example: "1000000000000000000"
 *               optionId:
 *                 type: string
 *                 description: ID de la opción de staking seleccionada
 *                 example: "uniswap-eth-sepolia"
 *     responses:
 *       201:
 *         description: Staking ejecutado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 txHash:
 *                   type: string
 *                   example: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
 *                 fee:
 *                   type: string
 *                   example: "5000000000000000"
 *                 transaction:
 *                   $ref: '#/components/schemas/StakingTransaction'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Opción de staking no encontrada
 *       500:
 *         description: Error ejecutando staking
 */
export const executeStake = async (req: Request, res: Response) => {
  try {
    const { userAddress, token, amount, optionId } = req.body;

    // Validaciones
    if (!userAddress || !token || !amount || !optionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Buscar la opción de staking
    const option = await ProtocolOption.findOne({ id: optionId, isActive: true });
    if (!option) {
      return res.status(404).json({ error: 'Staking option not found' });
    }

    logger.info(`Executing stake for ${userAddress} - Token: ${token}, Amount: ${amount}, Protocol: ${option.protocol}`, {
      service: 'API',
      method: 'executeStake'
    });

    // Determinar dirección del token
    let tokenAddress: string;
    if (token === 'ETH') {
      tokenAddress = ethers.ZeroAddress;
    } else {
      // Obtener dirección del token desde env
      const network = process.env.ACTIVE_NETWORK || 'sepolia';
      const envKey = `${network.toUpperCase()}_${token}_TOKEN`;
      tokenAddress = process.env[envKey] || '';
      
      if (!tokenAddress) {
        return res.status(400).json({ error: `Token address not configured for ${token}` });
      }
    }

    // Ejecutar stake en blockchain
    const result = await getBlockchainService().executeStake(
      tokenAddress,
      BigInt(amount),
      option.adapterAddress,
      userAddress
    );

    // Registrar transacción en DB
    const transaction = new StakingTransaction({
      userAddress: userAddress.toLowerCase(),
      token,
      amount,
      protocol: option.protocol,
      adapterAddress: option.adapterAddress,
      txHash: result.txHash,
      status: 'pending',
      fee: result.fee.toString(),
      network: process.env.ACTIVE_NETWORK || 'sepolia'
    });

    await transaction.save();

    logger.success(`Stake executed successfully: ${result.txHash}`, {
      service: 'API',
      method: 'executeStake',
      txHash: result.txHash
    });

    res.status(201).json({
      success: true,
      txHash: result.txHash,
      fee: result.fee.toString(),
      transaction
    });

  } catch (error: any) {
    logger.error(`Error executing stake: ${error.message}`, {
      service: 'API',
      method: 'executeStake'
    });
    res.status(500).json({ error: 'Failed to execute stake', details: error.message });
  }
};

/**
 * @swagger
 * /api/stake/quote:
 *   post:
 *     summary: Obtener cotización de staking
 *     description: Calcula el fee y retorna información sobre el staking sin ejecutarlo
 *     tags: [Staking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - amount
 *               - optionId
 *             properties:
 *               token:
 *                 type: string
 *                 example: "ETH"
 *               amount:
 *                 type: string
 *                 example: "1000000000000000000"
 *               optionId:
 *                 type: string
 *                 example: "uniswap-eth-sepolia"
 *     responses:
 *       200:
 *         description: Cotización calculada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 amount:
 *                   type: string
 *                   example: "1000000000000000000"
 *                 fee:
 *                   type: string
 *                   example: "5000000000000000"
 *                 amountAfterFee:
 *                   type: string
 *                   example: "995000000000000000"
 *                 feePercentage:
 *                   type: number
 *                   example: 0.5
 *                 protocol:
 *                   type: string
 *                   example: "Uniswap V3"
 *                 apy:
 *                   type: number
 *                   example: 5.2
 */
export const getStakeQuote = async (req: Request, res: Response) => {
  try {
    const { token, amount, optionId } = req.body;

    const option = await ProtocolOption.findOne({ id: optionId, isActive: true });
    if (!option) {
      return res.status(404).json({ error: 'Staking option not found' });
    }

    const feeBasisPoints = await getBlockchainService().getCurrentFee();
    const amountBigInt = BigInt(amount);
    const fee = (amountBigInt * BigInt(feeBasisPoints)) / BigInt(10000);
    const amountAfterFee = amountBigInt - fee;

    res.json({
      amount: amount,
      fee: fee.toString(),
      amountAfterFee: amountAfterFee.toString(),
      feePercentage: feeBasisPoints / 100,
      protocol: option.protocol,
      apy: option.apy,
      tvl: option.tvl,
      risk: option.risk
    });

  } catch (error: any) {
    logger.error(`Error getting quote: ${error.message}`, {
      service: 'API',
      method: 'getStakeQuote'
    });
    res.status(500).json({ error: 'Failed to get quote' });
  }
};
