/* eslint-disable node/no-unpublished-import */
import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-abi-exporter";
import "hardhat-contract-sizer";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "solidity-docgen";

import { PageAssigner } from "solidity-docgen/dist/site";

const excludePath: RegExp[] = [/\/mocks\//];

const pa: PageAssigner = (item, file, config) =>
{
	for (const excludeMe of excludePath)
	{
		if (excludeMe.test(file.absolutePath))
		{
			return undefined;
		}
	}
	return file.absolutePath.replace(".sol", config.pageExtension);
};

dotenv.config();

const accounts = {
	mnemonic:
		process.env.MNEMONIC ||
		"test test test test test test test test test test test junk"
	// accountsBalance: "990000000000000000000"
};

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
	abiExporter:
	{
		path: "./abi",
		clear: false,
		flat: true
		// only: [],
		// except: []
	},
	contractSizer:
	{
		runOnCompile: true
		// only: ["Router", "Factory", "Pair"]
	},
	docgen: {
		pages: pa, // "files",
		templates: "doctemplates"
	},
	solidity: {
		compilers: [
			{
				version: "0.6.6",
				settings: {
					optimizer: {
						enabled: true,
						runs: 500000
					}
				}
			},
			{
				version: "0.6.12",
				settings: {
					optimizer: {
						enabled: true,
						runs: 500000
					}
				}
			},
			{
				version: "0.8.17",
				settings: {
					optimizer: {
						enabled: true,
						runs: 500000,
						details: {
							// Sometimes re-orders literals in commutative operations.
							orderLiterals: true,
							// Removes duplicate code blocks
							deduplicate: true,
							// Common subexpression elimination, this is the most complicated step but
							// can also provide the largest gain.
							cse: true,
							// Optimize representation of literal numbers and strings in code.
							constantOptimizer: true
						}
					}
				}
			}
		]
	},
	mocha:
	{
		timeout: 3600000
	},
	namedAccounts:
	{
		deployer: {
			default: process.env.OWNER ?? 0
		},
		dev: {
			// Default to 1
			default: process.env.DEVELOPER ?? 1
		}
	},
	networks: {
		ropsten: {
			url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
			accounts
		},
		rinkeby: {
			url: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
			accounts
		},
		goerli: {
			url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
			accounts
		}
	},
	gasReporter: {
		enabled: process.env.REPORT_GAS === "true",
		coinmarketcap: process.env.COINMARKETCAP_API_KEY,
		currency: "EUR",
		excludeContracts: [
			"contracts/mocks/"
		]
	},
	etherscan: {
		apiKey: process.env.ETHERSCAN_API_KEY
	}
};

export default config;
