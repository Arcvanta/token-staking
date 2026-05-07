import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PoC Staking API',
      version: '1.0.0',
      description: `
        🚀 **API REST para gestionar staking descentralizado de BTC, ETH y USDC**
        
        Esta API permite:
        - 📊 Consultar opciones de staking en múltiples protocolos (Uniswap, Aave, Lido)
        - 💰 Ejecutar transacciones de staking en blockchain
        - 📈 Obtener cotizaciones con fees calculados
        - 📜 Consultar historial de transacciones
        
        **Red activa:** Sepolia Testnet (configurable a Polygon Mainnet)
        
        **Fee:** 0.5% (configurable hasta 5%)
      `,
      contact: {
        name: 'DedlyFi Team',
        email: 'dev@dedlyfi.com',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:4001',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: '🏥 Health check endpoints',
      },
      {
        name: 'Staking Options',
        description: '📊 Endpoints para gestionar opciones de staking disponibles',
      },
      {
        name: 'Staking',
        description: '⚡ Endpoints para ejecutar staking en blockchain',
      },
      {
        name: 'Transactions',
        description: '📜 Endpoints para gestionar transacciones de staking',
      },
    ],
    components: {
      schemas: {
        ProtocolOption: {
          type: 'object',
          required: ['id', 'protocol', 'token', 'apy', 'tvl', 'risk', 'adapterAddress', 'network'],
          properties: {
            id: {
              type: 'string',
              description: 'ID único de la opción',
              example: 'uniswap-eth-sepolia',
            },
            protocol: {
              type: 'string',
              description: 'Nombre del protocolo',
              example: 'Uniswap V3',
            },
            token: {
              type: 'string',
              description: 'Token a stakear',
              enum: ['ETH', 'WBTC', 'USDC'],
              example: 'ETH',
            },
            apy: {
              type: 'number',
              description: 'APY anual en porcentaje',
              example: 5.2,
            },
            tvl: {
              type: 'string',
              description: 'Total Value Locked',
              example: '$1.2B',
            },
            risk: {
              type: 'string',
              enum: ['Low', 'Medium', 'High'],
              description: 'Nivel de riesgo',
              example: 'Medium',
            },
            adapterAddress: {
              type: 'string',
              description: 'Dirección del contrato adapter',
              example: '0x1234567890123456789012345678901234567890',
            },
            isActive: {
              type: 'boolean',
              description: 'Si la opción está activa',
              example: true,
            },
            network: {
              type: 'string',
              description: 'Red blockchain',
              example: 'sepolia',
            },
          },
        },
        StakingTransaction: {
          type: 'object',
          required: ['userAddress', 'token', 'amount', 'protocol', 'adapterAddress', 'txHash', 'fee', 'network'],
          properties: {
            userAddress: {
              type: 'string',
              description: 'Dirección del usuario',
              example: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
            },
            token: {
              type: 'string',
              description: 'Token stakeado',
              example: 'ETH',
            },
            amount: {
              type: 'string',
              description: 'Cantidad stakeada en wei',
              example: '1000000000000000000',
            },
            protocol: {
              type: 'string',
              description: 'Protocolo utilizado',
              example: 'Uniswap V3',
            },
            adapterAddress: {
              type: 'string',
              description: 'Dirección del adapter',
              example: '0x1234567890123456789012345678901234567890',
            },
            txHash: {
              type: 'string',
              description: 'Hash de la transacción',
              example: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'failed'],
              description: 'Estado de la transacción',
              example: 'confirmed',
            },
            fee: {
              type: 'string',
              description: 'Fee cobrado en wei',
              example: '5000000000000000',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp de la transacción',
            },
            network: {
              type: 'string',
              description: 'Red blockchain',
              example: 'sepolia',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensaje de error',
              example: 'Failed to fetch staking options',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
