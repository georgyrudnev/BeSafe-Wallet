import axios from 'axios';
import { network } from '../models/Chain';




export class TransactionService {

  static API_URL =  'https://deep-index.moralis.io/api/v2';
  static API_KEY =  'EuwYtjWwWHGbnwsCnGauMtMMaEQZugtjaws2ybm2ZpSR15a8vzl6QUPkEUWHTOCU';

  static async getTransactions(address: string) {
    const options = {
        method: 'GET',
        url: `${TransactionService.API_URL}/${address}`,
        params: {chain: network.name.toLowerCase()},
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
      url: `${network.API_URL_BC}api/v1/execution/block/${blockNumber}?apikey=${network.API_KEY_BC}}`,
      //params: {apikey: TransactionService},
      headers: {accept: 'application/json'}
    };
    console.log("Execution Request: ", options)

      const response = await axios.request(options)

    return response

  } 

  static async getSlotDetails(slotNumber: string) {
    const slotOptions = {
      method: 'GET',
      url: `${network.API_URL_BC}api/v1/slot/${slotNumber}?apikey=${network.API_KEY_BC}`,
      //params: {apikey: TransactionService},
      headers: {accept: 'application/json'}
    };
    console.log("Slot Details: ", slotOptions)

      const response = await axios.request(slotOptions)
    
    return response

  } 

  static async getValidators(epochNumber: number) {
    const epochOptions = {
      method: 'GET',
      url: `${network.API_URL_BC}api/v1/epoch/${epochNumber}`,
      params: {apikey: network.API_KEY_BC},
      headers: {accept: 'application/json'}
    };

    console.log("Epoch details for validator amount: ", epochOptions)

      const response = await axios.request(epochOptions)
    
    return response

  } 

}


