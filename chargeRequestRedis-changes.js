"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis = require("redis");
const util = require("util");
const KEY_SUFFIX = '/balance';

exports.chargeRequestRedis = async function (input) {

  // Input Validation
  if (!input.accountId || input.accountId.trim() === '') {
    return {
      isAuthorized: false,
      error: 'Missing or empty accountId'
    };
  }
  if (input.charges === undefined || input.charges < 0) {
    return {
      isAuthorized: false,
      error: 'Missing or negative charges'
    };
  }
  
  const key = getKey(input);
  const redisClient = await getRedisClient();
  const startTime = process.hrtime();
  const watchAsync = util.promisify(redisClient.watch).bind(redisClient);
  let retry = true;
  let result;
  while(retry)
  {
    try {
      await watchAsync(key); // watch key
      const balance = await getBalanceRedis(redisClient, key);
      const charges = getCharges(input);
      console.log('Account key: ' + key + ' ,charges: ' + charges + ' ,balance: ' + balance);
      const isAuthorized = authorizeRequest(balance, charges);
  
      if (isAuthorized) {
        result = await new Promise((resolve, reject) => {
          const multi = redisClient.multi();
          multi.incrbyfloat(key, -charges); // use incrbyfloat with negative value to subtract
          multi.exec(async (err, replies) => {
            if (err) {
              reject(err);
            } else if (replies === null) {
              reject('Key modified, retrying transaction');
            } else {
              loglatency(startTime);
              resolve({
                remainingBalance: replies[0],
                isAuthorized
              });
            }
          });
        });
        
        if (result !== null) {
          retry = false;
        }
      } else {
        result = {
          isAuthorized
        };
        retry = false;
      }
    } catch (err) {
      console.error('An error occurred:', err);
      result = {
        isAuthorized: false,
        error: err.message
      };
      retry = false;
    }
  } // end While loop
  await disconnectRedis(redisClient);
  return result;
};

async function getRedisClient() {
    return new Promise((resolve, reject) => {
        try {
            const client = new redis.RedisClient({
                host: process.env.ENDPOINT,
                port: parseInt(process.env.PORT || "6379"),
            });
            client.on("ready", () => {
                console.log('redis client ready');
                resolve(client);
            });
        }
        catch (error) {
            reject(error);
        }
    });
}
async function disconnectRedis(client) {
    return new Promise((resolve, reject) => {
        client.quit((error, res) => {
            if (error) {
                reject(error);
            }
            else if (res == "OK") {
                console.log('redis client disconnected');
                resolve(res);
            }
            else {
                reject("unknown error closing redis connection.");
            }
        });
    });
}

function authorizeRequest(balance, charges) {
    return balance >= charges;
}
function getCharges(input) {
    return parseFloat(input.charges);
}

function getKey(input) {
    return input.accountId + KEY_SUFFIX;
}

async function getBalanceRedis(redisClient, key) {
    const res = await util.promisify(redisClient.get).bind(redisClient).call(redisClient, key);
    if (res === null) {
        throw new Error('Account does not exist');
    }
    return parseFloat(res);
}


function loglatency(startTime){
  
   const elapsedTime = process.hrtime(startTime);
   const latencyInMilliseconds = (elapsedTime[0] * 1e9 + elapsedTime[1]) / 1e6;
   console.log('LatencyInMilliseconds: ' + latencyInMilliseconds);
  
}