// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IExofiInterfaceMulticall
{
    struct Call {
        address target;
        uint256 gasLimit;
        bytes callData;
    }

    struct Result {
        bool success;
        uint256 gasUsed;
        bytes returnData;
    }

    function getCurrentBlockTimestamp() external view returns (uint256 timestamp);
    function getEthBalance(address addr) external view returns (uint256 balance);
    function multicall(Call[] memory calls) external returns (uint256 blockNumber, Result[] memory returnData);
}

/// @notice A fork of Multicall2 specifically tailored for the Exofi Interface
contract ExofiInterfaceMulticall is IExofiInterfaceMulticall {
    function getCurrentBlockTimestamp() override
        public
        view
        returns (uint256 timestamp)
    {
        timestamp = block.timestamp;
    }

    function getEthBalance(address addr) override public view returns (uint256 balance) {
        balance = addr.balance;
    }

    function multicall(
        Call[] memory calls
    ) override public returns (uint256 blockNumber, Result[] memory returnData) {
        blockNumber = block.number;
        returnData = new Result[](calls.length);
        for (uint256 i = 0; i < calls.length; i++) {
            (address target, uint256 gasLimit, bytes memory callData) = (
                calls[i].target,
                calls[i].gasLimit,
                calls[i].callData
            );
            uint256 gasLeftBefore = gasleft();
            (bool success, bytes memory ret) = target.call{gas: gasLimit}(
                callData
            );
            uint256 gasUsed = gasLeftBefore - gasleft();
            returnData[i] = Result(success, gasUsed, ret);
        }
    }
}
