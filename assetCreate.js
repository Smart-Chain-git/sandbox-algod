


const algosdk = require('algosdk');
const utils = require('./utils');


// Creating an indexer


const indexer_token = "";
const indexer_server = "http://localhost";
const indexer_port = 8980;

const indexerClient = new algosdk.Indexer(indexer_token, indexer_server, indexer_port);





// Example: creating an asset


const algodToken = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const algodServer = "http://localhost";
const algodPort = 4001;

let algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);



const { SENDER } = utils.retrieveBaseConfig();

async function main() {
    const sender = algosdk.mnemonicToSecretKey(SENDER.mnemonic);

    // generate accounts
    const { addr: freezeAddr } = algosdk.generateAccount(); // account that can freeze other accounts for this asset
    const { addr: managerAddr } = algosdk.generateAccount(); // account able to update asset configuration
    const { addr: clawbackAddr } = algosdk.generateAccount(); // account allowed to take this asset from any other account
    const { addr: reserveAddr } = algosdk.generateAccount(); // account that holds reserves for this asset

    const feePerByte = 10;


    let status = await algodClient.status().do();
    if (status == undefined) throw new Error("Unable to get node status");
    const firstValidRound = status["last-round"] + 1;  
    const lastValidRound = firstValidRound + 1000;

    const genesisHash = 'pXXY8psM8jgd8F/dUplcOGebnV50PFojR+YMRCtY/us=';

    const total = 100; // how many of this asset there will be
    const decimals = 0; // units of this asset are whole-integer amounts
    const assetName = 'assetname';
    const unitName = 'unitname';
    const url = 'website';
    const metadata = new Uint8Array(
    Buffer.from(
        '664143504f346e52674f35356a316e64414b3357365367633441506b63794668',
        'hex'
    )
    ); // should be a 32-byte hash
    const defaultFrozen = false; // whether accounts should be frozen by default

    // create suggested parameters
    const suggestedParams = {
    flatFee: false,
    fee: feePerByte,
    firstRound: firstValidRound,
    lastRound: lastValidRound,
    genesisHash,
    };

    // create the asset creation transaction
    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: sender.addr,
    total,
    decimals,
    assetName,
    unitName,
    assetURL: url,
    assetMetadataHash: metadata,
    defaultFrozen,

    freeze: freezeAddr,
    manager: managerAddr,
    clawback: clawbackAddr,
    reserve: reserveAddr,

    suggestedParams,
    });

    // sign the transaction
    const signedTxn = txn.signTxn(sender.sk);

    // print transaction data
    const decoded = algosdk.decodeSignedTransaction(signedTxn);
    console.log(decoded);

    let txId = txn.txID().toString();
    console.log("Signed transaction with txID: %s", txId);
    //submit the transaction
    await algodClient.sendRawTransaction(signedTxn).do();



    /**
     * utility function to wait on a transaction to be confirmed
     * the timeout parameter indicates how many rounds do you wish to check pending transactions for
     */
    const waitForConfirmation = async function (algodclient, txId, timeout) {
        // Wait until the transaction is confirmed or rejected, or until 'timeout'
        // number of rounds have passed.
        //     Args:
        // txId(str): the transaction to wait for
        // timeout(int): maximum number of rounds to wait
        // Returns:
        // pending transaction information, or throws an error if the transaction
        // is not confirmed or rejected in the next timeout rounds
        if (algodclient == null || txId == null || timeout < 0) {
            throw "Bad arguments.";
        }
        let status = (await algodclient.status().do());
        if (status == undefined) throw new Error("Unable to get node status");
        let startround = status["last-round"] + 1;   
        let currentround = startround;

        while (currentround < (startround + timeout)) {
            let pendingInfo = await algodclient.pendingTransactionInformation(txId).do();      
            if (pendingInfo != undefined) {
                if (pendingInfo["confirmed-round"] !== null && pendingInfo["confirmed-round"] > 0) {
                    //Got the completed Transaction
                    return pendingInfo;
                }
                else {
                    if (pendingInfo["pool-error"] != null && pendingInfo["pool-error"].length > 0) {
                        // If there was a pool error, then the transaction has been rejected!
                        throw new Error("Transaction Rejected" + " pool error" + pendingInfo["pool-error"]);
                    }
                }
            } 
            await algodclient.statusAfterBlock(currentround).do();
            currentround++;
        }
        throw new Error("Transaction not confirmed after " + timeout + " rounds!");
    };




    // Wait for confirmation
    let confirmedTxn = await waitForConfirmation(algodClient, txId, 12);
    //Get the completed Transaction
    console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);



    // Get the new asset's information from the creator account
    let ptx = await algodclient.pendingTransactionInformation(tx.txId).do();
    assetID = ptx["asset-index"];


    (async () => {
        let address = SENDER.addr;
        let txid = txId; 
        let response = await indexerClient.searchForTransactions()
            .address(address)
            .txid(txid).do();
        console.log("txid:"+txId+" = " + JSON.stringify(response, undefined, 2));
        }  
    )().catch(e => {
        console.log(e);
        console.trace();
    });

}



main().catch(console.error);