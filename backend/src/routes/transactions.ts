import { Request, Response } from 'express';
import StakingTransaction from '../models/StakingTransaction';
import logger from '../utils/logger';

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Registrar nueva transacción
 *     description: Registra una nueva transacción de staking
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StakingTransaction'
 *     responses:
 *       201:
 *         description: Transacción registrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StakingTransaction'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const createTransaction = async (req: Request, res: Response) => {
  try {
    // Normalize userAddress to lowercase
    const data = { ...req.body, userAddress: req.body.userAddress.toLowerCase() };
    const transaction = new StakingTransaction(data);
    await transaction.save();
    
    logger.success(`Transaction recorded: ${transaction.txHash}`, { 
      service: 'API', 
      method: 'createTransaction',
      txHash: transaction.txHash
    });
    
    res.status(201).json(transaction);
  } catch (error) {
    logger.error(`Error recording transaction: ${error}`, { service: 'API', method: 'createTransaction' });
    res.status(500).json({ error: 'Failed to record transaction' });
  }
};

/**
 * @swagger
 * /api/transactions/{userAddress}:
 *   get:
 *     summary: Obtener transacciones de usuario
 *     description: Retorna el historial de transacciones de un usuario
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: userAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Dirección del usuario
 *         example: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *         description: Red blockchain para filtrar (opcional)
 *         example: sepolia
 *     responses:
 *       200:
 *         description: Lista de transacciones del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StakingTransaction'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getTransactionsByUser = async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.params;
    const { network } = req.query;
    
    // Use regex for case-insensitive search just in case
    const query: any = { userAddress: { $regex: new RegExp(`^${userAddress}$`, 'i') } };
    if (network) {
      query.network = network;
    }
    
    const transactions = await StakingTransaction.find(query).sort({ timestamp: -1 });
    
    logger.info(`Found ${transactions.length} transactions for ${userAddress}`, { 
      service: 'API', 
      method: 'getTransactionsByUser' 
    });
    
    res.json(transactions);
  } catch (error) {
    logger.error(`Error fetching transactions: ${error}`, { service: 'API', method: 'getTransactionsByUser' });
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

/**
 * @swagger
 * /api/transactions/{txHash}/status:
 *   patch:
 *     summary: Actualizar estado de transacción
 *     description: Actualiza el estado de una transacción (pending, confirmed, failed)
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: txHash
 *         required: true
 *         schema:
 *           type: string
 *         description: Hash de la transacción
 *         example: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, failed]
 *                 example: confirmed
 *     responses:
 *       200:
 *         description: Transacción actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StakingTransaction'
 *       404:
 *         description: Transacción no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const updateTransactionStatus = async (req: Request, res: Response) => {
  try {
    const txHashParam = req.params.txHash;
    const txHash = Array.isArray(txHashParam) ? txHashParam[0] : txHashParam;
    const { status } = req.body;

    if (!txHash) {
      return res.status(400).json({ error: 'txHash is required' });
    }
    
    const transaction = await StakingTransaction.findOneAndUpdate(
      { txHash },
      { status },
      { new: true }
    );
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    logger.success(`Transaction ${txHash} updated to ${status}`, { 
      service: 'API', 
      method: 'updateTransactionStatus',
      txHash
    });
    
    res.json(transaction);
  } catch (error) {
    logger.error(`Error updating transaction: ${error}`, { service: 'API', method: 'updateTransactionStatus' });
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};
