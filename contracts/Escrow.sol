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

    modifier onlySeller() {
        require(msg.sender == seller, 'Only seller can call this function');
        _;
    }

    modifier onlyBuyer(uint256 _nftId) {
        require(msg.sender == buyer[_nftId], 'Only buyer can call this function');
        _;
    }

    modifier onlyInspector() {
        require(msg.sender == inspector, 'Only inspector can call this function');
        _;
    }

    modifier onlyLender() {
        require(msg.sender == lender, 'Only lender can call this function');
        _;
    }

    mapping(uint256 => bool) public isListed;
    mapping(uint256 => uint256) public purchasePrice;
    mapping(uint256 => uint256) public escrowAmount;
    mapping(uint256 => address) public buyer;
    mapping(uint256 => bool) public inspectionStatus;
    mapping(uint256 => mapping(address => bool)) public approval;

    constructor(address _lender, address _inspector, address payable _seller, address _nftAddress) {
        lender = _lender;
        inspector = _inspector;
        seller = _seller;
        nftAddress = _nftAddress;
    }

    function list(uint256 _nftId, address _buyer, uint256 _purchasePrice, uint256 _escrowAmount) public payable onlySeller {
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftId);

        isListed[_nftId] = true;
        purchasePrice[_nftId] = _purchasePrice;
        escrowAmount[_nftId] = _escrowAmount;
        buyer[_nftId] = _buyer;
    }

    function depositEarnest(uint256 _nftId) public payable onlyBuyer(_nftId) {
        require(isListed[_nftId], 'NFT not listed');
        require(msg.value >= escrowAmount[_nftId], 'Invalid escrow amount');
    }

    function depositLenderAmount(uint256 _nftId) public payable onlyLender{
        require(isListed[_nftId], 'NFT not listed');
        require(msg.value >= address(this).balance - purchasePrice[_nftId], 'Invalid purchase price');
    }

    function reveive() external payable {}

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function updateInspectionStatus(uint256 _nftId, bool _status) public onlyInspector {
        inspectionStatus[_nftId] = _status;
    }

    function approveSale(uint256 _nftId) public {
        approval[_nftId][msg.sender] = true;
    }

    function finalizeSale(uint256 _nftId) public {
        require(inspectionStatus[_nftId], 'Inspection not completed');
        require(approval[_nftId][buyer[_nftId]], 'Buyer not approved');
        require(approval[_nftId][seller], 'Seller not approved');
        require(approval[_nftId][lender], 'Lender not approved');
        require(address(this).balance >= purchasePrice[_nftId], 'Balance not enough');

        (bool success, ) = payable(seller).call{value: address(this).balance}("");
        require(success, 'Transfer failed');

        IERC721(nftAddress).transferFrom(address(this), buyer[_nftId], _nftId);
        isListed[_nftId] = false;
    }

    function cancelSale(uint256 _nftId) public {
        if (inspectionStatus[_nftId] == false) {
            payable(buyer[_nftId]).transfer(address(this).balance);
        } else {
            payable(seller).transfer(address(this).balance);
        }
    }
}
