// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract Staking {

    address public owner;

    // توکن سپرده گذاری
    IERC20 public stakingToken;

    // توکن سوددهی
    IERC20 public rewardsToken;

    // نرخ سود - پارامتر تنظیم میزان "سود به ازای هر توکن" قابل پرداخت به سپرده گذار
    uint public rewardRate = 3*10**13;

    /*
        آخرین لحظه بروزرسانی

        این متغیر قبل از انجام عملیات زیر باید بروزرسانی شود
            1- stake() - سپرده گذاری
            2- withdraw() - برداشت سپرده
            3- getReward() - برداشت سود
    */
    uint public lastUpdateTime;

    // "سود به ازای هر توکن" سیستم از آخرین لحظه بروزرسانی تا این لحظه
    uint public rewardPerTokenStored;

    // تعداد سرمایه گذارانی که حساب سپرده آنها خالی نیست
    uint public activeInvestors;

    // تعداد کل توکن های استیک شده در سیستم
    uint private _totalSupply;


    // "سود به ازای هر توکن" سرمایه گذاران از آخرین لحظه بروزرسانی تا این لحظه
    mapping(address => uint) public userRewardPerTokenPaid;

    // تعداد کل توکن های پاداش پرداخت شده به سرمایه گذار از لحظه شروع سرمایه گذاری تا کنون
    mapping(address => uint) public userTotalRewardPaid;

    // کل سود" پرداخت نشده سرمایه گذار از آخرین لحظه بروزرسانی تا این لحظه"
    mapping(address => uint) public rewards;

    // تعداد توکن های استیک شده سرمایه گذار
    mapping(address => uint) private _balances;


    // دریافت آدرس توکن های سپرده و سوددهی به عنوان ورودی سازنده کانترکت
    constructor(address _stakingToken, address _rewardsToken) {

        owner = msg.sender;

        // توکن سپرده گذاری
        stakingToken = IERC20(_stakingToken);
        // توکن سوددهی
        rewardsToken = IERC20(_rewardsToken);
    }


    //////////////////////////////////////////////////////////////////////////////////
    //                           Stake - سپرده گذاشتن                              //
    //////////////////////////////////////////////////////////////////////////////////

    // سپرده گذاری در سیستم توسط سرمایه گذار
    function stake(uint _amount) external updateReward(msg.sender) {
        
        // وقتی شخصی با سپرده خالی در حال سپرده گذاری باشد یعنی یک نفر به سپرده گذاران فعال اضافه می شود
        if(_balances[msg.sender] == 0)
            activeInvestors++;

        // بروزرسانی تعداد کل توکن های استیک شده
        _totalSupply += _amount;

        // بروزرسانی تعداد توکن های سرمایه گذار فعلی
         _balances[msg.sender] += _amount;   


        // انتقال توکن های سرمایه گذار به حساب کانترکت استیکینگ
        // برای انجام این کار باید ابتدا از توکن استیکینگ کاربر مجوز دریافت کنیم - 
        // StakingToken.approve(stakingArd, _amount)
        stakingToken.transferFrom(msg.sender, address(this), _amount);
    }


    // بروزرسانی مقادیر سیستم از آخرین لحظه بروزرسانی تا این لحظه
    modifier updateReward(address account) {

        // بروزرسانی "سود به ازای هر توکن" سیستم از آخرین لحظه بروزرسانی تا این لحظه
        rewardPerTokenStored = rewardPerToken();

        // مقدار جدید آخرین تایم بروزرسانی
        lastUpdateTime = block.timestamp;

        // "کل سود" پرداخت نشده سرمایه گذار از آخرین لحظه بروزرسانی تا این لحظه
        rewards[account] = earned(account);

        // "سود به ازای هر توکن" پرداخت شده به سرمایه گذار تا این لحظه
        userRewardPerTokenPaid[account] = rewardPerTokenStored;

        // شروع بدنه فانکشن فراخوانی کننده
        _;
    }


    // محاسبه "سود به ازای هر توکن" سیستم از آخرین لحظه بروزرسانی تا این لحظه
    function rewardPerToken() public view returns(uint) {
        
        if(_totalSupply == 0) {
            return 0;
        }

        return rewardPerTokenStored + ( ( (block.timestamp - lastUpdateTime) * rewardRate * 1e18 ) / _totalSupply );
    }


    // کل سود پرداخت نشده سرمایه گذار از آخرین لحظه بروزرسانی تا این لحظه
    function earned(address account) public view returns(uint) {
        
        return ( rewards[account] + ( _balances[account] * (rewardPerToken() - userRewardPerTokenPaid[account] ) ) / 1e18 );
    }



    //////////////////////////////////////////////////////////////////////////////////
    //                          withdraw - برداشت اصل سپرده                        //
    //////////////////////////////////////////////////////////////////////////////////

    // برداشت کل یا مقداری از توکن های استیک شده سرمایه گذار
    function withdraw(uint _amount) public updateReward(msg.sender) {

        // بررسی کافی بودن موجودی کاربر
        require( _balances[msg.sender] >= _amount, "withdraw: Not enough balance!");

        // کم کردن از تعداد توکن های استیک شده در سیستم
        _totalSupply -= _amount;

        // بروزرسانی تعداد توکن های استیک شده سرمایه گذار فعلی
        _balances[msg.sender] -= _amount;

        // برداشت و انتقال توکن های استیک از کانترکت استیکینگ به حساب سرمایه گذار
        stakingToken.transfer(msg.sender, _amount);

        // وقتی که سپرده سرمایه گذار صفر می شود یعنی یک نفر از سپرده گذاران فعال کم میشود
        if(_balances[msg.sender] == 0)
            activeInvestors--;
    }


    //////////////////////////////////////////////////////////////////////////////////
    //                         getReward - برداشت سود                              //
    //////////////////////////////////////////////////////////////////////////////////

    // برداشت "کل سود" پرداخت نشده سرمایه گذار تا کنون
    function getReward() public updateReward(msg.sender) {

        // بررسی صفر نبودن سود قابل پرداخت کاربر
        require(rewards[msg.sender] > 0, "getReward: you don't have any reward!");
        
        // "کل سود" پرداخت نشده سرمایه گذار از آخرین لحظه بروزرسانی تا این لحظه
        uint reward = rewards[msg.sender];

        // صفر کردن "کل سود" پرداخت نشده سرمایه گذار از آخرین لحظه بروزرسانی تا این لحظه
        rewards[msg.sender] = 0;

        // برداشت و انتقال توکن سوددهی به مقدار ریوارد از حساب کانترکت به حساب سرمایه گذار
        rewardsToken.transfer(msg.sender, reward*80/100);

        // دریافت 2 درصد کارمزد
        rewardsToken.transfer(owner, reward*2/100);

        // بروزرسانی تعدد کل توکن های پرداخت شده به سرمایه گذار از لحظه شروع سرمایه گذاری تا کنون
        userTotalRewardPaid[msg.sender] += reward;
    }



    //////////////////////////////////////////////////////////////////////////////////
    //                            Exit - بستن قرارداد                              //
    //////////////////////////////////////////////////////////////////////////////////

    // خروج از سیستم/قرارداد سوددهی با برداشت کل اصل سپرده و کل سود سرمایه گذاری تا کنون
    function exit() external {

        // برداشت کل اصل سرمایه
        withdraw(_balances[msg.sender]);
  
        // برداشت "کل سود سرمایه گذاری" تا کنون
        getReward();   
    }


    //////////////////////////////////////////////////////////////////////////////////
    //                           Other Functions                                    //
    //////////////////////////////////////////////////////////////////////////////////

    // آدرس کانترکت استیکینگ
    function getAddress() public view returns(address) {
        return address(this);
    }


    // تعداد کل توکن های استیک شده سیستم
    function getTotalStakedTokens() public view returns(uint) {
        return _totalSupply;
    }


    // تعداد کل توکن های استیک شده سرمایه گذار
    function getUserStakedTokens(address account) public view returns(uint) {
        return _balances[account];
    }
}