"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const memcached = require("memcached");
const util = require("util");
const KEY = `account1/balance`;
const DEFAULT_BALANCE = 100;
const memcachedClient = new memcached(`${process.env.ENDPOINT}:${process.env.PORT}`);


exports.chargeRequestMemcached = async function (input) {
    const balance = await getBalanceMemcached(KEY);
    const charges = getCharges();
    const isAuthorized = authorizeRequest(balance, charges);
    if (!isAuthorized) {
        return {
            remainingBalance,
            isAuthorized,
            charges: 0,
        };
    }
    remainingBalance = await chargeMemcached(KEY, charges);
    return {
        remainingBalance,
        charges,
        isAuthorized,
    };
};

function authorizeRequest(remainingBalance, charges) {
    return remainingBalance >= charges;
}
function getCharges() {
    return DEFAULT_BALANCE / 20;
}

async function getBalanceMemcached(key) {
    return new Promise((resolve, reject) => {
        memcachedClient.get(key, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(Number(data));
            }
        });
    });
}
async function chargeMemcached(key, charges) {
    return new Promise((resolve, reject) => {
        memcachedClient.decr(key, charges, (err, result) => {
            if (err) {
                reject(err);
            }
            else {
                return resolve(Number(result));
            }
        });
    });
}
