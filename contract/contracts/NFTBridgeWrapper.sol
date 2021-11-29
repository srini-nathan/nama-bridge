//SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "./IBridgeWrapper.sol";

/// @title NFT bridge wrapper for the EZY Exchange
/// @author Victor Feng
abstract contract NFTBridgeWrapper is IBridgeWrapper, Context, ERC721Holder, ReentrancyGuard {
    event TokenSupplied(address indexed _token, address indexed _from, address indexed _receiver, uint256[] _tokenIds, bytes _data);
    event OnTokenReceived(uint256 indexed _toChain, address indexed _from, uint256 indexed _tokenId, bytes _data);
    
     /**
     * @dev Initiate the bridge operation for some token from msg.sender.
     * The user should first call Approve method of the ERC721 token.
     * @param _token The bridged token contract address.
     * @param _receiver The address that will receive the token on the other network.
     * @param _tokenIds The IDs of the token to be transferred to the other network.
     * @param _data Must have the target chain ID and NAMA.
     */
    function wrapToken(
        IERC721 _token,
        address _receiver,
        uint256[] memory _tokenIds,
        bytes calldata _data
    ) external override {
        _wrapToken(_token, _receiver, _tokenIds, _data);
        emit TokenSupplied(address(_token), _msgSender(), _receiver, _tokenIds, _data);
    }

    /**
     * @dev Initiate the bridge operation for some token from msg.sender to msg.sender on the other side.
     * The user should first call Approve method of the ERC721 token.
     * @param _token bridged token contract address.
     * @param _tokenIds ids of token to be transferred to the other network.
     */
    function wrapToken(
        IERC721 _token,
        uint256[] memory _tokenIds,
        bytes calldata _data
    ) external override {
        _wrapToken(_token, _msgSender(), _tokenIds, _data);
        emit TokenSupplied(address(_token), _msgSender(), _msgSender(), _tokenIds, _data);
    }
    
    function getChainID() public view returns (uint256) {
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }

    /**
     * @dev Validates that the token amount is inside the limits, calls safeTransferFrom to transfer the token to the contract
     * and invokes the method to burn/lock the token and unlock/mint the token on the other network.
     * The user should first call Approve method of the ERC721 token.
     * @param _token bridge token contract address.
     * @param _receiver address that will receive the tokens on the other network.
     * @param _tokenIds ids of the token to be transferred to the other network.
     */
    function _wrapToken(
        IERC721 _token,
        address _receiver,
        uint256[] memory _tokenIds,
        bytes calldata _data
    ) internal {
        for (uint i = 0; i < _tokenIds.length; i++) {
            _token.safeTransferFrom(_msgSender(), address(this), _tokenIds[i], _data);
        }
        
        bridgeOnTokenTransfer(
            address(_token),
            _msgSender(),
            _receiver,
            _tokenIds,
            new uint256[](0)
        );
    }
    
    function bridgeOnTokenTransfer(
        address _token,
        address _from,
        address _receiver,
        uint256[] memory _tokenIds,
        uint256[] memory _values
    ) internal virtual;

    function bridgeOnTokenReceived(
        uint256 _dest,
        address _from,
        address _receiver,
        uint256 _tokenId,
        uint256[] memory _amounts
    ) internal virtual returns (bytes32 requestId);
    
    /// @dev Trigger the TokenReceived event on ERC721 received callback
    /// _operator The address which called safeTransferFrom function
    /// _from The address which previously owned the token
    /// _tokenId The NFT identifier which is being transferred
    /// _data Additional data with no specified format
    /// @return bytes4 The selector of onERC721Received
    function onERC721Received(
        address,
        address _from,
        uint256 _tokenId,
        bytes memory _data
    ) public virtual nonReentrant override returns (bytes4) {
        // TODO remove this to support multi NFTs bridging in one transaction
        emit OnTokenReceived(getChainID(), _from, _tokenId, _data);
        bridgeOnTokenReceived(
            getChainID(),
            _msgSender(),
            _msgSender(),
            _tokenId,
            new uint256[](0)
        );
        return msg.sig;
    }
}
