import math
import numpy as np
from scipy.stats import hypergeom
from bisect import bisect_left
from bisect import bisect_right

def calculate_mean_values(cdf_result, values):
    richtig = [(cdf_result ** math.ceil((i + 1) / 2)) * value for i, value in enumerate(values)]
    return richtig


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
    N = 1872   # Total population size
    K = math.ceil(N * 0.8)    # Total number of successes in the population
    n = math.ceil(N / 16)     # Number of draws
    k = math.ceil(n * (2/3))     # Number of observed successes

    # Calculate CDF
    cdf_result = hypergeometric_cdf(N, K, n, k)
    # This result suggests that the probability of drawing 41667 or fewer successes in a sample of 62,500 from a population of 1,000,000 with 800,000 successes is extremely low.

    '''WALLET-BEST-CASE'''
    five_upper_failure = [0.50883, 0.38889, 0.30061, 0.23374, 0.18268, 0.14332, 0.11277, 0.088925, 0.070254, 0.055588, 0.044039, 0.034927, 0.027725, 0.022025, 0.017508, 0.013925, 0.011081, 0.0088216, 0.0070254]
    '''WALLET-BEST-CASE'''

    # Data
    x_values = range(2, len(five_upper_failure) + 2)

    '''WALLET-BEST-CASE'''
    five_upper_failure_mean = calculate_mean_values(cdf_result, five_upper_failure)
    '''WALLET-BEST-CASE'''

    while True:
        user_security = float(input('Enter a security percentage(0-1): '))

        '''WALLET-BEST-CASE'''
        rev = five_upper_failure_mean[::-1]
        rev_ind = bisect_left(rev, user_security)
        '''WALLET-BEST-CASE'''

        if user_security < 0:
            print('Closing Program')
            break

        '''WALLET-BEST-CASE'''
        print(five_upper_failure_mean)
        print(f'Block-height: {19 - rev_ind + 1}')
        print(f'Quorums: {math.ceil((19 - rev_ind + 1) / 2)}')
        '''WALLET-BEST-CASE'''
