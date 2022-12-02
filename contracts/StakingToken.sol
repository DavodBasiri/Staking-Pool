// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <=0.8.10;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract StakingToken is ERC20 {

    uint public InitSupply;
    address owner;

    constructor() ERC20("Staking Token", "STK")  {
        owner = msg.sender;
        InitSupply = 6 * (10**6) * (10**uint(decimals()));
        _mint(owner, InitSupply);
        emit Transfer(address(0), owner, InitSupply);
    }
}