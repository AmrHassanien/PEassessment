import requests
import json
from concurrent.futures import ThreadPoolExecutor

# Function to test the Lambda function via API Gateway using POST method
def charge_account(api_endpoint, data):

    response = requests.post(api_endpoint + '/charge-request-redis', json=data)
    print(f'Thread Test data: {data} ,Thread Response: {response.json()}' )

# Main function to initiate concurrent requests
def test_concurrency(api_endpoint):
    # reset the account balance to 100
    responserest = requests.post(api_endpoint + '/reset-redis')
    print(f'Reset Response: {responserest.json()}')

    test_data = [{'accountId': 'account1', 'charges': 20},  
        {'accountId': 'account1', 'charges': 20},   
        {'accountId': 'account1', 'charges': 20}, 
        {'accountId': 'account1', 'charges': 20},  
        {'accountId': 'account1', 'charges': 21}
    ]
    with ThreadPoolExecutor(max_workers=5) as executor:
        for data in test_data:
            executor.submit(charge_account, api_endpoint, data)

# Replace 'add-your-endpoint-url' with the actual API endpoint
api_endpoint = 'add-your-endpoint-url'
test_concurrency(api_endpoint)