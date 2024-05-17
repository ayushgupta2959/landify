const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Escrow", () => {
  let seller, inspector, lender, escrow, landify;

  beforeEach(async () => {
    [seller, inspector, lender] = await ethers.getSigners();

    // Deploy Landify
    const Landify = await ethers.getContractFactory("Landify");
    landify = await Landify.deploy();

    // Mint
    let transaction = await landify
      .connect(seller)
      .mint(
        "https://ipfs.io/ipfs/QmQUozrHLAusXDxrvsESJ3PYB3rUeUuBAvVWw6nop2uu7c/1.png"
      );
    await transaction.wait();

    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(
      lender.address,
      inspector.address,
      seller.address,
      landify.address
    );
  });
  describe("Deployment", () => {
    it("returns nft address", async () => {
      expect(await escrow.nftAddress()).to.be.equal(landify.address);
    });
    it("returns seller address", async () => {
      expect(await escrow.seller()).to.be.equal(seller.address);
    });
    it("returns lender address", async () => {
      expect(await escrow.lender()).to.be.equal(lender.address);
    });
    it("returns inspector address", async () => {
      expect(await escrow.inspector()).to.be.equal(inspector.address);
    });
  });
});
