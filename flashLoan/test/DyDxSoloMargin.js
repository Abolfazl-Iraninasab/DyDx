const BN = require("bn.js");
const { sendEther, pow } = require("./util");

const IERC20 = artifacts.require("IERC20");
const DyDxSoloMargin = artifacts.require("DyDxSoloMargin");

contract("DyDxSoloMargin", (accounts) => {
    const SOLO = "0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e";          // DyDx SoloMargin
    const WHALE = "0xF84C43c00096740dbfd0FD019fE9804861f33914";         // USDC whale
    const TOKEN_BORROW = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";  // USDC
    const DECIMALS = 6;
    const FUND_AMOUNT = pow(10, DECIMALS).mul(new BN(1500));
    const BORROW_AMOUNT = pow(10, DECIMALS).mul(new BN(1000));

    let testDyDxSoloMargin;
    let token;
    before(async () => {
        token = await IERC20.at(TOKEN_BORROW);
        testDyDxSoloMargin = await DyDxSoloMargin.new();

        // send enough token to cover fee
        await sendEther(web3, accounts[0], WHALE, 1);
    });

    it("Send USDC to this contract ", async () => {
        const bal = await token.balanceOf(WHALE);
        assert(bal.gte(FUND_AMOUNT), "insufficiant balance ");
        await token.transfer(testDyDxSoloMargin.address, FUND_AMOUNT, {
            from: WHALE,
        });

        console.log(
            "----------------------Before flashLoan----------------------"
        );
        // const contractBal = await token.balanceOf(SOLO);
        console.log(
            `contract balance : ${await token.balanceOf(
                testDyDxSoloMargin.address
            )}`
        );

        const soloBal = await token.balanceOf(SOLO);
        console.log(`solo balance : ${soloBal}`);
        assert(
            soloBal.gte(BORROW_AMOUNT),
            "solo balance should be greater than amount we want to borrow! "
        );
    });

    it("flash loan", async () => {
        console.log(
            "---------------------Before deposit back--------------------"
        );
        const tx = await testDyDxSoloMargin.initiateFlashLoan(
            token.address,
            BORROW_AMOUNT,
            {
                from: WHALE,
            }
        );

        for (const log of tx.logs) {
            console.log(log.args.message, log.args.val.toString());
        }
        console.log(
            "-----------After deposit back (flashLoan finished)----------"
        );
        console.log(
            `contract balance : ${await token.balanceOf(
                testDyDxSoloMargin.address
            )}`
        );
        console.log(`solo balance : ${await token.balanceOf(SOLO)}`);

    });
});
