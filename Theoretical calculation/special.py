import math
import numpy as np
from scipy.stats import hypergeom

def calculate_mean_values(cdf_result, amount_quorums, lc_values, block_height):
    return (cdf_result ** amount_quorums) * lc_values[block_height - 2]


def hypergeometric_cdf(N, K, n, k):
    """
    Calculate the cumulative distribution function (CDF) for the hypergeometric distribution.

    Parameters:
    N (int): Total population size.
    K (int): Total number of successes in the population.
    n (int): Number of draws (sample size).
    k (int): Number of observed successes in the sample.

    Returns:
    float: CDF at point k.
    """
    # Create an array of points up to k
    x = np.arange(0, k)

    # Calculate the CDF using the hypergeometric distribution
    cdf_value = hypergeom.cdf(x, N, K, n)[-1]
    return cdf_value


if __name__ == "__main__":
    # Example usage
    N = 1000   # Total population size
    K = 800    # Total number of successes in the population
    n = 25     # Number of draws
    k = 17     # Number of observed successes

    # Calculate CDF
    cdf_result = hypergeometric_cdf(N, K, n, k)
    print('CDF Result (Failure Probability of a Quorum): ', cdf_result)

    five_upper_failure = [0.50883, 0.38889, 0.30061, 0.23374, 0.18268, 0.14332, 0.11277, 0.088925, 0.070254, 0.055588, 0.044039, 0.034927, 0.027725, 0.022025, 0.017508, 0.013925, 0.011081, 0.0088216, 0.0070254]
    two_upper_failure = [0.40081, 0.28256, 0.20242, 0.14596, 0.10624, 0.077868, 0.057336, 0.042363, 0.031388, 0.023309, 0.017341, 0.012921, 0.0096393, 0.0071989, 0.0053812, 0.0040255, 0.0030134, 0.002257, 0.0016913]

    while True:
        user_security = float(input('Enter a failure security parameter s (0 < s > 1) to get the Block-depth: '))

        if user_security < 0:
            print('Closing Program...')
            break

        amount_quorums = 2
        block_height = 7

        five_prob = calculate_mean_values(cdf_result, amount_quorums, five_upper_failure, block_height)
        two_prob = calculate_mean_values(cdf_result, amount_quorums, two_upper_failure, block_height)
        print(f'Probability of failing with a 5s delay, Amount of Quorums = {amount_quorums} and Block Height = {block_height} is: {five_prob}')
        print(f'Probability of failing with a 2s delay, Amount of Quorums = {amount_quorums} and Block Height = {block_height} is: {two_prob}')

        if five_prob < 1 - user_security:
            print(f'The user security is reached with 5s delay. The amount of quorums required is {amount_quorums} and the block-height required is {block_height}.')
        else:
            print('With a 5s delay the user security is not yet reached.')
        if two_prob < 1 - user_security:
            print(f'The user security is reached with 2s delay. The amount of quorums required is {amount_quorums} and the block-height required is {block_height}.')
        else:
            print('With a 2s delay the user security is not yet reached.')

