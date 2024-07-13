import math
import numpy as np
from scipy.stats import hypergeom
import matplotlib.pyplot as plt
from bisect import bisect_left


def plot_graph(x_values, data, title, xlabel, ylabel):
    plt.figure(figsize=(10, 6))
    for label, y_values in data.items():
        plt.plot(x_values, y_values, label=label)

    plt.title(title)
    plt.xlabel(xlabel)
    plt.ylabel(ylabel)
    plt.legend()
    plt.grid(True)
    plt.show()


def calculate_mean_values(cdf_result, values):
    return [(cdf_result ** math.floor((i + 2) / 2)) * value for i, value in enumerate(values)]


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
    N = 10**6   # Total population size
    K = 800000    # Total number of successes in the population
    n = 10     # Number of draws
    k = 7     # Number of observed successes

    # Calculate CDF
    cdf_result = hypergeometric_cdf(N, K, n, k)
    # This result suggests that the probability of drawing 41667 or fewer successes in a sample of 62,500 from a population of 1,000,000 with 800,000 successes is extremely low.

    five_upper_failure = [0.50883, 0.38889, 0.30061, 0.23374, 0.18268, 0.14332, 0.11277, 0.088925, 0.070254, 0.055588, 0.044039, 0.034927, 0.027725, 0.022025, 0.017508, 0.013925, 0.011081, 0.0088216, 0.0070254]
    two_upper_failure = [0.40081, 0.28256, 0.20242, 0.14596, 0.10624, 0.077868, 0.057336, 0.042363, 0.031388, 0.023309, 0.017341, 0.012921, 0.0096393, 0.0071989, 0.0053812, 0.0040255, 0.0030134, 0.002257, 0.0016913]
    five_lower_failure = [0.36217, 0.22941, 0.14728, 0.095439, 0.062274, 0.040851, 0.026914, 0.017794, 0.0118, 0.0078446, 0.0052265, 0.0034888, 0.0023328, 0.0015621, 0.0010474, 0.00070319, 0.00047259, 0.00031793, 0.00021407]
    two_lower_failure = [0.33446, 0.20267, 0.12452, 0.077253, 0.048272, 0.030331, 0.019143, 0.012126, 0.0077051, 0.0049087, 0.0031342, 0.0020051, 0.001285, 0.0008248, 0.00053013, 0.00034115, 0.00021978, 0.00014174, 9.1492e-05]

    data_failure = {
        'Five Upper Failure': five_upper_failure,
        'Two Upper Failure': two_upper_failure,
        'Five Lower Failure': five_lower_failure,
        'Two Lower Failure': two_lower_failure
    }

    # Data
    x_values = range(2, len(five_upper_failure) + 2)

    # Plotting failure values
    plot_graph(x_values, data_failure, 'Failure Rates LC', 'Block-depth', 'Failure Rate')

    # Calculate mean values
    five_upper_failure_mean = calculate_mean_values(cdf_result, five_upper_failure)
    two_upper_failure_mean = calculate_mean_values(cdf_result, two_upper_failure)
    five_lower_failure_mean = calculate_mean_values(cdf_result, five_lower_failure)
    two_lower_failure_mean = calculate_mean_values(cdf_result, two_lower_failure)

    data_failure_mean = {
        'Five Upper Failure Mean': five_upper_failure_mean,
        'Two Upper Failure Mean': two_upper_failure_mean,
        'Five Lower Failure Mean': five_lower_failure_mean,
        'Two Lower Failure Mean': two_lower_failure_mean
    }

    # Plotting failure mean values
    plot_graph(x_values, data_failure_mean, 'Failure Rates LC + FG', 'Block-depth', 'Failure Rate')

    five_lower_success = [1 - value for value in five_upper_failure]
    two_lower_success = [1 - value for value in two_upper_failure]
    five_upper_success = [1 - value for value in five_lower_failure]
    two_upper_success = [1 - value for value in two_lower_failure]

    data_success = {
        'Five Upper Success': five_upper_success,
        'Two Upper Success': two_upper_success,
        'Five Lower Succes': five_lower_success,
        'Two Lower Succes': two_lower_success
    }

    # Plotting success values
    plot_graph(x_values, data_success, 'Success Rates LC', 'Block-depth', 'Success Rate')

    five_lower_success_mean = [1 - value for value in five_upper_failure_mean]
    two_lower_success_mean = [1 - value for value in two_upper_failure_mean]
    five_upper_success_mean = [1 - value for value in five_lower_failure_mean]
    two_upper_success_mean = [1 - value for value in two_lower_failure_mean]

    data_success_mean = {
        'Five Upper Success Mean': five_upper_success_mean,
        'Two Upper Success Mean': two_upper_success_mean,
        'Five Lower Success Mean': five_lower_success_mean,
        'Two Lower Success Mean': two_lower_success_mean
    }

    # Plotting success mean values
    plot_graph(x_values, data_success_mean, 'Success Rates LC + FG', 'Block-depth', 'Success Rate')

    all_data_failure = {**data_failure, **data_failure_mean}

    # Plotting all failure values
    plot_graph(x_values, all_data_failure, 'Failure Rates LC & FG', 'Block-depth', 'Failure Rate')

    all_data_success = {**data_success, **data_success_mean}

    # Plotting all success values
    plot_graph(x_values, all_data_success, 'Success Rates LC & FG', 'Block-depth', 'Success Rate')

    five_upper_success_difference = [a - b for a, b in zip(five_upper_success_mean, five_upper_success)]
    two_upper_success_difference = [a - b for a, b in zip(two_upper_success_mean, two_upper_success)]
    five_lower_success_difference = [a - b for a, b in zip(five_lower_success_mean, five_lower_success)]
    two_lower_success_difference = [a - b for a, b in zip(two_lower_success_mean, two_lower_success)]

    data_difference = {
        'Five Upper Success Difference': five_upper_success_difference,
        'Two Upper Success Difference': two_upper_success_difference,
        'Five Lower Success Difference': five_lower_success_difference,
        'Two Lower Success Difference': two_lower_success_difference
    }

    plot_graph(x_values, data_difference, 'Success Difference', 'Block-depth', 'Success Rate')

 