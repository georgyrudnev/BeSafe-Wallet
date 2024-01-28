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


interface AccountDetailProps {
  account: Account
}


const API_URL_BC = 'https://sepolia.beaconcha.in/';                       
const API_KEY_BC = 'V3haY1Rtck9OOFVZOUsxd2hmRmVKY1RXb2gzTQ';


  // Declare a new state variable, which we'll call "showSafetyProbabilityInput"
  // and initialize it to false

const AccountDetail: React.FC<AccountDetailProps> = ({account}) => {
  // Set probability input field
  const [showSafetyProbabilityInput, setShowSafetyProbabilityInput] = useState(false);
  console.log({showSafetyProbabilityInput})
  const [probability, setProbability] = useState('');

  // Declare a new state variable, which we'll call participation_rate   TODO CHECK IF STRING OR NUMBER 
  const [participation_rate, setParticipation_rate] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

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
    setAmount(Number.parseFloat(event.target.value));
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    // Update the seedphrase state with the value from the text input
    setProbability(event.target.value);
  }

  const handleKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.keyCode === 13) {
      event.preventDefault();
      transfer();
    }
  }

  async function getParticipation(blockNumber: string) {
            TransactionService.getSlot(blockNumber).then(response => {
              //console.log(response.data.data[0].posConsensus);
              //console.log(response.data.data[0].consensusAlgorithm);
              setTransactions(response.data);
              console.log("after setting transactions array state", response.data);

            }).catch(error => {
                console.log({error})
            })
      
    const slot = "1";
    console.log("Slot: " + slot);
    const slotOptions = {
      method: 'GET',
      url: `${API_URL_BC}api/v1/slot/${slot}`,
      params: {apikey: API_KEY_BC},
      headers: {accept: 'application/json'}
    };
    console.log("Slot Request: ", slotOptions)
    const response = await axios.request(slotOptions);
    console.log("Slot response: ", response.data)
    return response.data.syncaggregate_participation
  }

  useEffect(() => {
    console.log({transactions});
  }, [transactions]);

  async function transfer() {
    // Set the network response status to "pending"
    console.log({showSafetyProbabilityInput})
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
          console.log("Participation rate (with delay): " + participation_rate);
          console.log(transactions);
          setNetworkResponse({
            status: 'complete',
            message: <p>Transfer complete! <a href={`${sepolia.blockExplorerUrl}/tx/${receipt.transactionHash}`} target="_blank" rel="noreferrer">
              View transaction
              </a></p>,
          });
          return receipt;
        }, 20000); // Delay execution for 20000 milliseconds (20 seconds) to give time for sepolia node to update
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
            <input type="text" placeholder="Enter a value between 0 and 100" aria-placeholder="Enter a value between 0 and 100" className="form-control"
              value={probability} onChange={handleChange} onKeyDown={handleKeyDown} />
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

