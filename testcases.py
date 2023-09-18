# This is a sample Python script.

# Press ⌃R to execute it or replace it with your code.
# Press Double ⇧ to search everywhere for classes, files, tool windows, actions, and settings.


import requests
import json

# Function to test the Lambda function via API Gateway
def test_lambda_function(api_endpoint):

    # Test data for positive test cases
    test_data = [
        {'accountId': 'account1', 'charges': 19.5},  # Valid Input
        {'accountId': 'account1', 'charges': 0},   # Zero Charges
        {'accountId': 'account1', 'charges': 80.5}, # Sufficient Balance
        {'accountId': 'account1', 'charges': 0},   # Zero Balance
        {'accountId': '', 'charges': 50},  # Missing accountId
        {'accountId': '123', 'charges': ''},  # Missing charges
        {'accountId': '123', 'charges': -50},  # Negative Charges
        {'accountId': '123'},  # Missing charges field
        {'accountId': 'account1', 'charges': 0},  # Zero Charges
    ]

    for data in test_data:
        response = requests.post(api_endpoint+'/charge-request-redis', json=data)
        print(f'Test data: {data}')
        print(f'Response: {response.json()}')

    responserest = requests.post(api_endpoint+'/reset-redis')
    print(f'Reset Response: {responserest.json()}')
# Replace 'your_api_endpoint_here' with the actual API endpoint
api_endpoint = 'insert-your-endpoint-url'
test_lambda_function(api_endpoint)