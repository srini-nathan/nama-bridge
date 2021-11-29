//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IBridgeWrapper {
    function wrapToken(
        IERC721 _token,
        address _receiver,
        uint256[] memory _tokenIds,
        bytes calldata _data
    ) external;
    
    function wrapToken(
        IERC721 _token,
        uint256[] memory _tokenIds,
        bytes calldata _data
    ) external;
}
