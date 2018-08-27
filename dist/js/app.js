App = {
  web3Provider: null,
  contracts: {},
  account: 0x0,
  loading: false,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // initialize web3
    if(typeof web3 !== 'undefined') {
      //reuse the provider of the Web3 object injected by Metamask
      App.web3Provider = web3.currentProvider;
    } else {
      //create a new provider and plug it directly into our local node
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
      
    }
    web3 = new Web3(App.web3Provider);

    App.displayAccountInfo();

    return App.initContract();
  },

  displayAccountInfo: function() {
    web3.eth.getCoinbase(function(err, account) {
      if(err === null) {
        App.account = account;
        $('#account').text("Connected Account: " + account.substring(0,8)+"...");
        web3.eth.getBalance(account, function(err, balance) {
          if(err === null) {
            $('#accountBalance').text(web3.fromWei(balance, "ether").toFixed(3) + " ETH");
          }
        })
      }
    });
  },

  initContract: function() {
    $.getJSON('Marketplace.json', function(MarketplaceArifact) {
      // get the contract file and use it to instantiate a truffle contract abstraction
      App.contracts.Marketplace = TruffleContract(MarketplaceArifact);
      // set the provider for our contracts
      App.contracts.Marketplace.setProvider(App.web3Provider);
      // listen to events
      App.listenToEvents();
      // retrieve the Product from the contract
      return App.reloadPage();
    });
  },

  reloadPage: function() {
    // avoid reentry
    if(App.loading) {
      return;
    }
    App.loading = true;

    // refresh account 
    App.displayAccountInfo();

    var chainListInstance;

    App.contracts.Marketplace.deployed().then(function(instance) {
      MarketplaceInstance = instance;
      return MarketplaceInstance.getProduct();
    }).then(function(product) {
      
      $('#ProductsRow').empty();

      for(var i = 0; i < product.length; i++) {
        var ProductId = product[i];
        MarketplaceInstance.Products(ProductId.toNumber()).then(function(Product){
          App.displayProduct(Product[0], Product[1], Product[3], Product[4], Product[5]);
        });
      }
      App.loading = false;
    }).catch(function(err) {
      console.error(err.message);
      App.loading = false;
    });
  },

  displayProduct: function(id, seller, name, description, price) {
    var ProductsRow = $('#ProductsRow');

    var etherPrice = web3.fromWei(price, "ether");

    var ProductTemplate = $("#ProductTemplate");
    ProductTemplate.find('.panel-title').text(name);
    ProductTemplate.find('.Product-description').text(description);
    ProductTemplate.find('.Product-price').text(etherPrice + " ETH");
    ProductTemplate.find('.btn-buy').attr('data-id', id);
    ProductTemplate.find('.btn-buy').attr('data-value', etherPrice);

    // seller
    if (seller == App.account) {
      ProductTemplate.find('.Product-seller').text("You");
      ProductTemplate.find('.btn-buy').hide();
    } else {
      ProductTemplate.find('.Product-seller').text(seller);
      ProductTemplate.find('.btn-buy').show();
    }

    // add Product
    ProductsRow.append(ProductTemplate.html());
  },

  sellProduct: function() {
    // Product details
    var _Product_name = $('#Product_name').val();
    var _description = $('#Product_description').val();
    var _price = web3.toWei(parseFloat($('#Product_price').val() || 0), "ether");

    if((_Product_name.trim() == '') || (_price == 0)) {
     
      return false;
    }

    App.contracts.Marketplace.deployed().then(function(instance) {
      return instance.sellProduct(_Product_name, _description, _price, {
        from: App.account,
        gas: 500000
      });
    }).then(function(result) {

    }).catch(function(err) {
      console.error(err);
    });
  },

  
  

  buyProduct: function() {
    event.preventDefault();

    // Products list
    var _ProductId = $(event.target).data('id');
    var _price = parseFloat($(event.target).data('value'));

    App.contracts.Marketplace.deployed().then(function(instance){
      return instance.buyProduct(_ProductId, {
        from: App.account,
        value: web3.toWei(_price, "ether"),
        gas: 500000
      });
    }).catch(function(error) {
      console.error(error);
    });
  },
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
