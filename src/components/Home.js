import { useEffect, useState } from "react";

import close from "../assets/close.svg";

const Home = ({ home, provider, account, escrow, togglePop }) => {
  const [buyer, setBuyer] = useState(null);
  const [lender, setLender] = useState(null);
  const [seller, setSeller] = useState(null);
  const [inspector, setInspector] = useState(null);
  const [owner, setOwner] = useState(null);
  const [hasBought, setHasBought] = useState(false);
  const [hasLended, setHasLended] = useState(false);
  const [hasSold, setHasSold] = useState(false);
  const [hasInspected, setHasInspected] = useState(false);

  const fetchDetails = async () => {
    const buyer = await escrow.buyer(home.id);
    setBuyer(buyer);
    const hasBought = await escrow.approval(home.id, buyer);
    setHasBought(hasBought);

    const lender = await escrow.lender();
    setLender(lender);
    const hasLended = await escrow.approval(home.id, lender);
    setHasLended(hasLended);

    const seller = await escrow.seller();
    setSeller(seller);
    const hasSold = await escrow.approval(home.id, seller);
    setHasSold(hasSold);

    const inspector = await escrow.inspector();
    setInspector(inspector);
    const hasInspected = await escrow.inspectionStatus(home.id);
    setHasInspected(hasInspected);
  };

  const fetchOwner = async () => {
    const isListed = await escrow.isListed(home.id);
    if (isListed) {
      return;
    }
    const owner = await escrow.buyer(home.id);
    setOwner(owner);
  };

  const buyHandler = async () => {
    const escrowAmount = await escrow.escrowAmount(home.id);
    const signer = provider.getSigner();

    let transaction = await escrow
      .connect(signer)
      .depositEarnest(home.id, { value: escrowAmount });
    await transaction.wait();

    transaction = await escrow.connect(signer).approveSale(home.id);
    await transaction.wait();

    setHasBought(true);
  };

  const lendHandler = async () => {
    debugger;
    const signer = provider.getSigner();
    let transaction = await escrow.connect(signer).approveSale(home.id);
    await transaction.wait();

    const purchasePrice = await escrow.purchasePrice(home.id);
    const escrowAmount = await escrow.escrowAmount(home.id);
    const lendAmount = purchasePrice - escrowAmount;
    await escrow
      .connect(signer)
      .depositLenderAmount(home.id, { value: lendAmount });

    setHasLended(true);
  };

  const sellHandler = async () => {
    const signer = provider.getSigner();
    let transaction = await escrow.connect(signer).approveSale(home.id);
    await transaction.wait();

    transaction = await escrow.connect(signer).finalizeSale(home.id);
    await transaction.wait();

    setHasSold(true);
  };

  const inspectHandler = async () => {
    const signer = provider.getSigner();
    let transaction = await escrow
      .connect(signer)
      .updateInspectionStatus(home.id, true);
    await transaction.wait();

    setHasInspected(true);
  };

  useEffect(() => {
    fetchDetails();
    fetchOwner();
  }, [hasSold]);

  return (
    <div className="home">
      <div className="home__details">
        <div className="home__image">
          <img src={home.image} alt="Home" />
        </div>
        <div className="home__overview">
          <h1>{home.name}</h1>
          <p>
            <strong>{home.attributes[2].value}</strong> bds |
            <strong>{home.attributes[3].value}</strong> ba |
            <strong>{home.attributes[4].value}</strong> sqft |
          </p>
          <p>{home.address}</p>
          <h2>{home.attributes[0].value} ETH</h2>
          {owner ? (
            <div>
              <button className="home__owned">
                Owned by {owner.slice(0, 6)}...{owner.slice(38, 42)}
              </button>
            </div>
          ) : (
            <div>
              {account === inspector ? (
                <button
                  className="home__buy"
                  onClick={inspectHandler}
                  disabled={hasInspected}
                >
                  Approve Inspection
                </button>
              ) : account === lender ? (
                <button
                  className="home__buy"
                  onClick={lendHandler}
                  disabled={hasLended}
                >
                  Approve & Lend
                </button>
              ) : account === seller ? (
                <button
                  className="home__buy"
                  onClick={sellHandler}
                  disabled={hasSold}
                >
                  Approve Sell
                </button>
              ) : (
                <button
                  className="home__buy"
                  onClick={buyHandler}
                  disabled={hasBought}
                >
                  Buy
                </button>
              )}
            </div>
          )}

          <button className="home__contact">Contact agent</button>
          <hr />
          <h2>Home Overview</h2>
          <p>{home.description}</p>
          <hr />
          <h2>Home Attributes</h2>
          <ul>
            {home.attributes.map((attribute, index) => (
              <li key={index}>
                <strong>{attribute.trait_type}</strong>: {attribute.value}
              </li>
            ))}
          </ul>
        </div>
        <button onClick={togglePop} className="home__close">
          <img src={close} alt="Close" />
        </button>
      </div>
    </div>
  );
};

export default Home;
