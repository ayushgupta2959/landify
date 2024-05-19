// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
/* eslint-disable no-undef */
const hre = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

async function main() {
  //Setup accounts
  const [buyer, seller, inspector, lender] = await ethers.getSigners();

  const Landify = await ethers.getContractFactory("Landify");
  const landify = await Landify.deploy();
  await landify.deployed();

  console.log("Landify deployed to:", landify.address);

  console.log("Minting token...");
  for (let i = 1; i < 4; ++i) {
    const transaction = await landify
      .connect(seller)
      .mint(
        `https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${i}.json`
      );

    await transaction.wait();
  }

  // Deploy Escrow
  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(
    lender.address,
    inspector.address,
    seller.address,
    landify.address
  );
  await escrow.deployed();

  for (let i = 1; i < 4; ++i) {
    // Approve properties
    let transaction = await landify.connect(seller).approve(escrow.address, i);
    await transaction.wait();

    // Listing properties
    transaction = await escrow
    .connect(seller)
    .list(i, buyer.address, tokens("10"), tokens("5"));
  }

  console.log("Listing done");
  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
