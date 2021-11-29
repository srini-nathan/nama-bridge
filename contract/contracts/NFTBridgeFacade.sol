//SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

import "./NFTBridgeWrapper.sol";


/// @title The NFT bridge facade for the EZY Exchange
/// @author Victor Feng
contract NFTBridgeFacade is NFTBridgeWrapper, ChainlinkClient {
    using Chainlink for Chainlink.Request;

    struct BridgeRequest {
        bytes32 _requestId;
        bytes32 _cid;
    }
    
    event TokenRedeemed(address indexed _token, address indexed _redeemer, address indexed _receiver, uint256[] _tokenIds, uint256[] _amounts);
    event TokenBridged(bytes32 indexed _requestId, bytes32 indexed _cid);

    address private oracle;
    bytes32 private jobId;
    uint256 private fee;
    mapping(address => mapping(uint256 => BridgeRequest)) public requests;

    constructor() {
        setPublicChainlinkToken();
        oracle = 0xc57B33452b4F7BB189bB5AfaE9cc4aBa1f7a4FD8;
        jobId = "d5270d1c311941d0b08bead21fea7747";
        fee = 0.1 * 10 ** 18; // (Varies by network and job)
    }

    /**
     * @dev Redeem a list of NFTs by token IDs to a specified recipient
     * @param _token The token contract address
     * @param _receiver The recipient
     * @param _tokenIds The list of tokens being transferred
     * @param _amounts Amounts of tokens, should be empty for ERC721
     */
    function redeemToken(
        address _token,
        address _receiver,
        uint256[] calldata _tokenIds,
        uint256[] memory _amounts
    ) external {
        require(_token != address(0), "NFTBridgeFacade#redeem: token address cannot be zero");
        require(_amounts.length == 0, "NFTBridgeFacade#redeem: ERC1155 is not supported yet");
        
        for (uint i = 0; i < _tokenIds.length; i++) {
            IERC721(_token).safeTransferFrom(address(this), _receiver, _tokenIds[i]);
        }
        
        emit TokenRedeemed(_token, _msgSender(), _receiver, _tokenIds, _amounts);
    }
    
    /**
     * @dev Redeem a list of NFTs by token IDs to msg sender
     * @param _token The token contract address
     * @param _tokenIds The list of tokens being transferred
     * @param _amounts Amounts of tokens, should be empty for ERC721
     */
    function redeemToken(
        address _token,
        uint256[] calldata _tokenIds,
        uint256[] memory _amounts
    ) external {
        require(_token != address(0), "NFTBridgeFacade#redeem: token address cannot be zero");
        require(_amounts.length == 0, "NFTBridgeFacade#redeem: ERC1155 is not supported yet");
        
        for (uint i = 0; i < _tokenIds.length; i++) {
            IERC721(_token).safeTransferFrom(address(this), _msgSender(), _tokenIds[i]);
        }
        
        emit TokenRedeemed(_token, _msgSender(), _msgSender(), _tokenIds, _amounts);
    }

    /**
     * TODO The bridged token should be burned
     * @dev fulfill chainlink Oracle.
     * @param _requestId The chainlink Oracle request ID
     * @param _cid The IPFS CID that saves the transfer details
     */
    function fulfill(bytes32 _requestId, bytes32 _cid) public recordChainlinkFulfillment(_requestId) {
        emit TokenBridged(_requestId, _cid);
    }
    
    /**
     * Call Chainlink External Adapter
     * @dev Executes action on deposit of ERC721 token.
     * @param _token address of the ERC721 token contract.
     * @param _from address of token sender.
     * @param _receiver address of token receiver on the other side.
     * @param _tokenIds unique ids of the bridged tokens.
     * @param _amounts amounts of bridged tokens. Should be empty list for ERC721.
     */
    function bridgeOnTokenTransfer(
        address _token,
        address _from,
        address _receiver,
        uint256[] memory _tokenIds,
        uint256[] memory _amounts
    ) internal override {
    }

    /**
     * Call Chainlink External Adapter
     * @dev Executes action on deposit of ERC721 token.
     * @param _dest uint256 The destination of this bridge
     * @param _from address of token sender.
     * @param _receiver address of token receiver on the other side.
     * @param _tokenId unique id of the bridged ERC721 token.
     * @param _amounts amounts of bridged tokens. Should be empty list for ERC721.
     */
    function bridgeOnTokenReceived(
        uint256 _dest,
        address _from,
        address _receiver,
        uint256 _tokenId,
        uint256[] memory _amounts
    ) internal override returns (bytes32 requestId) {
        Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.fulfill.selector);
        
        request.add("targetChain", Strings.toString(_dest));
        request.add("tokenId", Strings.toString(_tokenId));
        
        return sendChainlinkRequestTo(oracle, request, fee);
    }
}
