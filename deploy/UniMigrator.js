module.exports = async function ({ getNamedAccounts, deployments })
{
	const { deploy } = deployments;
	const { deployer, dev } = await getNamedAccounts();

	await deploy("UniMigrator", {
		from: deployer,
		args: [dev.address],
		log: true,
		deterministicDeployment: false
	});
};

module.exports.tags = ["UniMigrator"];
