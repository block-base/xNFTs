// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./xNativeBridge.sol";

abstract contract xNativeNFT is xNativeBridge {
  function xSend() public {}

  function xReceive() public onlyExecutor {}
}
