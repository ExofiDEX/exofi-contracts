import "@nomicfoundation/hardhat-toolbox";
import "hardhat-abi-exporter";
import "hardhat-contract-sizer";
import "hardhat-deploy";
import "hardhat-tracer";
import "hardhat-gas-reporter";
import "solidity-docgen";
import * as dotenv from "dotenv";
import { LoadNetworkSpecificValues } from "./scripts/DeployConstants";

import { PageAssigner } from "solidity-docgen/dist/site";
import { HardhatUserConfig } from "hardhat/types";

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

const { accounts, deployer, dev } = LoadNetworkSpecificValues();

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
	abiExporter:
		[
			{
				runOnCompile: true,
				path: "./abi/json",
				clear: true,
				flat: false,
				format: "json"
			},
			{
				runOnCompile: true,
				path: "./abi/compact",
				clear: true,
				flat: false,
				format: "fullName"
			}
		],
	contractSizer:
	{
		runOnCompile: true,
		except: ["contracts/mocks"]
	},
	docgen: {
		pages: pa, // "files",
		templates: "doctemplates"
	},
	solidity: {
		compilers: [
			{
				version: "0.8.21",
				settings: {
					evmVersion: "paris", // newest evm not supported by coinbase sidechain
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
	namedAccounts:
	{
		deployer: {
			default: deployer ?? 0
		},
		dev: {
			// Default to 1
			default: dev ?? 1
		}
	},
	networks: {
		mainnet: {
			url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
			gasPrice: 4000000000, // 4 gwei
			accounts
		},
		goerli: {
			url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
			accounts
		},
		base_mainnet: {
			url: "https://mainnet.base.org",
			gasPrice: 1000000000,
			accounts
		},
		base_goerli: {
			url: "https://goerli.base.org",
			gasPrice: 1000000000,
			accounts
		}
		// forking: {
		// url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
		// accounts
		// }
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
