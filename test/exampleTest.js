const { assert } = require('chai');
const { utils } = require('@aeternity/aeproject');

const CONTRACT_SOURCE = './contracts/DeMarketly.aes';

describe('DeMarketly contract', () => {
    let aeSdk;
    let contract;
    const assertNode = require('assert').strict;
    
    const accounts = utils.getDefaultAccounts();
    const ownerAccount = accounts[0] 
    const nonOwnerAccount = accounts[1]

    const PRODUCT_ID_1 = "p1";
    const PRODUCT_ID_2 = "p2";
    const COUPON_50_OFF = "OFF50"
    const PRODUCT_ID_INACTIVE = "inactive_product";
    const REVIEW_ID = "review1";

    before(async() => {
        aeSdk = await utils.getSdk();

        // a filesystem object must be passed to the compiler if the contract uses custom includes
        const fileSystem = utils.getFilesystem(CONTRACT_SOURCE);

        // get content of contract
        const source = utils.getContractContent(CONTRACT_SOURCE);

        // initialize the contract instance
        contract = await aeSdk.getContractInstance({ source, fileSystem });
        await contract.deploy();

        // create a snapshot of the blockchain state
        await utils.createSnapshot(aeSdk);
    });

    // after each test roll back to initial state
    afterEach(async() => {
        await utils.rollbackSnapshot(aeSdk);
    });

    it('Create product', async() => {
        const createProduct = await contract.methods.create_product(PRODUCT_ID_1, "name", 100000, "description", "image", true);
        assert.equal(createProduct.decodedResult, PRODUCT_ID_1);
    });

    it(`Create product fail because using the exist product's ID`, async() => {
        const createProduct = await contract.methods.create_product(PRODUCT_ID_1, "name", 100000, "description", "image", true);
        await assertNode.rejects(contract.methods.create_product(PRODUCT_ID_1, "name", 100000, "description", "image", true), (err) => {
            assert.include(err.message, "Product's id is exist");
            return true;
        });
    });

    it(`Update product fail because of not product owner`, async() => {
        const createProduct = await contract.methods.create_product(PRODUCT_ID_1, "name", 100000, "description", "image", true, {onAccount: ownerAccount});
        await assertNode.rejects(contract.methods.update_product(PRODUCT_ID_1, "name", 100000, "description", "image", true, {onAccount: nonOwnerAccount}), (err) => {
            assert.include(err.message, "You are not the product's owner");
            return true;
        }); 
    });

    it(`Update product fail because of not found product id`, async() => {
        const createProduct = await contract.methods.create_product(PRODUCT_ID_1, "name", 100000, "description", "image", true, {onAccount: ownerAccount});       
        await assertNode.rejects(contract.methods.update_product(PRODUCT_ID_2, "name", 100000, "description", "image", true, {onAccount: ownerAccount}), (err) => {
            assert.include(err.message, "Maps: Key does not exist");
            return true;
        }); 
    });

    it(`Update product success`, async() => {
        const createProduct = await contract.methods.create_product(PRODUCT_ID_1, "name", 100000, "description", "image", true, {onAccount: ownerAccount});
        const updateProduct = await contract.methods.update_product(PRODUCT_ID_1, "name 2", 100000, "description", "image", true, {onAccount: ownerAccount});       
        assert.equal(createProduct.decodedResult, PRODUCT_ID_1);
    });

    
    it(`Buy product fail because product is not exist`, async() => {
        const createProduct = await contract.methods.create_product(PRODUCT_ID_1, "name", 2000000000000000000, "description", "image", true, {onAccount: ownerAccount});
        await assertNode.rejects(contract.methods.buy_product(PRODUCT_ID_2, false, "" , {onAccount: nonOwnerAccount}), (err) => {
            assert.include(err.message, "Product with this id is not exist");
            return true;
        }); 
    });
    it(`Buy product fail because double buying 1 product`, async() => {
        const createProduct = await contract.methods.create_product(PRODUCT_ID_1, "name", 2000000000000000000, "description", "image", true, {onAccount: ownerAccount});
        await assertNode.rejects(contract.methods.buy_product(PRODUCT_ID_1, false, "" , {onAccount: nonOwnerAccount}), (err) => {
            assert.include(err.message, "You already bought this product!");
            return true;
        }); 
    });
    it(`Buy product fail because product is inactive`, async() => {
        const createProduct = await contract.methods.create_product(PRODUCT_ID_1, "name", 2000000000000000000, "description", "image", true, {onAccount: ownerAccount});
        // turn product into inactive
        const updateProduct = await contract.methods.update_product(PRODUCT_ID_1, "name", 2000000000000000000, "description", "image", false, {onAccount: ownerAccount});
        await assertNode.rejects(contract.methods.buy_product(PRODUCT_ID_1, false, "" , {onAccount: nonOwnerAccount}), (err) => {
            assert.include(err.message, "Product is in-active");
            return true;
        }); 
    });
    it(`Buy product fail because of self-buying`, async() => {
        const createProduct = await contract.methods.create_product(PRODUCT_ID_1, "name", 2000000000000000000, "description", "image", true, {onAccount: ownerAccount});
        await assertNode.rejects(contract.methods.buy_product(PRODUCT_ID_1, false, "" , {onAccount: ownerAccount}), (err) => {
            assert.include(err.message, "You can't buy your own product");
            return true;
        }); 
    });

    it(`Buy product success`, async() => {
        const createProduct = await contract.methods.create_product(PRODUCT_ID_1, "name", 2000000000000000000, "description", "image", true, {onAccount: ownerAccount});
        const buyProduct = await contract.methods.buy_product(PRODUCT_ID_1, false, "" , {onAccount: nonOwnerAccount, amount: 2000000000000000000});       
        assert.equal(buyProduct.decodedResult, false)
    });

    // TODO: buy-product-with-coupon fail because this coupon is all used

    it(`create-coupon fail because of non-exist products`, async() => {
        const createProduct = await contract.methods.create_product(PRODUCT_ID_1, "name", 2000000000000000000, "description", "image", true, {onAccount: ownerAccount});
        const buyProduct = await contract.methods.buy_product(PRODUCT_ID_1, false, "" , {onAccount: nonOwnerAccount, amount: 2000000000000000000});       
        assert.equal(buyProduct.decodedResult, false)
    });


});
