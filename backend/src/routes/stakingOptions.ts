import { Request, Response } from 'express';
import ProtocolOption from '../models/ProtocolOption';
import logger from '../utils/logger';

/**
 * @swagger
 * /api/options:
 *   get:
 *     summary: Obtener opciones de staking
 *     description: Retorna las opciones de staking disponibles, filtradas por token y/o red
 *     tags: [Staking Options]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *           enum: [ETH, WBTC, USDC]
 *         description: Token para filtrar (opcional)
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *         description: Red blockchain para filtrar (opcional)
 *         example: sepolia
 *     responses:
 *       200:
 *         description: Lista de opciones de staking
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProtocolOption'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getStakingOptions = async (req: Request, res: Response) => {
  try {
    const { token, network } = req.query;
    logger.info(`Fetching options for token: ${token || 'ALL'}, network: ${network || 'ALL'}`, {
      service: 'stakingOptions',
      method: 'getStakingOptions'
    });

    const query: any = { isActive: true };

    if (token) {
      query.token = (token as string).toUpperCase();
    }

    if (network) {
      query.network = network;
    }

    const options = await ProtocolOption.find(query).sort({ apy: -1 });

    logger.success(`Found ${options.length} options`, { service: 'stakingOptions', method: 'getStakingOptions' });
    res.json(options);
  } catch (error) {
    logger.error(`Error fetching options: ${error}`, { service: 'stakingOptions', method: 'getStakingOptions' });
    res.status(500).json({ error: 'Failed to fetch staking options' });
  }
};

/**
 * @swagger
 * /api/options:
 *   post:
 *     summary: Crear nueva opción de staking
 *     description: Crea una nueva opción de staking (solo admin)
 *     tags: [Staking Options]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProtocolOption'
 *     responses:
 *       201:
 *         description: Opción creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProtocolOption'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const createStakingOption = async (req: Request, res: Response) => {
  try {
    const option = new ProtocolOption(req.body);
    await option.save();

    logger.success(`Created new option: ${option.protocol}`, { service: 'API', method: 'createStakingOption' });
    res.status(201).json(option);
  } catch (error) {
    logger.error(`Error creating option: ${error}`, { service: 'API', method: 'createStakingOption' });
    res.status(500).json({ error: 'Failed to create staking option' });
  }
};
