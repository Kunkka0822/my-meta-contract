import { ethers } from "hardhat";
import { MMC, MMLand, MMMarket } from "../typechain";

const baseTokenUri = "https://mymeta.s3.amazonaws.com/images/";

export const deployContracts = async (
  ownerAddress: string
): Promise<{ mmLand: MMLand; mmc: MMC; mmMarket: MMMarket }> => {
  const MMLandFactory = await ethers.getContractFactory("MMLand");
  const mmLand = await MMLandFactory.deploy(ownerAddress, baseTokenUri);

  const MMCFactory = await ethers.getContractFactory("MMC");
  const mmc = await MMCFactory.deploy("MyMeta Coin", "MMC");

  const MMMarketFactory = await ethers.getContractFactory("MMMarket");
  const mmMarket = await MMMarketFactory.deploy(mmc.address);

  return { mmLand, mmc, mmMarket };
};
