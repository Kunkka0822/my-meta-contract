import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { deployContracts } from "./deploy";
import { MMC, MMLand, MMMarket } from "../typechain";
import { assert } from "console";

let owner: SignerWithAddress;
let addr1: SignerWithAddress;
let addr2: SignerWithAddress;
let contracts: {
  mmc?: MMC;
  mmLand?: MMLand;
  mmMarket?: MMMarket;
} = {};

const parcelIds = ["parcel1", "parcel2", "parcel3"];

describe("Greeter", function () {
  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    contracts = await deployContracts(owner.address);
  });
  describe("MMLand", function () {
    it("Should return right name and symbol", async function () {
      expect(await contracts.mmLand?.name()).to.be.equal("MMLand");
      expect(await contracts.mmLand?.symbol()).to.be.equal("MML-1");
    });
    it("Should block non owner from minting", async function () {
      await expect(
        contracts.mmLand?.connect(addr1).mint(parcelIds, addr2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("Should be capable of minting by owner", async function () {
      await contracts.mmLand?.mint(parcelIds, addr1.address);
      const balance = await contracts.mmLand?.balanceOf(addr1.address);
      expect(balance).to.be.equal(parcelIds.length);
      for (let i = 0; i < Number(balance); i++) {
        const tokenId = await contracts.mmLand?.tokenOfOwnerByIndex(
          addr1.address,
          i
        );
        if (!tokenId) {
          throw new Error("Empty token Id");
        }
        const address = await contracts.mmLand?.ownerOf(tokenId);
        expect(address).to.be.equal(addr1.address);
      }
    });
  });
  describe("MMC", function () {
    it("Should return right name and symbol", async function () {
      expect(await contracts.mmc?.name()).to.be.equal("MyMeta Coin");
      expect(await contracts.mmc?.symbol()).to.be.equal("MMC");
    });
  });
  describe("MMMarket", function () {
    beforeEach(async function () {
      await contracts.mmLand?.mint(parcelIds, owner.address);
      const balance = await contracts.mmLand?.balanceOf(owner.address);
      for (let i = 0; i < Number(balance); i++) {
        const tokenId = await contracts.mmLand?.tokenOfOwnerByIndex(
          owner.address,
          i
        );
        if (!tokenId) {
          throw new Error("Empty token Id");
        }
        await contracts.mmLand?.approve(contracts.mmMarket!.address, tokenId);
      }
      const tokenId = await contracts.mmLand?.tokenOfOwnerByIndex(
        owner.address,
        0
      );
      if (!tokenId) {
        throw new Error("Empty token Id");
      }
      await contracts.mmMarket!.listItem(
        contracts.mmLand!.address,
        tokenId,
        100
      );
      await contracts.mmMarket?.checkListed(
        contracts.mmLand!.address,
        tokenId!
      );
    });
    it("Should cancel listing on market place", async function () {
      const tokenId = await contracts.mmLand?.tokenOfOwnerByIndex(
        owner.address,
        0
      );
      const tokenId2 = await contracts.mmLand?.tokenOfOwnerByIndex(
        owner.address,
        1
      );
      await expect(
        contracts.mmMarket!.cancelListing(contracts.mmLand!.address, tokenId2!)
      ).to.be.revertedWith("This item is not listed yet");

      await expect(
        contracts.mmMarket!.cancelListing(contracts.mmLand!.address, tokenId!)
      )
        .to.emit(contracts.mmMarket!, "ItemCanceled")
        .withArgs(owner.address, contracts.mmLand!.address, tokenId);
    });
    it("Should be capable of updating listed item", async function () {
      const tokenId = await contracts.mmLand?.tokenOfOwnerByIndex(
        owner.address,
        0
      );
      await expect(
        contracts.mmMarket?.updateListing(
          contracts.mmLand!.address,
          tokenId!,
          150
        )
      )
        .to.emit(contracts.mmMarket!, "ItemListed")
        .withArgs(owner.address, contracts.mmLand!.address, tokenId, 150);
      const listing = await contracts.mmMarket?.getListing(
        contracts.mmLand!.address,
        tokenId!
      );
      expect(listing?.price).to.be.equal(150);
    });
  });
});
