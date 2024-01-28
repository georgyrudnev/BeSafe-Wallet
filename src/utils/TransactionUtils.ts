import { ethers, Wallet } from 'ethers';
import { CHAINS_CONFIG, sepolia } from '../models/Chain';

export interface Transaction {
  //  status: string;
  ///  data: {
      basefee: number;
      blockHash: string;
      blockNumber: number;
      timestamp: number;
      blockReward: number;
      blockMevReward: number;
      producerReward: number;
      feeRecipient: string;
      gasLimit: number;
      gasUsed: number;
      baseFee: number;
      txCount: number;
      internalTxCount: number;
      uncleCount: number;
      parentHash: string;
      uncleHash: string;
      difficulty: number;
      posConsensus: {
        executionBlockNumber: number;
        proposerIndex: number;
        slot: number;
        epoch: number;
        finalized: boolean;
      };
      relay: {
        tag: string;
        builderPubkey: string;
        producerFeeRecipient: string;
      };
      consensusAlgorithm: string;
   // }[];
  }


export async function sendToken(
  amount: number,
  from: string,
  to: string,
  privateKey: string,
) {

  const chain = CHAINS_CONFIG[sepolia.chainId];

  // Create a provider using the Infura RPC URL for Sepolia
  const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrl);

  // Create a wallet instance from the sender's private key
  const wallet: Wallet = new ethers.Wallet(privateKey, provider);

  // Construct the transaction object
  const tx = {
    to,
    value: ethers.utils.parseEther(amount.toString()),
  };

  // Sign the transaction with the sender's wallet
  const transaction = await wallet.sendTransaction(tx);

  console.log('Transaction:', transaction);
  console.log('Waiting for the transaction to be mined...');

  // Wait for the transaction to be mined
  const receipt = await transaction.wait();

  return {transaction, receipt};
}
