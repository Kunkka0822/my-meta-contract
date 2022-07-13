//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MMC is ERC20 {
  constructor(string memory name, string memory symbol) ERC20(name, symbol) {}
}
