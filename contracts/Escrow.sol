//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}

contract Escrow {
    address public lender;
    address public inspector;
    address payable public seller;
    address public nftAddress;

    constructor(address _lender, address _inspectror, address payable _seller, address _nftAddress) {
        lender = _lender;
        inspector = _inspectror;
        seller = _seller;
        nftAddress = _nftAddress;
    }
}
