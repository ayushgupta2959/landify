import { useEffect, useState } from "react";
import { ethers } from "ethers";

// Components
import Navigation from "./components/Navigation";
import Search from "./components/Search";
import Home from "./components/Home";

// ABIs
import Landify from "./abis/Landify.json";
import Escrow from "./abis/Escrow.json";

// Config
import config from "./config.json";

function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [escrow, setEscrow] = useState(null);
  const [homes, setHomes] = useState([]);
  const [home, setHome] = useState(null);
  const [toggle, setToggle] = useState(false);

  const toggleProp = (home) => {
    setHome(home);
    setToggle(!toggle);
  };

  const loadBlockchainData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);

    const network = await provider.getNetwork();
    const landify = new ethers.Contract(
      config[network.chainId].landify.address,
      Landify,
      provider
    );
    const totalSupply = await landify.totalSupply();
    const homes = [];
    for (let i = 1; i <= totalSupply; i++) {
      const uri = await landify.tokenURI(i);
      const response = await fetch(uri);
      const metadata = await response.json();
      homes.push(metadata);
    }
    setHomes(homes);

    const escrow = new ethers.Contract(
      config[network.chainId].escrow.address,
      Escrow,
      provider
    );
    setEscrow(escrow);

    window.ethereum.on("accountsChanged", async () => {
      const accounts = await provider.listAccounts();
      setAccount(accounts[0]);
    });
  };

  useEffect(() => {
    loadBlockchainData();
  }, []);

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />
      <Search />
      <div className="cards__section">
        <h3>Homes For You</h3>
        <hr />
        <div className="cards">
          {homes.map((home, index) => (
            <div className="card" key={index} onClick={() => toggleProp(home)}>
              <div className="card__image">
                <img src={home.image} alt="Home" />
              </div>
              <div className="card__info">
                <h4>{home.attributes[0].value} ETH</h4>
                <p>
                  <strong>{home.attributes[2].value}</strong> bds |
                  <strong>{home.attributes[3].value}</strong> ba |
                  <strong>{home.attributes[4].value}</strong> sqft |
                </p>
                <p>{home.address}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {toggle && (
        <Home
          home={home}
          escrow={escrow}
          togglePop={toggleProp}
          provider={provider}
          account={account}
        />
      )}
    </div>
  );
}

export default App;
