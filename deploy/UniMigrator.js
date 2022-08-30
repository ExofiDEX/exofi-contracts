module.exports = async function ({ getNamedAccounts /* , deployments */ })
{
	// const { deploy } = deployments;
	const { deployer, dev } = await getNamedAccounts();

	console.log("MagneticFieldGenerator - Deploying contracts with deployer: ", deployer);
	console.log("MagneticFieldGenerator - Deploying contracts with dev: ", dev);

// await deploy("UniMigrator", {
// from: deployer,
// args: [dev],
// log: true,
// deterministicDeployment: false
// });
};

module.exports.tags = ["UniMigrator"];
