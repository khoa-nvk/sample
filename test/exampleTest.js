const { assert } = require('chai');
const { utils } = require('@aeternity/aeproject');

const CONTRACT_SOURCE = './contracts/DeMarketly.aes';

describe('DeMarketly contract', () => {
    let aeSdk;
    let contract;

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
        // const createProduct = await contract.methods.create_product(["id", "name", 100000, "description", "image", true], { onAccount: utils.getDefaultAccounts()[1] });
        // const createProduct = await contract.methods.create_product("id", "name", 100000, "description", "image", true);
        // console.log(createProduct)


        //   assert.equal(set.decodedEvents[0].name, 'SetXEvent');
        //   assert.equal(set.decodedEvents[0].args[0], await utils.getDefaultAccounts()[1].address());
        //   assert.equal(set.decodedEvents[0].args[1], 42);

        //   const { decodedResult } = await contract.methods.get();
        assert.equal(42, 42);
    });

    // it('ExampleContract: get undefined when not set before', async () => {
    //   const { decodedResult } = await contract.methods.get();
    //   assert.equal(decodedResult, undefined);
    // });
});