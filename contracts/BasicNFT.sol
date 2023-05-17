// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract BasicNFT is ERC721{
    uint256 public s_tokenCounter;
    string constant public TOKEN_URI = "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json";

    constructor() ERC721("Dogie", "DOG") {
        s_tokenCounter = 0;
    }

      function _mintNFT() public returns(uint256)  {
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter += 1;
        return s_tokenCounter;
    }

    function getTokenCounter() public view returns(uint256){
        return s_tokenCounter;
    }

    function tokenURI(/*tokenId*/ uint256) public view override returns(string memory){
        return TOKEN_URI;
    }
}