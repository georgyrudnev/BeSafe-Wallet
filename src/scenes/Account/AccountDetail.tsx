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
import { hypergeometricCDF, calculateMeanValues } from '../../utils/math.js';


interface AccountDetailProps {
  account: Account
}

const active_validators = 1850;
const API_URL_BC = 'https://sepolia.beaconcha.in/';                       
const API_KEY_BC = 'V3haY1Rtck9OOFVZOUsxd2hmRmVKY1RXb2gzTQ';


  // Declare a new state variable, which we'll call "showSafetyProbabilityInput"
  // and initialize it to false

const AccountDetail: React.FC<AccountDetailProps> = ({account}) => {
  // Set probability input field
  const [showSafetyProbabilityInput, setShowSafetyProbabilityInput] = useState(false);
  console.log({showSafetyProbabilityInput})
  const [probability, setProbability] = useState(0);

  // Declare a new state variable, which we'll call participation_rate   TODO CHECK IF STRING OR NUMBER 
  const [participation_rate, setParticipation_rate] = useState('');
  const [transactions, setTransactions] = useState<Transaction>();
  const [slot, setSlot] = useState(0);

  const [destinationAddress, setDestinationAddress] = useState('');
  const [amount, setAmount] = useState(0);
  const [balance, setBalance] = useState(account.balance)

  const [networkResponse, setNetworkResponse] = useState<{ status: null | 'pending' | 'complete' | 'error', message: string | React.ReactElement }>({
    status: null,
    message: '',
  });

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

  useEffect(() => {
    if (transactions) {
      // Your code here that depends on the updated transactions state
      console.log("Consensus algorithm " + (transactions.consensusAlgorithm));
      if (transactions.posConsensus.slot != null) {
      setSlot(transactions.posConsensus.slot);
      let realSlot = transactions.posConsensus.slot;
      console.log("Slot from transactions: " + slot);
      console.log("Real-time slot: " + realSlot);
      const fetchData = async () => {
        try {
          const slotOptions = {
            method: 'GET',
            url: `${API_URL_BC}api/v1/slot/${realSlot}`,
            params: {apikey: API_KEY_BC},
            headers: {accept: 'application/json'}
          };

          console.log("Slot Request: ", slotOptions)
          const responseParti = await axios.request(slotOptions);
          console.log("Slot response: ", responseParti.data)
          setParticipation_rate(responseParti.data.data.syncaggregate_participation);
          // Participation rate
          console.log("Participation rate: " + responseParti.data.data.syncaggregate_participation)
          let drawNum = Number(responseParti.data.data.syncaggregate_participation)*active_validators // n
          console.log(drawNum)
          if (Number(participation_rate) > 0) {
            let cdfresult = hypergeometricCDF(active_validators, drawNum, active_validators/32, (2/3)*drawNum);
            console.log("CDF result: " + cdfresult);
          }
        } catch (error) {
          console.log({error})
        }
      };

      fetchData();
    }
    }
  }, [transactions, slot, participation_rate]);


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
             /*   
                  // setSlot(response.data.data[0].posConsensus.slot);
                  console.log("after timeout", response.data);
                  console.log("Consensus algorithm " + (transactions?.consensusAlgorithm ?? ''));
                  console.log("Slot from transactions: " + slot);
                
            
                const slotOptions = {
                  method: 'GET',
                  url: `${API_URL_BC}api/v1/slot/${slot}`,
                  params: {apikey: API_KEY_BC},
                  headers: {accept: 'application/json'}
                };
            
                console.log("Slot Request: ", slotOptions)
                const responseParti = await axios.request(slotOptions);
                console.log("Slot response: ", responseParti.data)
            
                return responseParti.data.syncaggregate_participation */
              } catch (error) {
                console.log({error})
                return 0;
              }
            }, 20000); // Delay execution for 20000 milliseconds (20 seconds) to give time for sepolia node to update
            return 0;
            }

 /* useEffect(() => {
    console.log({transactions});
  }, [transactions]);

  useEffect(() => {
    console.log(slot);
  }, [slot]);
*/
  async function transfer() {
    // Set the network response status to "pending"
    console.log("Probability input: " + probability)
    setNetworkResponse({
      status: 'pending',
      message: '',
    });

    try {
      const { receipt } = await sendToken(amount, account.address, destinationAddress, account.privateKey);

      if (receipt.status === 1) {
        // Set the network response status to "complete" and the message to the transaction hash
        wait(20000); // Wait until sepolia node gets block update
        setTimeout(() => {
          // Place the following lines here
         setParticipation_rate(getParticipation(receipt.blockNumber.toString()).toString());
          //console.log(transactions);
          setNetworkResponse({
            status: 'complete',
            message: <p>Transfer complete! <a href={`${sepolia.blockExplorerUrl}/tx/${receipt.transactionHash}`} target="_blank" rel="noreferrer">
              View transaction
              </a></p>,
          });
          return receipt;
        }, 5000); // Delay execution for 20000 milliseconds (20 seconds) to give time for sepolia node to update
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
            <label>Probability for transaction safety:</label>
            <input type="number" placeholder="Enter a value between 0 and 100" aria-placeholder="Enter a value between 0 and 100" className="form-control"
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

        <AccountTransactions account={account} />
    </div>

  )
}

export default AccountDetail;

