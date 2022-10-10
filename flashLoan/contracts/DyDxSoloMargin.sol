// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

pragma experimental ABIEncoderV2;

import "./interfaces/FlashloanBase.sol";
import "./interfaces/ICallee.sol";

contract DyDxSoloMargin is ICallee, FlashloanBase {
    address private constant SOLO = 0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e;

    event Log(string message, uint256 val);

    struct MyCustomData {
        address token;
        uint256 repayAmount;
    }

    function initiateFlashLoan(address _token, uint256 _amount) external {
        ISoloMargin solo = ISoloMargin(SOLO);

        // Get marketId from token address ( for USDC marketId is 2)
        uint256 marketId = _getMarketIdFromTokenAddress(SOLO, _token);

        // repay amount (_amount + fee(2 wei))
        uint256 repayAmount = _getRepaymentAmountInternal(_amount);
        IERC20(_token).approve(SOLO, repayAmount);

        /*
        flashLoan on DyDx : 
        1. Borrow 
        2. Call callFunction()
        3. Deposit back
        */
        Actions.ActionArgs[] memory operations = new Actions.ActionArgs[](3);

        operations[0] = _getWithdrawAction(marketId, _amount);
        operations[1] = _getCallAction(
            abi.encode(MyCustomData({token: _token, repayAmount: repayAmount}))
        );
        operations[2] = _getDepositAction(marketId, repayAmount);

        Account.Info[] memory accountInfos = new Account.Info[](1);
        accountInfos[0] = _getAccountInfo();

        solo.operate(accountInfos, operations);
    }

    function callFunction(
        address sender,
        Account.Info memory account,
        bytes memory data
    ) public override {
        require(msg.sender == SOLO, "!solo");
        require(sender == address(this), "!this contract");

        MyCustomData memory mcd = abi.decode(data, (MyCustomData));
        uint256 repayAmount = mcd.repayAmount;

        uint256 bal = IERC20(mcd.token).balanceOf(address(this));
        require(bal >= repayAmount, "bal < repay");

        emit Log("contract balance: ", bal);
        emit Log("repay amount: ", repayAmount);
    }
}
