"use strict";
const { Contract } = require("fabric-contract-api");

class HerbChainContract extends Contract {
  async ping(ctx) {
    return "pong";
  }
}

module.exports.contracts = [HerbChainContract];
