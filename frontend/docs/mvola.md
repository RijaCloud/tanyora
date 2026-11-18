URL 
SANDBOX 
PRODUCTION 
This API present THREE (3) resources 
https://devapi.mvola.mg 
https://api.mvola.mg 
POST Initiate 
Transaction 
GET Transaction Details  
GET Transaction  
Status 
Overview 
APIs 
Reference 
/mvola/mm/transactions/type/merchantpay/1.0.0/ 
/mvola/mm/transactions/type/merchantpay/1.0.0/{{transID}} 
/mvola/mm/transactions/type/merchantpay/1.0.0/status/{{serverCorrelationId}} 
Merchant Pay API allow a tiers party to initiate a payment to a customer 
and either get notified using a Callback Url or send a polling request to 
view transaction status. 
The API is organized around REST 
With JSON -encoded request body 
Return JSON-encoded responses and HTTP response code 
1 
 2 
 
 
ERROR 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
Failed  
Failed transactions 
 
 
 
 
 
 
 
 
Failed  
Credentials issue 
 
 
standard HTTP response code is used to indicate whether the 
transaction is a success or a failure. 
 
 
200 - OK Everything worked as expected. 
400 - Bad Request The request was unacceptable, often due to 
missing a required parameter. 
401 - Unauthorized No valid API key provided. 
402 - Request Failed The parameters were valid but the request 
failed. 
403 - Forbidden The API key doesn't have permissions to 
perform the request. 
404 - Not Found The requested resource doesn't exist. 
409 - Conflict 
The request conflicts with another request 
(perhaps due to using the same idempotent 
key). 
429 - Too Many 
Requests 
Too many requests hit the API too quickly. We 
recommend an exponential backoff of your 
requests. 
500, 502, 503, 504 - 
Server Errors Something went wrong on the server 
 
 
Due to internal or transactions issue  
 
ErrorCategory Error category 
ErrorCode Error Code 
ErrorDescription description on the error 
ErrorDateTime Date and time when the error occurred 
ErrorParameters Key/value which add more details on the 
nature of the error  
 
 
If invalid credentials 
 
{ 
    "fault": { 
        "code": 900901, 
        "message": "Invalid Credentials", 
        "description": "Invalid Credentials. Make sure you  
have given the correct access token" 
    } 
} 
 
 3 
 
INITIATE TRANSACTION 
 
 
 
POST  
/mvola/mm/transactions/type/merchantpay/1.0.0/ 
 
  
 
 
INITIATE TRANSACTION 
 
Request 
Headers 
* Authorization Bearer <ACCESS_TOKEN initially 
generated using API Authenticate> 
* Version 1.0 
* X-CorrelationID 
ID from client to uniquely identify the 
request in client side. At most 40 
characters. Must be UUID format. 
 
Ex: 123e4567-e89b-12d3-a456-426614174000 
* UserLanguage FR or MG 
* UserAccountIdentifier 
Format msisdn;{{MerchantNumber}} 
 
MerchantNumber: the company phone number  
 
Ex: msisdn;0343500004 
partnerName The name of the company 
* Content-Type application/json 
X-Callback-URL  In case client needs MVola to invoke 
client’s API once transaction is completed 
* Cache-Control no-cache 
 
 
INITIATE TRANSACTION 
 
Body 
urlencoded 
 
 
 
 
 
 
 
 
 
 
 
* Mandatory 
 
* amount Amount of transaction without decimals 
* currency Currency code of the transaction -  
Possible Values - Ar 
* descriptionText Description on transaction. At most 50 
characters long without special character 
except : “-”, “.”, “_”, “,” 
* requestDate Transaction requested date by client - 
yyyy-MM-ddTHH:mm:ss.SSSZ format 
* debitParty/msisdn Phone number of subscriber 
 
In preprod it’s fixed: 0343500003 or 0343500004 
* creditParty/msisdn Phone number of merchant 
 
In preprod it’s fixed: 0343500003 or 0343500004 
 4 
 
 
 
 
* metadata 
/partnerName 
Name of the Partner. At most 50 
characters long without special character 
except : “-”, “.”, “_”, “,” 
* 
requestingOrganisation 
TransactionReference  
Transaction ID of client side. 
At most 50 characters long without special 
character except : “-”, “.”, “_”, “,” 
originalTransaction 
Reference 
Reference number related to the original 
transaction. 
metadata/fc Foreign currency (euro, dollar, …) 
metadata/amountFc The amount based of Foreign currency 
* Mandatory 
 
 
INITIATE TRANSACTION 
 
CURL 
Command 
 
curl --location -
request POST 'https://devapi.mvola.mg/mvola/mm/transactions/type/merchantpay/1.0.0
/' \ --header 'Version: 1.0' \ --header 'X-CorrelationID: {{XCorrelationID}}' \ --header 'UserLanguage: mg' \ --header 'UserAccountIdentifier: msisdn;{{merchantNumber}} \ --header 'partnerName: {{companyName}}' \ --header 'Content-Type: application/json' \ --header 'Authorization: Bearer <ACCESS_TOKEN> \ --header 'Cache-Control: no-cache’ \ --data-raw '{ "amount": "{{amount}}", "currency": "Ar", "descriptionText": "{{description}}", 
"requestingOrganisationTransactionReference": "{{partnerTransid}}", "requestDate": 
"{{requestDate}}", "originalTransactionReference": "{{originalTxRef}}", "debitParty": [ { 
"key": "msisdn", "value": "{{customerNumber}}" } ], "creditParty": [ { "key": "msisdn", "value": 
"{{MerchantNumber}}" } ], "metadata": [ { "key": "partnerName", "value": 
"{{companyName}}" }, { "key": "fc", "value": "USD" }, { "key": "amountFc", "value": "1" } ] }' 
 
INITIATE TRANSACTION 
 
Response 
Success  
 
 
 
Upon successful request THREE (3) outputs will be returned  
 
status  Static value “pending” 
serverCorrelationId Reference value to correlate transaction in 
client side 
notificationMethod callback or polling 
 
 
INITIATE TRANSACTION 
 
Success  
Callback 
Sample 
Success: PUT <third party url> 
 
{ 
  "transactionStatus": "completed", 
  "serverCorrelationId": "421a22a2-ef1d-42bc-9452-f4939a3d5cdf", 
  "transactionReference": "641235", 
  "requestDate": "2021-02-24T03:28:00.567Z", 
  "debitParty": [ 
    { 
 5 
      "key": "msisdn", 
      "value": "0343500003" 
    } 
  ], 
  "creditParty": [ 
    { 
      "key": "msisdn", 
      "value": "0343500004" 
    } 
  ], 
  "fees": [ 
    { 
      "feeAmount": "5.46" 
    } 
  ], 
  "metadata": [ 
    { 
      "key": "XCorrelationId", 
      "value": "3f2488d3-08cd-4fee-9dfa-a6a537a3b0b4" 
    } 
  ] 
} 
 
 
 
INITIATE TRANSACTION 
 
Failed 
Callback 
Sample 
 
 
Failed: PUT <third party url> 
 
{ 
  "transactionStatus": "failed", 
  "serverCorrelationId": "421a22a2-ef1d-42bc-9452-f4939a3d5cdf", 
  "transactionReference": "641235", 
  "requestDate": "2021-02-24T03:28:00.567Z", 
  "debitParty": [ 
    { 
      "key": "msisdn", 
      "value": "0343500003" 
    } 
  ], 
  "creditParty": [ 
    { 
      "key": "msisdn", 
      "value": "0343500004" 
    } 
  ], 
  "metadata": [ 
    { 
      "key": "XCorrelationId", 
      "value": "3f2488d3-08cd-4fee-9dfa-a6a537a3b0b4" 
    } 
  ] 
} 
 
 
 
 6 
 
TRANSACTION DETAILS 
 
 
GET 
 
/mvola/mm/transactions/type/merchantpay/1.0.0/{{transID}} 
 
 
 
 
TRANSACTION DETAILS 
 
Request 
Headers 
 
 
* Authorization Bearer <ACCESS_TOKEN initially generated 
using API Authenticate> 
* Version 1.0 
* X-CorrelationID 
ID from client to uniquely identify the 
request in client side. At most 40 
characters. Must be UUID format. 
 
Ex: 123e4567-e89b-12d3-a456-426614174000 
UserLanguage FR or MG 
* UserAccountIdentifier 
Format msisdn;{{merchantNumber}} 
 
Ex: msisdn;0343500004 
* partnerName The name of the company 
* Content-Type application/json 
* Cache-Control no-cache 
* Mandatory 
 
 
 
 
TRANSACTION DETAILS 
 
Request Input  
 
 
 
 
 
 
transID 
MVola transaction ID 
 
Retrieved from API Get transaction status response:  
objectReference  
 
 
 
 
TRANSACTION DETAILS 
 
CURL 
Command 
 
curl --location -
request GET 'https://devapi.mvola.mg/mvola/mm/transactions/type/merchantpa
y/1.0.0/{{transID}}\ --header 'Version: 1.0' \ --header 'X-CorrelationID: {{XCorrelationID}}' \ --header 'UserLanguage: FR' \ --header 'UserAccountIdentifier: msisdn;{{merchantNumber}} \ --header 'partnerName: {{companyName}} \ --header 'Authorization: Bearer <ACCESS_TOKEN>\ --header 'Cache-Control: no-cache’ \ --data-raw '' 
 
 
 
 
 
 
 
 
 
 7 
 
 
 
 
 
 
 
 
 
 
TRANSACTION DETAILS 
 
Response 
Success  
 
 
 
 
 
 
 
 
 
 
amount amount 
currency Ar 
transactionReference Transaction reference related to query 
transactionStatus trans_result (if 0 “completed”, else “failed”) 
createDate date - convert to standard format 
debitParty/msisdn debtor 
creditParty/msisdn creditor 
metadata/ 
XCorrelationId 
Correlation ID provided during merchant pay 
initiation. 
metadata/originalTran
sactionResult 
result 
metadata/originalTran
sactionResultDesc 
Mapped value of “result” from error code 
table 
fee/feeAmount amount_fee 
 
 
  
 8 
 
TRANSACTION STATUS 
 
 
GET 
 
/mvola/mm/transactions/type/merchantpay/1.0.0/status/{{serverCorrelationId}} 
 
 
 
 
 
TRANSACTION STATUS 
 
Request 
Headers 
 
 
* Authorization Bearer <ACCESS_TOKEN initially generated 
using API Authenticate> 
* Version 1.0 
* X-CorrelationID 
ID from client to uniquely identify the 
request in client side. At most 40 
characters. Must be UUID format. 
 
Ex : 123e4567-e89b-12d3-a456-426614174000 
* UserLanguage FR or MG 
* 
UserAccountIdentifier 
Format msisdn;{{merchantNumber}} 
 
Ex: msisdn;0343500004 
* partnerName The name of the company 
* Content-Type application/json 
* Cache-Control no-cache 
 
 
 
 
TRANSACTION STATUS 
 
Request Input 
 
 
 
 
 
* Mandatory 
 
 
serverCorrelationId serverCorrelationId in Merchant Pay API 
Response 
 
 
 
 
 
 
 
TRANSACTION STATUS 
 
CURL 
Command 
 
curl --location -
request GET 'https://devapi.mvola.mg/mvola/mm/transactions/type/merchantpa
y/1.0.0/{{serverCorrelationId}}\ --header 'Version: 1.0' \ --header 'X-CorrelationID: {{XCorrelationID}}' \ --header 'UserLanguage: FR' \ --header 'UserAccountIdentifier: msisdn;{{merchantNumber}} \ --header 'partnerName: {{companyName}} \ --header 'Authorization: Bearer <ACCESS_TOKEN> \ --header 'Cache-Control: no-cache’ \ --data-raw '' 
 
 
 
 
 
 
 
 
 
 
 
TRANSACTION STATUS 
status 
Response 
serverCorrelationId 
Status of the transaction. Possible values: 
• pending 
• completed 
• failed 
notificationMethod  
serverCorrelationId in Merchant Pay API 
Response 
objectReference  
Notification method of the transaction - 
polling or callback 
transid - Transaction reference of actual 
transaction 