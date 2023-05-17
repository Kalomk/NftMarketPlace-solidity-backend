// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';

error NFTMarketPlace__CannotSellZeroPrice();
error NFTMarketPlace__NFTCannotApproved();
error NFTMarketPlace__AlreadyListed();
error NFTMarketPlace__NotAOwner();
error NFTMarketPlace__NotListed();
error NFTMarketPlace__NotEnougMoneyToMintNft();
error NFTMarketPlace__CannotWithdrawZeroEth();
error NFTMarketPlace__TransferedFail();

contract NFTMarketPlace {
    //Structs
    struct Listing{
    address seller;
    uint256 price;
    }

    //Modifier
    modifier NotListed(address NftAddress,uint256 tokenId,address owner
    ) {
        Listing memory listing = s_listings[NftAddress][tokenId];
        if(listing.price > 0){
            revert NFTMarketPlace__AlreadyListed();
        }
        _;

    }

    modifier IsOwner(address NftAddress,uint256 tokenId,address spender)
    {
         IERC721 nft = IERC721(NftAddress);
         address owner = nft.ownerOf(tokenId);
         if(spender != owner){
            revert NFTMarketPlace__NotAOwner();
         }

        _;
    }

    modifier IsListed(address nftAdress,uint256 tokenId) {
        Listing memory listing = s_listings[nftAdress][tokenId];
        if(listing.price <= 0){
            revert NFTMarketPlace__NotListed();
        }
        _;
    }
    ///Events
    event ItemListed(address indexed NftAddress, address indexed sender, uint256 tokenId, uint256 price);
    event ItemBought(address indexed NftAddress, address indexed sender, uint256 tokenId, uint256 price);
    event ItemCanceled(address NftAddress,uint256 tokenId);
    event ItemUpdate(address NftAddress,uint256 tokenId,uint256 newPrice);
    //variables
    mapping (address => mapping(uint256 => Listing)) private s_listings;
    mapping (address => uint256) private s_proceed;

    function listItem (
    address NftAddress,
    uint256 tokenId,
    uint256 price
    )external
    NotListed(NftAddress,tokenId,msg.sender)
    IsOwner(NftAddress,tokenId,msg.sender)
    {

       if(price <= 0){
        revert NFTMarketPlace__CannotSellZeroPrice();
         }

       IERC721 nft = IERC721(NftAddress);
       if(nft.getApproved(tokenId) != address(this)){
        revert NFTMarketPlace__NFTCannotApproved();
       }

       s_listings[NftAddress][tokenId] = Listing(msg.sender,price);
       emit ItemListed(NftAddress,msg.sender,tokenId,price);
    }

    function buyItem(address NftAddress,uint256 tokenId) external payable 
    IsListed(NftAddress,tokenId)
    {
        Listing memory itemListed  = s_listings[NftAddress][tokenId];

        if(msg.value < itemListed.price){
            revert NFTMarketPlace__NotEnougMoneyToMintNft();
        }
        s_proceed[itemListed.seller] = s_proceed[itemListed.seller] + msg.value;
        delete(s_listings[NftAddress][tokenId]);

        IERC721(NftAddress).safeTransferFrom(itemListed.seller,msg.sender,tokenId);

        emit ItemBought(NftAddress,msg.sender,tokenId,itemListed.price);
    }

    function ListingCancel(address NftAddress,uint256 tokenId) external 
    IsOwner(NftAddress,tokenId,msg.sender)
    IsListed(NftAddress,tokenId)
    {
        delete(s_listings[NftAddress][tokenId]);
        emit ItemCanceled(NftAddress,tokenId);
    }

    function ListingUpdate(address NftAddress,uint256 tokenId,uint256 newPrice) external 
    IsOwner(NftAddress,tokenId,msg.sender)
    IsListed(NftAddress,tokenId){
        s_listings[NftAddress][tokenId].price = newPrice;
        emit ItemUpdate(NftAddress,tokenId,newPrice);
    }

    function withdrawProceeds() external {
        uint256 proceed =  s_proceed[msg.sender];

        if(proceed <= 0){
            revert NFTMarketPlace__CannotWithdrawZeroEth();
        }

        s_proceed[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value:proceed}('');

        if(!success){
            revert NFTMarketPlace__TransferedFail();
        }
    }


    function getListed(address NftAddress, uint256 tokenId) external view returns(Listing memory){
        return s_listings[NftAddress][tokenId];
    }

    function getProceed(address seller) external view returns (uint256){
        return s_proceed[seller];
    }
}