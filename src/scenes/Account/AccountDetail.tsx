import React, {useCallback, useEffect, useState} from 'react';
import { sendToken, Transaction } from '../../utils/TransactionUtils';
import { network } from '../../models/Chain';
import { Account } from '../../models/Account';
import AccountTransactions from './AccountTransactions';
import { ethers } from 'ethers';
import { toFixedIfNecessary } from '../../utils/AccountUtils';
import './Account.css';
import { TransactionService } from '../../services/TransactionService';
import { wait } from '@testing-library/user-event/dist/utils';
import { hypergeometricCDF, calculateMeanValues, fiveUpperFailure/*, twoLowerFailure, fiveLowerFailure*/ } from '../../utils/math.js';

/// Known issues: safe state variable needs to be resetted, when user sends another transaction. Otherwise user needs to reloab page every time he wants 
//  to send another transaction.

interface AccountDetailProps {
  account: Account
}

let active_validators = 1850;

  // Declare a new state variable, which we'll call "showSafetyProbabilityInput"
  // and initialize it to false

const AccountDetail: React.FC<AccountDetailProps> = ({account}) => {
 
  const [safe, setSafe] = useState(false);
  const [showSafetyProbabilityInput, setShowSafetyProbabilityInput] = useState(false);
  const [probability, setProbability] = useState(0.01);
  const [missedSlots, setMissedSlots] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [transferDuration, setTransferDuration] = useState(0);	

  // Declare a new state variable, which we'll call participation_rate   TODO CHECK IF STRING OR NUMBER 
  const successRate = 0.8;
  const [validatorAmount, setValidatorAmount] = useState(0);
  const [blockHeight, setBlockHeight] = useState(0);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [currentBlock, setCurrentBlock] = useState(0)
  const [latestBlock, setLatestBlock] = useState(0)

  const [initialBlock, setInitialBlock] = useState(0);
  const [amountQuorums, setAmountQuorums] = useState(0);

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
        const provider = new ethers.providers.JsonRpcProvider(network.rpcUrl);
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
      setStartTime(performance.now()); // Evaluation of performance
      transfer();
      let endTime = performance.now(); // Evaluation of performance ends
      let duration = endTime - startTime; // Calculate duration
      setTransferDuration(duration);
    }
  }

async function getLatestBlock (){
         setTimeout(async () => {
          let getLatestSlot = await TransactionService.getSlotDetails("latest"); 
          setLatestBlock(getLatestSlot.data.data.exec_block_number);
          console.log("Latest not safe block: ", getLatestSlot.data.data.exec_block_number)
        }, 19000);
}

useEffect(() => {
  const fetchLatestBlockData = async () => {
    // Fetch data here
    let getLatestSlot = await TransactionService.getSlotDetails("latest"); 
    setLatestBlock(getLatestSlot.data.data.exec_block_number);
    console.log("Latest block updated in 20s interval: ", getLatestSlot.data.data.exec_block_number)
  };

  // Fetch immediately and then every intervalID seconds
  fetchLatestBlockData();
  const intervalId = setInterval(fetchLatestBlockData, 26000);

  // Clear interval on component unmount
  return () => {
    clearInterval(intervalId);
  };
}, []);

//  OVERLEAF: Getting real-time validator amount from sepolia node provider, fetching active validator amount every epoch
useEffect(() => {
  if (currentEpoch > 0) {
    const fetchValidators = async () => {
    let responseValidators = await TransactionService.getValidators(currentEpoch);
    active_validators = responseValidators.data.data.validatorscount;
    setValidatorAmount(active_validators);
    console.log("Real-time Validator amount updated: " + active_validators);
    };

    fetchValidators();
    }
}, [currentEpoch]);

function resetStates() {
  setAmountQuorums(0);
  setInitialBlock(0);
  setCurrentEpoch(0);
  setValidatorAmount(0);
  
}
  useEffect(() => {
    // Triggered whenever we have a new quorum or new epoch.
    if (amountQuorums > 0) {
    let quorum = amountQuorums
    let active_validators = validatorAmount;
    console.log("We have " + quorum + " Quorum reached. Running cdf...");

      let totalSuccess = Math.ceil(successRate * active_validators); // K (rounded up)
      let drawNum = Math.ceil(active_validators/32); // n, in Ethereum divided by 32, we want 16 validators to be drawn in an epoch
      let observedSuccess = Math.ceil((2/3)*drawNum); // k
          console.log("Total success (K): " + totalSuccess);
          console.log("Draw number (n): " + drawNum);
          console.log("Observed success (k): " + observedSuccess);

      let cdfResult = hypergeometricCDF(active_validators, totalSuccess, drawNum, observedSuccess);
      console.log("CDF result: " + cdfResult);
      console.log("latest block: " + latestBlock + " initial block: " + initialBlock);
      let blockHeight = latestBlock-initialBlock;
      if (blockHeight > 0 && blockHeight < 21) {
        let fiveUpperFailureMean = calculateMeanValues(cdfResult, fiveUpperFailure, quorum, blockHeight)//latestBlock-transactionBlock);
      
        console.log('Five Upper Failure Mean: ' + fiveUpperFailureMean);
        if (probability >= fiveUpperFailureMean) {
          setCurrentBlock(0);
          setFinalQuorum(quorum);
          resetStates();
          
          setSafe(true);
          console.log('Probability reached! Your transaction is safe!');
          let endTime = performance.now(); // Evaluation of performance ends
          let duration = endTime - startTime; // Calculate duration
          setTransferDuration(duration);
          console.log('Your failure probability: ', probability);
          console.log('Five Upper Failure Mean:', fiveUpperFailureMean);
          setBlockHeight(blockHeight);
          
        }
        else {
          getLatestBlock();
          console.log('Your transaction is not safe yet! Updating latest block...');
        
        }
      } else {
        resetStates();
      }
    }
  }, [amountQuorums, validatorAmount]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout; // Define timeoutId here
    //let i = 0;
    const fetchDataAndUpdate = async () => {
      // Fetch data and update state
      console.log("Checking current state... current block: " + currentBlock + " Latest block: " + latestBlock + " Quorums: " + amountQuorums);
      if (latestBlock > currentBlock && currentBlock > 0 && safe === false) { 
        try {
          const block = await TransactionService.getSlot(currentBlock.toString());
          let curSlot = block.data.data[0].posConsensus.slot;
          let curEpoch = block.data.data[0].posConsensus.epoch;
          if (curEpoch > currentEpoch) {
            // Trigger validator amount update
            setCurrentEpoch(curEpoch);
          }
          console.log("Current slot: " + curSlot);
          let partiResponse = await TransactionService.getSlotDetails(curSlot.toString());
          console.log("Quorum Block 1/2 Parti Rate: " + partiResponse.data.data.syncaggregate_participation);
          if (partiResponse.data.data.syncaggregate_participation > 0.67) { // Fix to be 2/3
            try {
            let nextPartiResponse = await TransactionService.getSlotDetails((curSlot+1).toString());
            console.log("Quorum Block 2/2 Parti Rate: " + nextPartiResponse.data.data.syncaggregate_participation);
            if (nextPartiResponse.data.data.syncaggregate_participation > 0.67) { // Fix to be 2/3
              setAmountQuorums(amountQuorums + 1);
            }
              } catch (error) {
              setMissedSlots(missedSlots + 1);
              console.log("Slot " + curSlot+1 + " missed")
            }
          } 
    // ZETA Question: What if we have empty slot without proposed block? Do we increase block height if validators voted for previous one?
              
  // Get the block number for latest slot

          setCurrentBlock(currentBlock + 2);
          console.log("+2 Current block: " + currentBlock);
          setTimeout(async () => {
            const getLatestSlot = await TransactionService.getSlotDetails("latest"); 
            setLatestBlock(getLatestSlot.data.data.exec_block_number);
          }, 12000);
        } catch (error)   
        {
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
        setCurrentEpoch(realEpoch);
        // to be removed after testing
        console.log("Slot from transactions: " + slot);
        console.log("Transaction slot: " + realSlot);
        console.log("Transaction epoch: " + realEpoch);
      
      
      }
    }
  }, [transactions]);


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
    setFinalQuorum(0);
    setMissedSlots(0);
    setSafe(false);
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
        setInitialBlock(receipt.blockNumber);
        setCurrentBlock(receipt.blockNumber);
        let endTime = performance.now(); // Evaluation of performance ends
        let duration = endTime - startTime; // Calculate duration
        setTransferDuration(duration);
        wait(20000); 
                //  OVERLEAF: Main function for our implementation, to incorporate the safety rule
        //const callback = async () => {
          setTimeout(() => {
          setNetworkResponse({
            status: 'complete',
            message: (
              <span>
                Transfer was included in a block on the chain!{' '}
                <a href={`${network.blockExplorerUrl}/tx/${receipt.transactionHash}`} target="_blank" rel="noreferrer">
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
                  Address: <a href={`${network.blockExplorerUrl}/address/${account.address}`} target="_blank" rel="noreferrer">
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
              Time passed: {transferDuration} ms  
            </p>
          )}
          {finalQuorum > 0 && (
            <p>Final quorums: {finalQuorum}, Block Height: {blockHeight}, Missed slots: {missedSlots} <br/>
              Your transaction is safe now!
              Time passed: {transferDuration} ms  
            </p>
          )}

        </h4>

        <AccountTransactions account={account} />
    </div>

  )
}

export default AccountDetail;

