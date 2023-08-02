const axios = require('axios')
const TokenSourceCode = require('./TokenSourceCode.js');
const abi = require('ethereumjs-abi');
const ethers = require("ethers")
const fetch = require("node-fetch");
globalThis.fetch = fetch
const undici = require("undici");


function getDispatcher() {
    const { ProxyAgent, getGlobalDispatcher } =
      require("undici") 
    if (process.env.http_proxy !== undefined) {
      return new ProxyAgent(process.env.http_proxy);
    }
  
    return getGlobalDispatcher();
  }

async function sendPostRequest(
    url,
    body
) {
    const { request } = await import("undici");
    const dispatcher = getDispatcher();

    return request(url, {
        dispatcher,
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });
}


const verify = async (constructorParameters, contractAddress, apiKey, verifyApiUrl) => {
    console.log({
        tokenOwner: constructorParameters.tokenOwner,
        tokenName: constructorParameters.tokenName,
        tokenSymbol: constructorParameters.tokenSymbol,
        supply: constructorParameters.supply,
        preMint: constructorParameters.preMint,
        burnPercent: constructorParameters.burnPercent,
        routerAddress: constructorParameters.routerAddress
    });

    const encodedArguments = abi.simpleEncode(
        'constructor(address,string,string,uint256,uint256,uint256,address)',
        constructorParameters.tokenOwner,
        constructorParameters.tokenName,
        constructorParameters.tokenSymbol,
        constructorParameters.supply._hex,
        constructorParameters.preMint._hex,
        constructorParameters.burnPercent,
        constructorParameters.routerAddress
    ).toString('hex').substring(8);

    const data = new URLSearchParams({
        apikey: apiKey, // A valid API-Key is required
        module: 'contract', // Do not change
        action: 'verifysourcecode', // Do not change
        contractaddress: contractAddress, // Contract Address starts with 0x...
        sourceCode: TokenSourceCode, // Contract Source Code (Flattened if necessary)
        // tslint:disable-next-line:max-line-length
        codeformat: 'solidity-single-file', // solidity-single-file (default) or solidity-standard-json-input (for std-input-json-format support
        // tslint:disable-next-line:max-line-length
        contractname: 'Token', // ContractName (if codeformat=solidity-standard-json-input, then enter contractname as ex: erc20.sol:erc20)
        compilerversion: 'v0.8.17+commit.8df45f5f', // see https://BscScan.com/solcversions for list of support versions
        optimizationUsed: 1, // 0 = No Optimization, 1 = Optimization used (applicable when codeformat=solidity-single-file)
        // tslint:disable-next-line:max-line-length
        runs: 200, // set to 200 as default unless otherwise  (applicable when codeformat=solidity-single-file)
        // tslint:disable-next-line:max-line-length
        constructorArguements: encodedArguments, // if applicable
        // tslint:disable-next-line:max-line-length
        evmversion: '', // leave blank for compiler default, homestead, tangerineWhistle, spuriousDragon, byzantium, constantinople, petersburg, istanbul (applicable when codeformat=solidity-single-file)
        licenseType: '3', // Valid codes 1-12 where 1=No License .. 12=Apache 2.0, see https://BscScan.com/contract-license-types
    });

    sendPostRequest(verifyApiUrl, data.toString()).then(async (response) => {
        console.log('data', await response.body.json())
    }).catch((err) => {
        console.log(err);
    });
}

verify({
    tokenOwner: '0xfA43cE0ceaD94C14D84891F375269714dbaE61Ce',
    tokenName: 'bbb',
    tokenSymbol: 'aaa',
    supply: ethers.BigNumber.from("0xd3c21bcecceda1000000"),
    preMint: ethers.BigNumber.from("0x152d02c7e14af6800000"),
    burnPercent: 0,
    routerAddress: '0xFd0c6D2899Eb342b9E48abB3f21730e9F4532976'
}, "0xeb1356e372e8a08a4618110056009300b84ed9af", "ZF8UZTCMKDNN555XW2CGBJ2HXWCVIRZFFG", "https://api-goerli.etherscan.io/api").then(() => {
    console.log('done');
}).catch((err) => {
    console.log(err);
});