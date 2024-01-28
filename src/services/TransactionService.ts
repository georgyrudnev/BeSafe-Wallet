import axios from 'axios';
import { sepolia } from '../models/Chain';



export class TransactionService {

  static API_URL =  'https://deep-index.moralis.io/api/v2';
  static API_KEY =  'EuwYtjWwWHGbnwsCnGauMtMMaEQZugtjaws2ybm2ZpSR15a8vzl6QUPkEUWHTOCU';

  // Beacon Chain API to get participation rate
  static API_URL_BC = 'https://sepolia.beaconcha.in/';
  static API_KEY_BC = 'V3haY1Rtck9OOFVZOUsxd2hmRmVKY1RXb2gzTQ';

  static async getTransactions(address: string) {
    const options = {
        method: 'GET',
        url: `${TransactionService.API_URL}/${address}`,
        params: {chain: sepolia.name.toLowerCase()},
        headers: {accept: 'application/json', 'X-API-Key': TransactionService.API_KEY}
      };

  const response = await axios.request(options);
  /*
  const blockOptions = {
    method: 'GET',
    url: `${TransactionService.API_URL_BC}/v1/slot/${slot}?apikey=${TransactionService.API_KEY_BC}`,
    //params: {slot: slot},
    headers: {accept: 'application/json', 'X-API-Key': TransactionService.API_KEY_BC}
};
  
  //const slot = response.slot;
  //static async getSlot(block: string) {};
    const slotOptions = {
      method: 'GET',
      url: `${TransactionService.API_URL_BC}/v1/slot/${slot}?apikey=${TransactionService.API_KEY_BC}`,
      //params: {slot: slot},
      headers: {accept: 'application/json', 'X-API-Key': TransactionService.API_KEY_BC}
  };
*/  
    return response;
  }

  static async getSlot(blockNumber: string) {
    const options = {
      method: 'GET',
      // removed ?apikey=${API_KEY_BC}
      url: `https://sepolia.beaconcha.in/api/v1/execution/block/${blockNumber}`,
      params: {apikey: TransactionService.API_KEY_BC},
      headers: {accept: 'application/json'}
        //'Access-Control-Allow-Origin': 'http://localhost:3000',
        //'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        //'Access-Control-Allow-Headers': 'Content-Type',
        //'Access-Control-Allow-Credentials': 'true'
    };
    console.log("Execution Request: ", options)

      const response = await axios.request(options)//.then(response => {;
      
    //}).catch(error => {
      //console.log("Await Error: ", response)})

    //console.log("Transactions interface:", transactions);
    
    return response//transactions[0].posConsensus.slot;

  } 

}


