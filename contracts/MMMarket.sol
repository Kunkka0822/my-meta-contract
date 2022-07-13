//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract MMMarket is ReentrancyGuard {
  event ItemCanceled(
    address indexed seller,
    address indexed nftAddress,
    uint256 indexed tokenId
  );

  event ItemBought(
    address indexed buyer,
    address indexed nftAddress,
    uint256 indexed tokenId,
    uint256 price
  );
  event ItemListed(
    address indexed seller,
    address indexed nftAddress,
    uint256 indexed tokenId,
    uint256 price
  );

  struct Listing {
    uint256 price;
    address seller;
  }

  mapping(address => mapping(uint256 => Listing)) private _listings;
  address private _mmcAddress;

  modifier notListed(
    address nftAddress,
    uint256 tokenId,
    address owner
  ) {
    require(!checkListed(nftAddress, tokenId), "Already listed");
    _;
  }
  modifier isOwner(
    address nftAddress,
    uint256 tokenId,
    address spender
  ) {
    IERC721 nft = IERC721(nftAddress);
    address owner = nft.ownerOf(tokenId);
    require(spender == owner, "You are not owner");
    _;
  }

  modifier isListed(address nftAddress, uint256 tokenId) {
    require(checkListed(nftAddress, tokenId), "This item is not listed yet");
    _;
  }

  constructor(address mmcAddress) {
    _mmcAddress = mmcAddress;
  }

  function checkListed(address nftAddress, uint256 tokenId)
    public
    view
    returns (bool)
  {
    Listing memory listing = _listings[nftAddress][tokenId];
    return listing.price > 0;
  }

  function listItem(
    address nftAddress,
    uint256 tokenId,
    uint256 price
  )
    external
    notListed(nftAddress, tokenId, msg.sender)
    isOwner(nftAddress, tokenId, msg.sender)
  {
    require(price > 0, "Price should be positive");
    IERC721 nft = IERC721(nftAddress);

    require(nft.getApproved(tokenId) == address(this), "Not approved contract");

    _listings[nftAddress][tokenId] = Listing(price, msg.sender);
    emit ItemListed(msg.sender, nftAddress, tokenId, price);
  }

  function cancelListing(address nftAddress, uint256 tokenId)
    external
    isOwner(nftAddress, tokenId, msg.sender)
    isListed(nftAddress, tokenId)
  {
    delete (_listings[nftAddress][tokenId]);
    emit ItemCanceled(msg.sender, nftAddress, tokenId);
  }

  function buyItem(address nftAddress, uint256 tokenId)
    external
    isListed(nftAddress, tokenId)
    nonReentrant
  {
    Listing memory listedItem = _listings[nftAddress][tokenId];
    IERC20 mmc = IERC20(_mmcAddress);
    uint256 balance = mmc.balanceOf(msg.sender);

    require(balance >= listedItem.price, "Not enough MMC");

    mmc.transfer(listedItem.seller, listedItem.price);
    delete (_listings[nftAddress][tokenId]);
    IERC721(nftAddress).safeTransferFrom(
      listedItem.seller,
      msg.sender,
      tokenId
    );
    emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
  }

  function updateListing(
    address nftAddress,
    uint256 tokenId,
    uint256 newPrice
  )
    external
    isListed(nftAddress, tokenId)
    nonReentrant
    isOwner(nftAddress, tokenId, msg.sender)
  {
    require(newPrice > 0, "Price should be positive");
    _listings[nftAddress][tokenId].price = newPrice;
    emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
  }

  function getListing(address nftAddress, uint256 tokenId)
    external
    view
    returns (Listing memory)
  {
    return _listings[nftAddress][tokenId];
  }
}
