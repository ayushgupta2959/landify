const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

describe("Escrow", () => {
  let buyer, seller, inspector, lender, escrow, landify;
  const tokenId = 1;
  const purchasePrice = tokens(10);
  const escrowAmount = tokens(5);
  const lenderAmount = tokens(5);

  beforeEach(async () => {
    [buyer, seller, inspector, lender] = await ethers.getSigners();

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

    transaction = await landify
      .connect(seller)
      .approve(escrow.address, tokenId);
    await transaction.wait();

    transaction = await escrow
      .connect(seller)
      .list(tokenId, buyer.address, purchasePrice, escrowAmount);
    await transaction.wait();
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

  describe("Listing", () => {
    it("Updated as listed", async () => {
      expect(await escrow.isListed(tokenId)).to.be.equal(true);
    });

    it("Update ownership", async () => {
      expect(await landify.ownerOf(tokenId)).to.be.equal(escrow.address);
    });

    it("Returns buyer", async () => {
      expect(await escrow.buyer(tokenId)).to.be.equal(buyer.address);
    });

    it("Returns purchase price", async () => {
      expect(await escrow.purchasePrice(tokenId)).to.be.equal(purchasePrice);
    });

    it("Returns escrow amount", async () => {
      expect(await escrow.escrowAmount(tokenId)).to.be.equal(escrowAmount);
    });
  });

  describe("Deposits", () => {
    it("Update contract balance", async () => {
      const transaction = await escrow
        .connect(buyer)
        .depositEarnest(tokenId, { value: escrowAmount });
      await transaction.wait();

      expect(await escrow.getBalance()).to.be.equal(escrowAmount);
    });
  });

  describe("Inspection", () => {
    it("Update inspection status", async () => {
      const transaction = await escrow
        .connect(inspector)
        .updateInspectionStatus(tokenId, true);
      await transaction.wait();

      expect(await escrow.inspectionStatus(tokenId)).to.be.equal(true);
    });
  });

  describe("Approval", () => {
    it("Update approval status", async () => {
      let transaction = await escrow.connect(buyer).approveSale(tokenId);
      await transaction.wait();

      transaction = await escrow.connect(seller).approveSale(tokenId);
      await transaction.wait();

      transaction = await escrow.connect(lender).approveSale(tokenId);
      await transaction.wait();

      expect(await escrow.approval(tokenId, buyer.address)).to.be.equal(true);
      expect(await escrow.approval(tokenId, seller.address)).to.be.equal(true);
      expect(await escrow.approval(tokenId, lender.address)).to.be.equal(true);
    });
  });

  describe("Sale", () => {
    beforeEach(async () => {
      let transaction = await escrow
        .connect(buyer)
        .depositEarnest(tokenId, { value: escrowAmount });
      await transaction.wait();

      transaction = await escrow
        .connect(inspector)
        .updateInspectionStatus(tokenId, true);
      await transaction.wait();

      transaction = await escrow.connect(buyer).approveSale(tokenId);
      await transaction.wait();

      transaction = await escrow.connect(seller).approveSale(tokenId);
      await transaction.wait();

      transaction = await escrow.connect(lender).approveSale(tokenId);
      await transaction.wait();

      transaction = await escrow
        .connect(lender)
        .depositLenderAmount(tokenId, { value: lenderAmount });
      await transaction.wait();

      transaction = await escrow.connect(seller).finalizeSale(tokenId);
      await transaction.wait();
    });

    it("update ownership", async () => {
      expect(await landify.ownerOf(tokenId)).to.be.equal(buyer.address);
    });

    it("update balance", async () => {
      expect(await escrow.getBalance()).to.be.equal(0);
    });
  });
});
