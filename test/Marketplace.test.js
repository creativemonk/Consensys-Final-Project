//import "../installed_contracts/zeppelin/contracts/ownership/Ownable.sol";
//import "../installed_contracts/zeppelin/contracts/lifecycle/Destructible.sol";
//import "../contracts/Marketplace.sol";

var Marketplace = artifacts.require("Marketplace");

contract('Marketplace', function(accounts) {

  /** Test to check if admin is set correctly */
   
  it("Test to check if the marketplace admin is correctly set.", function() {
    return Marketplace.deployed()
      .then(instance => instance.members.call(accounts[0]))
      .then(onlyMember => assert.equal(onlyMember, true, "The marketplace admin is not correctly set."));
  });

   
   /** Test to check if the customer can place a request to become a seller in the marketplace */
  
  it("Test to check if seller request is added correctly.", function() {
    let marketplaceInstance;
    return Marketplace.deployed().then(instance => {
      marketplaceInstance = instance;
      return marketplaceInstance.addStoreOwnerRequest.sendTransaction({from: accounts[1]});
    })
    .then(() => marketplaceInstance.newSellerRequests.call(0))
    .then(request => {
      assert.equal(request, accounts[1], "The seller request is not recorded correctly.");
    });
  });

  /** Test to check if members are able to process request */

  it("Test to check processing of seller request.", function() {
    let marketplaceInstance;

    return Marketplace.deployed()
      .then(instance => {
        marketplaceInstance = instance;
      })
      .then(() => marketplaceInstance.approveStoreOwner.sendTransaction(0, accounts[1], {from: accounts[0]}))
      .then(() => marketplaceInstance.sellers.call(accounts[1]))
      .then(onlySeller => {
        assert.equal(onlySeller, true, "Seller request is not processed.");
      });
  });

  /** Test to check if the admin is correctly identified */

  it("Test to check if member is identified correctly.", function() {
    let marketplaceInstance;

    return Marketplace.deployed()
      .then(instance => {
        marketplaceInstance = instance;
      })
      .then(() => marketplaceInstance.getUserType.call({from: accounts[0]}))
      .then(accountType => assert.equal(accountType, 'marketplaceMember', "Member not recognized."));
  });

  /** Test to check if the seller is correctly identified */
  it("Test to check if the seller is identified correctly.", function() {
    let marketplaceInstance;

    return Marketplace.deployed()
      .then(instance => {
        marketplaceInstance = instance;
      })
      .then(() => marketplaceInstance.getUserType.call({from: accounts[1]}))
      .then(accountType => assert.equal(accountType, 'seller', "Seller not recognized."));
  });

  /** Test to check if the customer is correctly identified */
  it("Test to identify customer address.", function() {
    let marketplaceInstance;

    return Marketplace.deployed()
      .then(instance => {
        marketplaceInstance = instance;
      })
      .then(() => marketplaceInstance.getUserType.call({from: accounts[2]}))
      .then(accountType => assert.equal(accountType, 'customer', "Customer address could not be identified."));
  });

  
  

});
