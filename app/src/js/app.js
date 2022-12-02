web3Provider = null;
contracts = {};
url='http://127.0.0.1:7545';
currentAccount = null;

stakingToken_address = null;
rewardsToken_address = null;
staking_address = null;

$(function(){
    $(window).load(function(){
        init();
    });
});

function init() {
    return initWeb3();
}

function initWeb3() {
    if (typeof web3 !== 'undefined') {
        // If a web3 instance is already provided by Meta Mask.
        web3Provider = web3.currentProvider;
    } else {
        // Specify default instance if no web3 instance provided
        web3Provider = new Web3.providers.HttpProvider(url);
    }
    web3 = new Web3(web3Provider);

    ethereum.on('accountsChanged', handleAccountChanged);
    ethereum.on('chainChanged', handleChainChanged);

    // ست کردن اکانت پیش فرض
    web3.eth.defaultAccount = web3.eth.accounts[0];

    return initContract();
}

function handleAccountChanged() {
    ethereum.request({method: 'eth_requestAccounts'}).then(function(accounts){
        currentAccount = accounts[0];
        // وقتی اکانت جاری تغییر میکند باید اکانت پیش فرض وب3 را بروز کنیم
        web3.eth.defaultAccount = currentAccount;
        setCurrentAccount();
        populateInfo();
    });
}

async function handleChainChanged() {
    // ریلود شدن صفحه
    window.location.reload();
}

function initContract() {

    $.getJSON('StakingToken.json', function(artifact){
        // Create contract object form that artifact
        contracts.StakingToken = TruffleContract(artifact);
        contracts.StakingToken.setProvider(web3Provider);
    });

    $.getJSON('RewardsToken.json', function(artifact){
        // Create contract object form that artifact
        contracts.RewardsToken = TruffleContract(artifact);
        contracts.RewardsToken.setProvider(web3Provider);
    });

    $.getJSON('Staking.json', function(artifact){
        // Create contract object form that artifact
        contracts.Staking = TruffleContract(artifact);
        contracts.Staking.setProvider(web3Provider);

        // Set Current Account
        currentAccount = web3.eth.defaultAccount;

        // نمایش اکانت جاری در هدر صفحه
        setCurrentAccount();

        populateInfo();
    });

    return bindEvents();
}

function setCurrentAccount() {
    $("#current_account").html(currentAccount);
}

function populateInfo() {
    var stakeInstance;
    contracts.Staking.deployed().then(function(instance){
        stakeInstance = instance;
        return stakeInstance.getAddress();
    }).then(function(result){

        staking_address = result;
        console.log("Contract Address: ", staking_address);
        return getStakingTokenAdr();

    }).catch(function(err){
        console.log("Error in populateInfo(): ", err.message);
    });
}

function getStakingTokenAdr() {
    var stakeInstance;
    contracts.Staking.deployed().then(function(instance){
        stakeInstance = instance;
        return stakeInstance.stakingToken();
    }).then(function(result){

        stakingToken_address = result;
        console.log("STK Address: ", stakingToken_address);
        return getRewardTokenAdr();

    }).catch(function(err){
        console.log("Error in getStakingTokenAdr(): ", err.message);
    });
}

function getRewardTokenAdr() {
    var stakeInstance;
    contracts.Staking.deployed().then(function(instance){
        stakeInstance = instance;
        return stakeInstance.rewardsToken();
    }).then(function(result){

        rewardsToken_address = result;
        console.log("RTK Address: ", rewardsToken_address);
        return getActiveInvestorsCount();

    }).catch(function(err){
        console.log("Error in getRewardTokenAdr(): ", err.message);
    });
}

function getActiveInvestorsCount() {
    var stakeInstance;
    contracts.Staking.deployed().then(function(instance){
        stakeInstance = instance;
        return stakeInstance.activeInvestors();
    }).then(function(result){

        $('#investors_count').text(result);
        return getStakedTokensCount();

    }).catch(function(err){
        console.log("Error in getActiveInvestorsCount(): ", err.message);
    });
}

function getStakedTokensCount() {
    var stakeInstance;
    contracts.Staking.deployed().then(function(instance){
        stakeInstance = instance;
        return stakeInstance.getTotalStakedTokens();
    }).then(function(result){

        $('#staked_tokens_count').text(toEth(result));
        return getRewardRate();

    }).catch(function(err){
        console.log("Error in getStakedTokensCount(): ", err.message);
    });
}


function getRewardRate() {
    var stakeInstance;
    contracts.Staking.deployed().then(function(instance){
        stakeInstance = instance;
        return stakeInstance.rewardRate();
    }).then(function(result){

        $('#reward_rate').text(toEth(result));
        return getUserSTKBalance();

    }).catch(function(err){
        console.log("Error in getRewardRate(): ", err.message);
    });
}

function getUserSTKBalance() {
    var stkInstance;
    contracts.StakingToken.deployed().then(function(instance){
        stkInstance = instance;
        return stkInstance.balanceOf(currentAccount);
    }).then(function(result){

        $('#stk_balance').text(toEth(result));
        return getUserRTKBalance();

    }).catch(function(err){
        console.log("Error in getUserSTKBalance(): ", err.message);
    });
}

function getUserRTKBalance() {
    var rtkInstance;
    contracts.RewardsToken.deployed().then(function(instance){
        rtkInstance = instance;
        return rtkInstance.balanceOf(currentAccount);
    }).then(function(result){

        $('#rtk_balance').text(toEth(result));
        return getUserStakedTokens();

    }).catch(function(err){
        console.log("Error in getUserRTKBalance(): ", err.message);
    });
}

function getUserStakedTokens() {
    var stakeInstance;
    contracts.Staking.deployed().then(function(instance){
        stakeInstance = instance;
        return stakeInstance.getUserStakedTokens(currentAccount);
    }).then(function(result){

        $('#user_staked_tokens').text(toEth(result));
        return getUserPaidRewards();

    }).catch(function(err){
        console.log("Error in getUserStakedTokens(): ", err.message);
    });
}


function getUserPaidRewards() {
    var stakeInstance;
    contracts.Staking.deployed().then(function(instance){
        stakeInstance = instance;
        return stakeInstance.userTotalRewardPaid(currentAccount);
    }).then(function(result){

        $('#user_paid_reward').text(toEth(result));

    }).catch(function(err){
        console.log("Error in getUserPaidRewards(): ", err.message);
    });
}

function bindEvents() {
    $(document).on('click', '#stake', approveStakingToken);
    $(document).on('click', '#withdraw', withdraw);
    $(document).on('click', '#getReward', getReward);
}


function approveStakingToken() {
    if($('#stake_amount').val() === "") {
        alert("Please Fill amount!");
        return false;
    }
    var stkInstance;
    contracts.StakingToken.deployed().then(function(instance){
        stkInstance = instance;
        var amount = toWei( $('#stake_amount').val() );
        var txObj = {from: currentAccount};
        return stkInstance.approve(staking_address, amount, txObj);
    }).then(function(result){

        console.log("approveStakingToken() => ", result.receipt.status);
        return stake();

    }).catch(function(err){
        console.log("Error in approveStakingToken(): ", err.message);
    });
}

function stake() {
    var stakeInstance;
    contracts.Staking.deployed().then(function(instance){
        stakeInstance = instance;
        var amount = toWei( $('#stake_amount').val() );
        var txObj = {from: currentAccount};
        return stakeInstance.stake(amount, txObj);
    }).then(function(result){

        console.log("stake() => ", result.receipt.status);
        return populateInfo();

    }).catch(function(err){
        console.log("Error in stake(): ", err.message);
    });
}


function withdraw() {
    var stakeInstance;
    contracts.Staking.deployed().then(function(instance){
        stakeInstance = instance;
        var amount = toWei( $('#stake_amount').val() );
        var txObj = {from: currentAccount};
        return stakeInstance.withdraw(amount, txObj);
    }).then(function(result){

        console.log("withdraw() => ", result.receipt.status);
        return populateInfo();

    }).catch(function(err){
        console.log("Error in withdraw(): ", err.message);
    });
}

function getReward() {
    var stakeInstance;
    contracts.Staking.deployed().then(function(instance){
        stakeInstance = instance;
        var txObj = {from: currentAccount};
        return stakeInstance.getReward(txObj);
    }).then(function(result){

        console.log("getReward() => ", result.receipt.status);
        return populateInfo();

    }).catch(function(err){
        console.log("Error in getReward(): ", err.message);
    });
}



//////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////   Utils   ///////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

function toWei(amount) {
    var weiAmount = web3.toWei(amount.toString(), 'ether');    // 1    ----->    1,000000000000000000 ~  1 * 10**18
    return weiAmount;
}

function toEth(amount) {
    var ethAmount = web3.fromWei(amount.toString(), 'ether');  // 1,000000000000000000 ~  1 * 10**18   ------>    1
    return ethAmount;
}


//////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////   events   ///////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

function setStakeRange() {
    var slider = document.getElementById('stakeRange');
    $("#stake_amount").val(slider.value);
}