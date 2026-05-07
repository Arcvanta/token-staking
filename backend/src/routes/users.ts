import { Request, Response } from 'express';
import User from '../models/User';
import logger from '../utils/logger';

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Register or login user with wallet address
 *     description: Creates a new user or updates last login time
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 example: "0x1234567890abcdef1234567890abcdef12345678"
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       201:
 *         description: New user created
 *       500:
 *         description: Server error
 */
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const normalizedAddress = walletAddress.toLowerCase();

    // Find or create user
    let user = await User.findOne({ walletAddress: normalizedAddress });

    if (user) {
      // Update last login
      user.lastLogin = new Date();
      await user.save();
      logger.info(`User logged in: ${normalizedAddress}`, { service: 'UserAuth' });
      return res.status(200).json({ user, isNewUser: false });
    } else {
      // Create new user
      user = new User({
        walletAddress: normalizedAddress,
        createdAt: new Date(),
        lastLogin: new Date()
      });
      await user.save();
      logger.success(`New user created: ${normalizedAddress}`, { service: 'UserAuth' });
      return res.status(201).json({ user, isNewUser: true });
    }
  } catch (error: any) {
    logger.error(`Error in user login: ${error.message}`, { service: 'UserAuth' });
    res.status(500).json({ error: 'Failed to process user login' });
  }
};

/**
 * @swagger
 * /api/users/{walletAddress}:
 *   get:
 *     summary: Get user by wallet address
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *       404:
 *         description: User not found
 */
export const getUserByAddress = async (req: Request, res: Response) => {
  try {
    const walletAddressParam = req.params.walletAddress;
    const walletAddress = Array.isArray(walletAddressParam)
      ? walletAddressParam[0]
      : walletAddressParam;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    logger.error(`Error fetching user: ${error.message}`, { service: 'UserAuth' });
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};
