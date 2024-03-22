export type Chain = {
    chainId: string;
    name: string;
    blockExplorerUrl: string;
    rpcUrl: string;
    API_URL_BC: string;
    API_KEY_BC: string;
  };
  
export const goerli: Chain = {
    chainId: '5',
    name: 'Goerli',
    blockExplorerUrl: 'https://goerli.etherscan.io',
    rpcUrl: 'https://goerli.infura.io/v3/59b59e23bb7c44d799b5db4a1b83e4ee',
    API_URL_BC: 'https://goerli.beaconcha.in/',
    API_KEY_BC: 'bnlJQVNhZUszV2xjZ0tJaEEzd05XbjgyMEhiSw'
};

export const mainnet: Chain = {
    chainId: '1',
    name: 'Ethereum',
    blockExplorerUrl: 'https://etherscan.io',
    rpcUrl: 'https://mainnet.infura.io/v3/59b59e23bb7c44d799b5db4a1b83e4ee',
    API_URL_BC: 'https://beaconcha.in/',
    API_KEY_BC: 'bnlJQVNhZUszV2xjZ0tJaEEzd05XbjgyMEhiSw'
};

export const sepolia: Chain = {
    chainId: '11155111',
    name: 'Sepolia',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    rpcUrl: 'https://sepolia.infura.io/v3/209800a15ce24cf6a44e251ea915b9b4',
    API_URL_BC: 'https://sepolia.beaconcha.in/',
    API_KEY_BC: 'bnlJQVNhZUszV2xjZ0tJaEEzd05XbjgyMEhiSw'
};

export const holesky: Chain = {
    chainId: '17000',
    name: 'Holesky',
    blockExplorerUrl: 'https://holesky.etherscan.io',
    rpcUrl: 'https://ethereum-holesky-rpc.publicnode.com',
    API_URL_BC: 'https://holesky.beaconcha.in/',
    API_KEY_BC: 'bnlJQVNhZUszV2xjZ0tJaEEzd05XbjgyMEhiSw'
};

export const CHAINS_CONFIG = {
    [goerli.chainId]: goerli,
    [mainnet.chainId]: mainnet,
    [sepolia.chainId]: sepolia,
    [holesky.chainId]: holesky,
};
 // Set for other chain
export const network = sepolia;