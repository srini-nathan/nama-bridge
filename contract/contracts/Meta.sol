// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";


contract Meta is ERC721URIStorage, Ownable {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    constructor(
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) {
    }

    /// TODO add contraints to only allow validators to execute
    function mint(string memory _tokenURI) external payable returns (uint256) {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(_msgSender(), newItemId);
        _setTokenURI(newItemId, _tokenURI);

        return newItemId;
    }

    function safeTransfer(address _to, uint256 _tokenId) external {
      safeTransferFrom(msg.sender, _to, _tokenId);
    }

    // withdraw remaining balance to the specified _beneficiary if it's not zero address,
    // otherwise, send the balance to the contract owner
    function withdraw(address _beneficiary) public onlyOwner {
        uint256 _balance = address(this).balance;
        require(_balance > 0, "#withdraw: no available balance");
        
        if (_beneficiary != address(0)) {
            require(payable(_beneficiary).send(_balance));
        } else {
            require(payable(msg.sender).send(_balance));
        }
    }
}
