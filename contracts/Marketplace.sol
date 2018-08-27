pragma solidity ^0.4.24;

import "../installed_contracts/zeppelin/contracts/ownership/Ownable.sol";
import "../installed_contracts/zeppelin/contracts/lifecycle/Destructible.sol";


// add marketplace is ownable, killable
contract Marketplace is Ownable, Destructible {
  mapping (address => bool) public members;
    
  mapping (address => bool) public sellers;
  address[] public newSellerRequests;
  
  
  
  modifier onlyMember {
    require(members[msg.sender] == true);
    _;
  }

  modifier onlySeller() {
    require(sellers[msg.sender] == true);
    _;
  }
  
  //circuit breaker

  bool public stopped = false;
  
  modifier stopInEmergency {
    require(!stopped);
    _;
    }

  modifier onlyInEmergency {
    require (stopped);
    _;
  }
  
  //address public owner;
  //string public name;
  //string public description;
  
  event newMemberAdded (address newMemberAddress);
  event removedMember (address removedMemberAddress);
  event newSellerRequestSent(address sellerRequested);
  event newSellerAdded(address approvedseller);
  event newSellerRequestSent(address[]);
  
  
  constructor() public {
    members[msg.sender] = true;
   

  }
// add only owner or only member modifier
  function addMember(address newMember) public onlyMember {
    members[newMember] = true;
    emit newMemberAdded(newMember);
  }
  
  
  //onlyOwner
  function removeMember(address member) onlyOwner public {
      if (members[member] == true)
      members[member] = false;
      emit removedMember(member);
      
  }
  
  // function to identify user type
  function getUserType() public view returns (string) {
    if (members[msg.sender] == true) {
      return 'marketplaceMember';
    }
    else if (sellers[msg.sender] == true) {
      return 'seller';
    }
    else {
      return 'customer';
    }
  }
  
  function addStoreOwnerRequest() stopInEmergency public {
    newSellerRequests.push(msg.sender);
    emit newSellerRequestSent(msg.sender);
  }
  
  function approveStoreOwner(uint index, address seller) public onlyMember {
    require(newSellerRequests.length > index);
    require(newSellerRequests[index] == seller);
    sellers[seller] = true;
   // emit newSellerAdded(address seller);
  }
  
  function sellerRequestsList() public view returns (address[]) {
    return newSellerRequests;
  }
  
  
  mapping(address => mapping(uint => Product)) stores;
  mapping(uint => address) productIdInStore;
  struct Product {
        uint id;
        string name;
        string desc;
        uint quantity;
        uint price;
  }
  uint public productIndex;
  mapping (uint => Product) public products;

  event NewProduct(uint _productId,string _name, string _desc, uint _quantity, uint _price);
  
  function addProductToStore(string _name, string _desc, uint _quantity, uint _price) public payable onlySeller{
        productIndex += 1;
        Product memory product = Product(productIndex, _name, _desc, _quantity, _price);
        stores[msg.sender][productIndex] = product;
        productById[productIndex] = product;
        productIdInStore[productIndex] = msg.sender;
        emit NewProduct(productIndex, _name, _desc, _quantity, _price);
        
        
    }
  
  function getProduct(uint _productId) view public returns (uint, string, string, uint, uint) {
        
        Product memory product = stores[productIdInStore[_productId]][_productId];
        return (product.id, product.name, product.desc, product.quantity, product.price);
    }
  
  mapping (uint => Product) public productById;
  event PurchaseMade(uint indexed productId, uint quantity);
  
  

  function buyItem(uint _id, uint _quantity)
        public
        payable
       
    {
        require(productById[_id].price <= msg.value, "not enough ether");
        require(productById[_id].quantity >= _quantity, "we don't have that much sorry");
        emit PurchaseMade(_id, _quantity);
        productById[_id].quantity = productById[_id].quantity - _quantity;
    }
  mapping (address => uint) private userBalance;

// balance withdraw function
  function withdraw() public onlyInEmergency onlySeller {
   owner.transfer(address(this).balance);
   userBalance[msg.sender] = 0;
    }

// self destruct
  function kill()public onlyOwner {
    selfdestruct(owner);
    
  }
    
  function () public payable {}
}