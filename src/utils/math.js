import jStat from 'jstat';

//
export function calculateMeanValues(cdfResult, values, amount_quorums = 1, block_height = 2) {
  return values.map((value, i) => Math.pow(cdfResult, amount_quorums/*Math.floor((i + 2) / 2)*/) * value);
}

export function hypergeometricCDF(N, K, n, k) {
  let cdfValue = 0;
  for (let i = 0; i < k; i++) {
    cdfValue += jStat.hypgeom.pdf(i, N, K, n);
  }
  return cdfValue;
}

// Example usage
let N = 1000;   // Total population size
let K = 800;    // Total number of successes in the population
let n = 25;     // Number of draws
let k = 17;     // Number of observed successes

// Calculate CDF
let cdfResult = hypergeometricCDF(N, K, n, k);
console.log('CDF Result:', cdfResult);

// Provided failure arrays
export let fiveUpperFailure = [0.50883, 0.38889, 0.30061, 0.23374, 0.18268, 0.14332, 0.11277, 0.088925, 0.070254, 0.055588, 0.044039, 0.034927, 0.027725, 0.022025, 0.017508, 0.013925, 0.011081, 0.0088216, 0.0070254];
export let twoUpperFailure = [0.40081, 0.28256, 0.20242, 0.14596, 0.10624, 0.077868, 0.057336, 0.042363, 0.031388, 0.023309, 0.017341, 0.012921, 0.0096393, 0.0071989, 0.0053812, 0.0040255, 0.0030134, 0.002257, 0.0016913];
//export let fiveLowerFailure = [0.36217, 0.22941, 0.14728, 0.095439, 0.062274, 0.040851, 0.026914, 0.017794, 0.0118, 0.0078446, 0.0052265, 0.0034888, 0.0023328, 0.0015621, 0.0010474, 0.00070319, 0.00047259, 0.00031793, 0.00021407];
//export let twoLowerFailure = [0.33446, 0.20267, 0.12452, 0.077253, 0.048272, 0.030331, 0.019143, 0.012126, 0.0077051, 0.0049087, 0.0031342, 0.0020051, 0.001285, 0.0008248, 0.00053013, 0.00034115, 0.00021978, 0.00014174, 9.1492e-05];

// Calculate mean values
let fiveUpperFailureMean = calculateMeanValues(cdfResult, fiveUpperFailure);
let twoUpperFailureMean = calculateMeanValues(cdfResult, twoUpperFailure);
//let fiveLowerFailureMean = calculateMeanValues(cdfResult, fiveLowerFailure);
//let twoLowerFailureMean = calculateMeanValues(cdfResult, twoLowerFailure);

console.log('Five Upper Failure Mean:', fiveUpperFailureMean);
console.log('Two Upper Failure Mean:', twoUpperFailureMean);
//console.log('Five Lower Failure Mean:', fiveLowerFailureMean);
//console.log('Two Lower Failure Mean:', twoLowerFailureMean);