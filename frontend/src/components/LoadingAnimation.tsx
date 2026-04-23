import { motion } from 'framer-motion';
import Image from 'next/image';

interface LoadingAnimationProps {
  tokenIcon?: string;
  message?: string;
  submessage?: string;
}

/**
 * Enhanced loading animation for staking operations
 * Shows animated token icon with pulsing effects
 */
export function LoadingAnimation({ 
  tokenIcon = '/icons/dedlyfi.png',
  message = 'Processing transaction...',
  submessage = 'This may take a few moments'
}: LoadingAnimationProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Animated Token Icon */}
      <div className="relative mb-6">
        {/* Outer pulsing ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-[var(--color-primary)]/20"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ width: '120px', height: '120px', left: '-10px', top: '-10px' }}
        />
        
        {/* Middle ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-[var(--color-primary)]/30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0.3, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
          style={{ width: '110px', height: '110px', left: '-5px', top: '-5px' }}
        />

        {/* Token Icon Container */}
        <motion.div
          className="relative h-24 w-24 rounded-full bg-gradient-to-br from-[var(--color-primary)]/20 to-purple-500/20 p-4 ring-2 ring-[var(--color-primary)]/40"
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div className="h-full w-full rounded-full bg-[var(--color-bg-card)] p-2 flex items-center justify-center">
            <Image
              src={tokenIcon}
              alt="Token"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
        </motion.div>

        {/* Orbiting dots */}
        {[0, 120, 240].map((angle, i) => (
          <motion.div
            key={i}
            className="absolute h-3 w-3 rounded-full bg-[var(--color-primary)]"
            style={{
              left: '50%',
              top: '50%',
            }}
            animate={{
              x: [
                Math.cos((angle * Math.PI) / 180) * 50,
                Math.cos(((angle + 360) * Math.PI) / 180) * 50,
              ],
              y: [
                Math.sin((angle * Math.PI) / 180) * 50,
                Math.sin(((angle + 360) * Math.PI) / 180) * 50,
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      {/* Loading Text */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold text-[var(--color-text-main)] mb-2">
          {message}
        </h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          {submessage}
        </p>
        
        {/* Animated dots */}
        <motion.div
          className="flex items-center justify-center gap-1 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-[var(--color-primary)]"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
