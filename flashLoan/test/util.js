const BN = require("bn.js");

function sendEther(web3, from, to, amount) {
  return web3.eth.sendTransaction({
    from,
    to,
    value: web3.utils.toWei(amount.toString(), "ether"),
  });
}

function cast(x) {
  if (x instanceof BN) {
    return x;
  }
  return new BN(x);
}



function pow(x, y) {
  x = cast(x);
  y = cast(y);
  return x.pow(y);
}


module.exports = {
  sendEther,
  pow,
};