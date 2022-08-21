/* eslint-disable indent */
module.exports = async function ({ ethers, getNamedAccounts, deployments })
{
	const { deploy } = deployments;
	const { deployer } = await getNamedAccounts();

	// eslint-disable-next-line no-undef
	const chainId = await getChainId();
	console.log(`ChainId: ${chainId}`);

	let wethAddress;

	switch (chainId)
	{
		case "1": // Mainnet
			wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
			break;
		case "5": // Görli
			wethAddress = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
			break;
		default:
			throw new Error("Unknown ChainId");
	}

	const esf = await ethers.getContract("ExofiswapFactory");
	await deploy("ExofiswapRouter",
		{
			from: deployer,
			args: [esf.address, wethAddress],
			log: true,
			deterministicDeployment: false
		});
};

module.exports.tags = ["ExofiswapRouter"];
module.exports.dependencies = ["ExofiswapFactory"];
