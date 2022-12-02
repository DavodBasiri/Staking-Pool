const STK = artifacts.require("StakingToken");
const RTK = artifacts.require("RewardsToken");
const Staking = artifacts.require("Staking");

module.exports = async function (deployer) {
    // Deploy StakingToken
    await deployer.deploy(STK);
    const staking_token = await STK.deployed();

    // Deploy RewardsToken
    await deployer.deploy(RTK);
    const rewards_token = await RTK.deployed();

    // Deploy Staking
    await deployer.deploy(Staking, staking_token.address, rewards_token.address);
    const staking_contract = await Staking.deployed();

    await rewards_token.transfer(staking_contract.address, '4000000000000000000000000');
};