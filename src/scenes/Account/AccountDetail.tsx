import React, {useCallback, useEffect, useState} from 'react';
import { sendToken, Transaction } from '../../utils/TransactionUtils';
import { sepolia } from '../../models/Chain';
import { Account } from '../../models/Account';
import AccountTransactions from './AccountTransactions';
import { ethers } from 'ethers';
import { toFixedIfNecessary } from '../../utils/AccountUtils';
import './Account.css';
import { get } from 'http';
import axios from 'axios';
import { TransactionService } from '../../services/TransactionService';
import { wait } from '@testing-library/user-event/dist/utils';
import { hypergeometricCDF, calculateMeanValues, twoUpperFailure, fiveUpperFailure/*, twoLowerFailure, fiveLowerFailure*/ } from '../../utils/math.js';
import { act } from 'react-dom/test-utils';
/// Known issues: safe state variable needs to be resetted, when user sends another transaction. Otherwise user needs to reloab page every time he wants 
//  to send another transaction.

interface AccountDetailProps {
  account: Account
}

let active_validators = 1850;
const API_URL_BC = 'https://sepolia.beaconcha.in/';                       
const API_KEY_BC = 'V3haY1Rtck9OOFVZOUsxd2hmRmVKY1RXb2gzTQ';


  // Declare a new state variable, which we'll call "showSafetyProbabilityInput"
  // and initialize it to false

const AccountDetail: React.FC<AccountDetailProps> = ({account}) => {
  // Set probability input field
  const [safe, setSafe] = useState(false);
  const [showSafetyProbabilityInput, setShowSafetyProbabilityInput] = useState(false);
  const [probability, setProbability] = useState(0.01);

  // Declare a new state variable, which we'll call participation_rate   TODO CHECK IF STRING OR NUMBER 
  const successRate = 0.8;
  const [participation_rate, setParticipation_rate] = useState('');
  const [validatorAmount, setValidatorAmount] = useState(0);
  const [cdf, setCdf] = useState('computing cdf...');
  const [meanValues, setMeanValues] = useState('computing mean values...');
  const [currentSlot, setCurrentSlot] = useState(0);
  const [currentBlock, setCurrentBlock] = useState(0)
  const [latestBlock, setLatestBlock] = useState(0)
  const [blockHeight, setBlockHeight] = useState(0);
  const [statistics, setStatistics] = useState<{ cdf: string, meanValues: string }>({
    cdf: 'computing cdf  statisstic...',
    meanValues: 'computing mean values statistc...'
  });

  const [transactions, setTransactions] = useState<Transaction>();
  const [slot, setSlot] = useState(0);

  const [destinationAddress, setDestinationAddress] = useState('');
  const [amount, setAmount] = useState(0);
  const [balance, setBalance] = useState(account.balance)

  // For UI
  const [finalQuorum, setFinalQuorum] = useState<number>(0);
  const [networkResponse, setNetworkResponse] = useState<{ status: null | 'pending' | 'complete' | 'error', message: string | React.ReactElement }>({
    status: null,
    message: '',
  });
  
  //  OVERLEAF: Getting account balance from sepolia node provider
  useEffect(() => {
    const fetchData = async () => {
        const provider = new ethers.providers.JsonRpcProvider(sepolia.rpcUrl);
        let accountBalance = await provider.getBalance(account.address);
        setBalance((String(toFixedIfNecessary(ethers.utils.formatEther(accountBalance)))));
    }
    fetchData();
}, [account.address])



  function handleDestinationAddressChange(event: React.ChangeEvent<HTMLInputElement>) {
    setDestinationAddress(event.target.value);
  }

  function handleAmountChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!Number.isNaN(event.target.value)) { 
      setAmount(Number.parseFloat(event.target.value));
    }
  }

  function handleProbabilityChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!Number.isNaN(event.target.value)) {   
      setProbability(Number.parseFloat(event.target.value));
    }
  }

  const handleKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.keyCode === 13) {
      event.preventDefault();
      transfer();
    }
  }

async function getLatestBlock (){
         setTimeout(async () => {
          const getLatestSlot = await TransactionService.getSlotDetails("latest"); 
          setLatestBlock(getLatestSlot.data.data.exec_block_number);
          console.log("Latest not safe block: ", getLatestSlot.data.data.exec_block_number)
        }, 19000);
}
  useEffect(() => {
    // If we have two consecutive blocks with participation rate > 67%
    console.log("INSIDE THE BLOCKHEIGHT USEEFFECT Block height: " + blockHeight);
    if (blockHeight > 0 && blockHeight % 2 === 0) {
      let active_validators = validatorAmount;

      let totalSuccess = Math.ceil(successRate * active_validators); // K (rounded up)
      let drawNum = Math.ceil(active_validators/32); // n, in Ethereum divided by 32, we want 16 validators to be drawn in an epoch
      let observedSuccess = Math.ceil((2/3)*drawNum); // k
          console.log("Total success (K): " + totalSuccess);
          console.log("Draw number (n): " + drawNum);
          console.log("Observed success (k): " + observedSuccess);

      let cdfResult = hypergeometricCDF(active_validators, totalSuccess, drawNum, observedSuccess);
      console.log("CDF result  in loop: " + cdfResult);
      
      let quorum = blockHeight/2;
      let fiveUpperFailureMean = calculateMeanValues(cdfResult, fiveUpperFailure, quorum, blockHeight)//latestBlock-transactionBlock); //TO BE DONE
      console.log('Five Upper Failure Mean: ' + fiveUpperFailureMean);
      if (probability >= fiveUpperFailureMean) {
        setSafe(true);
        console.log('Probability reached! Your transaction is safe!');
        setFinalQuorum(quorum);
        console.log('Your failure probability: ', probability);
        console.log('Five Upper Failure Mean:', fiveUpperFailureMean);
      }
      else {
        getLatestBlock();
        console.log('Your transaction is not safe yet! Updating latest block...');
        
      }
    }
    else {
      getLatestBlock();
      console.log('Your transaction is not safe yet! Updating latest block...');
      }
  }, [blockHeight, validatorAmount]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout; // Define timeoutId here
    //let i = 0;
    const fetchDataAndUpdate = async () => {
      // Fetch data and update state

      if (latestBlock >= currentBlock && currentBlock > 0 && safe === false) { 
try {
  const block = await TransactionService.getSlot(currentBlock.toString());
  setCurrentSlot(block.data.data[0].posConsensus.slot);
  console.log("Current slot: " + currentSlot);
  let partiResponse = await TransactionService.getSlotDetails(currentSlot.toString());
  if (partiResponse.data.data.syncaggregate_participation > 0.67) { // Fix to be 2/3
    console.log("Block height updated: " + blockHeight);
    setBlockHeight(blockHeight + 1);
    // ZETA Question: What if we have empty slot without proposed block? Do we increase block height if validators voted for previous one?
  }
  // Get the block number for latest slot

  setCurrentBlock(currentBlock + 1);
  console.log("Current block: " + currentBlock);
  setTimeout(async () => {
    const getLatestSlot = await TransactionService.getSlotDetails("latest"); 
    setLatestBlock(getLatestSlot.data.data.exec_block_number);
  }, 12000);
} catch (error) {
  console.error("An error occurred:", error);
  // Repeat the request
  setTimeout(fetchDataAndUpdate, 20000);
}
      }
if (safe === false) {
      // Schedule the next update
      timeoutId = setTimeout(fetchDataAndUpdate, 20000); // Store the timeout ID // 20000 ms = 20 seconds
      clearTimeout(timeoutId); // Cancel the timeout using the stored ID
    };
    }
    // Start the updates
    fetchDataAndUpdate();
  
    // Clean up function
    return () => {
      
      clearTimeout(timeoutId); // Cancel the timeout using the stored ID
    };
  }, [currentBlock, latestBlock]); // Empty dependency array means this effect runs once on mount and clean up on unmount

              //  OVERLEAF: Main functionality for updaating important states for our safety implementation
  useEffect(() => {
    if (transactions) {
      // code here that depends on the updated transactions state
      console.log("Consensus algorithm " + (transactions.consensusAlgorithm));
      if (transactions.posConsensus.slot != null) {
      setSlot(transactions.posConsensus.slot);
      let realSlot = transactions.posConsensus.slot;
      let realEpoch = transactions.posConsensus.epoch;

      // to be removed after testing
      console.log("Slot from transactions: " + slot);
      console.log("Transaction slot: " + realSlot);
      console.log("Transaction epoch: " + realEpoch);
      
      const fetchData = async () => {
        try {
          wait(10000); 
          const responseParti = await TransactionService.getSlotDetails(realSlot.toString());//await axios.request(slotOptions);
          const responseValidators = await TransactionService.getValidators(realEpoch);//axios.request(epochOptions);
          const getLatestSlot = await TransactionService.getSlotDetails("latest");
          
          console.log("Latest block: ", getLatestSlot.data.data.exec_block_number)
          setLatestBlock(getLatestSlot.data.data.exec_block_number)
          console.log("SlotDetails response: ", responseParti.data)
          console.log("Epoch response for validatorAmount: ", responseValidators.data)
          setParticipation_rate(responseParti.data.data.syncaggregate_participation);
          // Participation rate
          console.log("Participation rate: " + responseParti.data.data.syncaggregate_participation)
          active_validators = responseValidators.data.data.validatorscount;
          setValidatorAmount(active_validators);
          console.log("Real-time Validator amount: " + active_validators)
          //let successNum = Number(responseParti.data.data.syncaggregate_participation)*active_validators // n // legacy, thought drawNum is participation rate*active_validators, to be removed after meeting on wednesday
          
                // OVERLEAF: Participation rate used to validate every subsequent block has participation rate >67% and if not, the block is not increasing block height input to our cdf function
          let participation = Number(responseParti.data.data.syncaggregate_participation);
          // TODO implement loop logic that checks our block is < latest block and we have not achieved input safety rate, check next blocks and calculate mean values if block participation rate is >67%
          
          // success rate is part of our safety rule according to Thomas, meaning it is part of our protocol and does not depend on chain data or user input

          let totalSuccess = Math.ceil(successRate * active_validators); // K (rounded up)
          let drawNum = Math.ceil(active_validators/32); // n, in Ethereum divided by 32, we want 16 validators to be drawn in an epoch
          let observedSuccess = Math.ceil((2/3)*drawNum); // k


          if (Number(participation_rate) > 0) {
            let cdfResult = hypergeometricCDF(active_validators, totalSuccess, drawNum, observedSuccess);
            console.log("CDF result: " + cdfResult);
            setCdf("CDF result: " + cdfResult.toString() + "\n");

            // Assume that there is one quorum per block
            //  Old TODO: Get block latest and subtract it from block of this transaction to get blockDifference. Afterwards calculateMeanValues(cdfResult, fiveUpperFailure, blockDifference, BlockDifference)


           // setMeanValues("Five upper failure:\n" + JSON.stringify(fiveUpperFailureMean, null, 2) + "\n" + "Two upper failure:\n" + JSON.stringify(twoUpperFailureMean, null, 2));
            //console.log('Five Lower Failure Mean:', fiveLowerFailureMean);
            //console.log('Two Lower Failure Mean:', twoLowerFailureMean);
          }
        } catch (error) {
          console.log({error})
        }
      };

      fetchData();
    }
    }
  }, [transactions, slot, participation_rate, cdf, meanValues]);


  async function getParticipation(blockNumber: string, retryCount = 0) {
    
    const maxRetries = 3;

    setTimeout(async () => { 
              try {
                const response = await TransactionService.getSlot(blockNumber);
                if (response.data.data[0]) {
                setTransactions(response.data.data[0]); 
                console.log("Received transaction and block data:", response.data); 
                
              }
                else if (retryCount < maxRetries) {
                  console.log(`Retry attempt ${retryCount + 1}`);
                  getParticipation(blockNumber, retryCount + 1);
                }

              } catch (error) {
                console.log({error})
                return 0;
              }
            }, 20000); // Delay execution for 20000 milliseconds (20 seconds) to give time for sepolia node to update
            return 0;
            }


            //  OVERLEAF: Transfer function triggered when transfer button is clicked, amount and probability input is provided
  async function transfer() {
    // Set the network response status to "pending"
    console.log("Probability input: " + probability)
    setNetworkResponse({
      status: 'pending',
      message: '',
    });
                //  OVERLEAF: Sending the transaction via ethers.js library functions
    try {
      const { receipt } = await sendToken(amount, account.address, destinationAddress, account.privateKey);
                //  OVERLEAF: Timeouts used to give time for sepolia node to update, to overcome react async/await issues 
        
      if (receipt.status === 1) {
        // Set the network response status to "complete" and the message to the transaction hash
        setCurrentBlock(receipt.blockNumber);
        wait(20000); 
                //  OVERLEAF: Main function for our implementation, to incorporate the safety rule
        //const callback = async () => {
          setTimeout(() => {
         setParticipation_rate(getParticipation(receipt.blockNumber.toString()).toString());
          setNetworkResponse({
            status: 'complete',
            message: (
              <span>
                Transfer was included in a block on the chain!{' '}
                <a href={`${sepolia.blockExplorerUrl}/tx/${receipt.transactionHash}`} target="_blank" rel="noreferrer">
                  View transaction
                </a>
                
                
              </span>
            )})
          return receipt;
        }, 20000); // Delay execution for 20000 milliseconds (20 seconds) to give time for sepolia node to update
        //}
        //setTimeout(callback, 5000);
        return receipt;
      } else {
        // Transaction failed
        console.log(`Failed to send ${receipt}`);
        // Set the network response status to "error" and the message to the receipt
        setNetworkResponse({
          status: 'error',
          message: JSON.stringify(receipt),
        });
        return { receipt };
      }
    } catch (error: any) {
      // An error occurred while sending the transaction
      console.error({ error });
      // Set the network response status to "error" and the message to the error
      setNetworkResponse({
        status: 'error',
        message: error.reason || JSON.stringify(error),
      });
    }
  }


                  //  OVERLEAF: React HTML Frontend
  return (
    <div className='AccountDetail container'>
        <h4>
                  Address: <a href={`${sepolia.blockExplorerUrl}/address/${account.address}`} target="_blank" rel="noreferrer">
            {account.address}
            </a><br/>
            Balance: {balance} ETH
            
        </h4>

        <div className="form-group">
            <label>Destination Address:</label>
            <input
            className="form-control"
            type="text"
            value={destinationAddress}
            onChange={handleDestinationAddressChange}
            />
        </div>

        <div className="form-group">
            <label>Amount:</label>
            <input
            className="form-control"
            type="number"
            value={amount}
            onChange={handleAmountChange}
            />
        </div>

        <button
            className="btn btn-primary"
            type="button"
            onClick={() => showSafetyProbabilityInput ? transfer : setShowSafetyProbabilityInput(true)}
            disabled={!amount || networkResponse.status === 'pending'}
        >
            Send {amount} ETH
        </button>

        {/* Show the safety probability input and button if showSafetyProbabilityInput is true */}
        {showSafetyProbabilityInput && (
          <div className="form-group mt-3">
            <label>Probability for transaction failure:</label>
            <input type="number" placeholder="Enter a value between 0 and 1" aria-placeholder="Enter a value between 0 and 100" className="form-control"
              value={probability} onChange={handleProbabilityChange} onKeyDown={handleKeyDown} />
          </div>
        )}

        {networkResponse.status &&
            <>
            {networkResponse.status === 'pending' && <p>Transfer is pending...</p>}
            {networkResponse.status === 'complete' && <p>{networkResponse.message}</p>}
            {networkResponse.status === 'error' && <p>Error occurred while transferring tokens: {networkResponse.message}</p>}
            </>
        }
        <h4> 
          {finalQuorum == 0 && networkResponse.status === 'complete' && (
            <p>Safety does not fulfill your failure requirement yet.
              Waiting for further block updates...
            </p>
          )}
          {finalQuorum > 0 && (
            <p>Final quorums: {finalQuorum} <br/>
              <a>Your transaction is safe now! </a> 
            </p>
          )}

        </h4>

        <AccountTransactions account={account} />
    </div>

  )
}

export default AccountDetail;

