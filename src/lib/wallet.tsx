/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createPublicClient, createWalletClient, custom, http, formatEther, parseEther } from 'viem';
import { defineChain } from 'viem';
import { RIGLOB_CONFIG } from '@/config/riglob';
import { useToast } from '@/components/Toast';

// Define Custom Ritual Chain
export const ritualChain = defineChain({
  id: RIGLOB_CONFIG.ritualChain.id,
  name: RIGLOB_CONFIG.ritualChain.name,
  nativeCurrency: RIGLOB_CONFIG.ritualChain.nativeCurrency,
  rpcUrls: {
    default: { http: [RIGLOB_CONFIG.ritualChain.rpcUrls.default.http[0]] },
    public: { http: [RIGLOB_CONFIG.ritualChain.rpcUrls.public.http[0]] },
  },
  blockExplorers: {
    default: {
      name: RIGLOB_CONFIG.ritualChain.blockExplorers.default.name,
      url: RIGLOB_CONFIG.ritualChain.blockExplorers.default.url,
    },
  },
});

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  balance: string;
  isCorrectNetwork: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
  sendFeeTransaction: () => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string>('0.0000');
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const isConnected = !!address;
  const isCorrectNetwork = chainId === ritualChain.id;

  // Initialize public client for reading data (like balances)
  const getPublicClient = useCallback(() => {
    return createPublicClient({
      chain: ritualChain,
      transport: http(ritualChain.rpcUrls.default.http[0]),
    });
  }, []);

  // Update Balance
  const updateBalance = useCallback(async (userAddress: string) => {
    try {
      const client = getPublicClient();
      const bal = await client.getBalance({ address: userAddress as `0x${string}` });
      setBalance(parseFloat(formatEther(bal)).toFixed(4));
    } catch (err) {
      console.error('Error fetching balance:', err);
      setBalance('0.0000');
    }
  }, [getPublicClient]);

  // Handle chain/account changes
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      setAddress(null);
      setBalance('0.0000');
    } else {
      const newAddress = accounts[0];
      setAddress(newAddress);
      updateBalance(newAddress);
    }
  }, [updateBalance]);

  const handleChainChanged = useCallback((hexChainId: string) => {
    const numericChainId = parseInt(hexChainId, 16);
    setChainId(numericChainId);
    if (address) {
      updateBalance(address);
    }
  }, [address, updateBalance]);

  // Auto connect if already authorized
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const provider = window.ethereum as any;

    const init = async () => {
      try {
        const chainHex = await provider.request({ method: 'eth_chainId' });
        setChainId(parseInt(chainHex, 16));

        const accounts = await provider.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          updateBalance(accounts[0]);
        }
      } catch (err) {
        console.error('Error during wallet auto-connect init:', err);
      }
    };

    init();

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);

    return () => {
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('chainChanged', handleChainChanged);
    };
  }, [handleAccountsChanged, handleChainChanged, updateBalance]);

  // Connect Wallet Action
  const connect = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      toast('error', 'No Ethereum provider found. Please install MetaMask.');
      return;
    }

    setIsConnecting(true);
    try {
      const provider = window.ethereum as any;
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      const newAddress = accounts[0];
      setAddress(newAddress);
      
      const chainHex = await provider.request({ method: 'eth_chainId' });
      setChainId(parseInt(chainHex, 16));
      
      await updateBalance(newAddress);
      toast('success', 'Wallet connected successfully!');
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      toast('error', err.message || 'Failed to connect wallet.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Wallet Action
  const disconnect = () => {
    setAddress(null);
    setBalance('0.0000');
    toast('info', 'Wallet disconnected.');
  };

  // Switch to or add Ritual Network
  const switchNetwork = async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const provider = window.ethereum as any;
    const hexChainId = `0x${ritualChain.id.toString(16)}`;

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
      toast('success', 'Switched to Ritual network!');
    } catch (switchError: any) {
      // Code 4902 indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: hexChainId,
                chainName: ritualChain.name,
                rpcUrls: [ritualChain.rpcUrls.default.http[0]],
                nativeCurrency: ritualChain.nativeCurrency,
                blockExplorerUrls: [ritualChain.blockExplorers.default.url],
              },
            ],
          });
          toast('success', 'Ritual network added and switched!');
        } catch (addError: any) {
          toast('error', `Failed to add Ritual network: ${addError.message}`);
        }
      } else {
        toast('error', `Failed to switch network: ${switchError.message}`);
      }
    }
  };

  // Send Submission Fee Transaction
  const sendFeeTransaction = async (): Promise<string> => {
    if (typeof window === 'undefined' || !window.ethereum || !address) {
      throw new Error('Wallet not connected.');
    }

    if (!isCorrectNetwork) {
      throw new Error('Incorrect network. Please switch to Ritual testnet.');
    }

    const provider = window.ethereum as any;
    const walletClient = createWalletClient({
      chain: ritualChain,
      transport: custom(provider),
    });

    const hash = await walletClient.sendTransaction({
      account: address as `0x${string}`,
      to: RIGLOB_CONFIG.adminReceiverWallet as `0x${string}`,
      value: parseEther(RIGLOB_CONFIG.submitFeeEth),
    });

    return hash;
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        isConnecting,
        chainId,
        balance,
        isCorrectNetwork,
        connect,
        disconnect,
        switchNetwork,
        sendFeeTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
