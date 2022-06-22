/* eslint-disable node/no-unpublished-import */
import { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ADDRESS_ZERO, AdvanceBlockTo, GetBlockNumber, PANIC_CODES } from "./helpers";

import { IERC20, IFermion, IMagneticFieldGenerator } from "../typechain-types";
import { experimentalAddHardhatNetworkMessageTraceHook } from "hardhat/config";

describe("MagneticFieldGenerator", () =>
{
	let MagneticFieldGeneratorFactory: ContractFactory;
	let FermionFactory: ContractFactory;
	let ERC20MockFactory: ContractFactory;
	let Signers: SignerWithAddress[];
	let Alice: SignerWithAddress;
	let Bob: SignerWithAddress;
	let Carol: SignerWithAddress;
	let Dev: SignerWithAddress;
	let Minter: SignerWithAddress;
	let Contract: Contract;
	const MagneticFieldGenerator = () => Contract as IMagneticFieldGenerator;

	before(async () =>
	{
		Signers = await ethers.getSigners();
		Alice = Signers[0];
		Bob = Signers[1];
		Carol = Signers[2];
		Dev = Signers[3];
		Minter = Signers[4];

		MagneticFieldGeneratorFactory = await ethers.getContractFactory("MagneticFieldGenerator");
		FermionFactory = await ethers.getContractFactory("Fermion");
		ERC20MockFactory = await ethers.getContractFactory("ERC20Mock", Minter);
	});

	context("this", () =>
	{
		let Fermion: IFermion;

		beforeEach(async () =>
		{
			Fermion = (await FermionFactory.deploy()) as IFermion;
			await Fermion.deployed();

			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, Dev.address, "100", "0");
			await Contract.deployed();

			await Fermion.transferOwnership(Contract.address);
		});

		it("MagneticFieldGenerator.constructor: Should set correct state variables", async () =>
		{
			const fermionAddress = await MagneticFieldGenerator().getFermionContract();
			const devaddr = await MagneticFieldGenerator().developer();
			const fermionPerBlock = await MagneticFieldGenerator().getFermionPerBlock();
			const startBlock = await MagneticFieldGenerator().getStartBlock();
			const owner = await Fermion.owner();
			const migrator = await MagneticFieldGenerator().migrator();

			expect(fermionAddress).to.equal(Fermion.address);
			expect(devaddr).to.equal(Dev.address);
			expect(fermionPerBlock).to.equal(100);
			expect(startBlock).to.equal(0);
			expect(owner).to.equal(MagneticFieldGenerator().address);
			expect(migrator).to.equal(ADDRESS_ZERO);
		});

		it("MagneticFieldGenerator.setMigrator: Should set correct migrator", async () =>
		{
			const fakeUniToken = await ERC20MockFactory.deploy("UniSwap Token", "UNI", 1000) as IERC20;
			const uniMigratorFactory = await ethers.getContractFactory("UniMigratorMock");
			await fakeUniToken.deployed();
			const uniMigrator = await uniMigratorFactory.deploy(Bob.address, fakeUniToken.address);
			await uniMigrator.deployed();

			await MagneticFieldGenerator().setMigrator(uniMigrator.address);

			expect(await MagneticFieldGenerator().migrator()).to.equal(uniMigrator.address);
		});

		it("MagneticFieldGenerator.migrate: Should not migrate if no migrator set", async () =>
		{
			const result = MagneticFieldGenerator().migrate(0);

			await expect(result).to.revertedWith("migrate: no migrator");
		});

		it("MagneticFieldGenerator.migrate: Should migrate correctly", async () =>
		{
			const fakeUniToken = await ERC20MockFactory.deploy("UniSwap Token", "UNI", 1000) as IERC20;
			const uniMigratorFactory = await ethers.getContractFactory("UniMigratorMock");
			await fakeUniToken.deployed();
			const uniMigrator = await uniMigratorFactory.deploy(Bob.address, fakeUniToken.address);
			await uniMigrator.deployed();
			await MagneticFieldGenerator().setMigrator(uniMigrator.address);
			await MagneticFieldGenerator().add(100, fakeUniToken.address);
			await fakeUniToken.transfer(MagneticFieldGenerator().address, 1000);

			await MagneticFieldGenerator().connect(Alice).migrate(0);

			const balanceOfBob = await fakeUniToken.balanceOf(Bob.address);
			const balanceOfMfg = await fakeUniToken.balanceOf(MagneticFieldGenerator().address);
			const poolInfo = await MagneticFieldGenerator().poolInfo(0);
			expect(balanceOfBob).to.equal(1000);
			expect(balanceOfMfg).to.equal(0);
			expect(poolInfo.lpToken).to.not.equal(fakeUniToken.address);
		});

		it("MagneticFieldGenerator.migrate: Should not migrate same pool multible times", async () =>
		{
			const fakeUniToken = await ERC20MockFactory.deploy("UniSwap Token", "UNI", 1000) as IERC20;
			const uniMigratorFactory = await ethers.getContractFactory("UniMigratorMock");
			await fakeUniToken.deployed();
			const uniMigrator = await uniMigratorFactory.deploy(Bob.address, fakeUniToken.address);
			await uniMigrator.deployed();
			await MagneticFieldGenerator().setMigrator(uniMigrator.address);
			await MagneticFieldGenerator().add(100, fakeUniToken.address);

			await fakeUniToken.transfer(MagneticFieldGenerator().address, 500);
			await MagneticFieldGenerator().migrate(0);
			expect(await fakeUniToken.balanceOf(Bob.address)).to.equal(500);
			expect(await fakeUniToken.balanceOf(MagneticFieldGenerator().address)).to.equal(0);

			await fakeUniToken.transfer(MagneticFieldGenerator().address, 500);
			const result = MagneticFieldGenerator().migrate(0);

			// This error is thrown due the fact that the FakeERC20 token we use does not implement approve.
			await expect(result).to.revertedWith("function selector was not recognized and there's no fallback function");
		});

		it("MagneticFieldGenerator.transferDevelopment: Should only allow developer to transfer devlopment", async () =>
		{
			expect(await MagneticFieldGenerator().developer()).to.equal(Dev.address);

			await expect(MagneticFieldGenerator().connect(Bob).transferDevelopment(Bob.address))
				.to.be.revertedWith("MFG: caller is not developer");
			expect(await MagneticFieldGenerator().developer()).to.equal(Dev.address);

			await MagneticFieldGenerator().connect(Dev).transferDevelopment(Bob.address);
			expect(await MagneticFieldGenerator().developer()).to.equal(Bob.address);

			await expect(MagneticFieldGenerator().connect(Dev).transferDevelopment(Alice.address))
				.to.be.revertedWith("MFG: caller is not developer");
			expect(await MagneticFieldGenerator().developer()).to.equal(Bob.address);

			await MagneticFieldGenerator().connect(Bob).transferDevelopment(Alice.address);
			expect(await MagneticFieldGenerator().developer()).to.equal(Alice.address);
		});

		it("Should not allow developer to transfer devlopment to zero address", async () =>
		{
			expect(await MagneticFieldGenerator().developer()).to.equal(Dev.address);

			await expect(MagneticFieldGenerator().connect(Dev).transferDevelopment(ADDRESS_ZERO))
				.to.be.revertedWith("MFG: new developer is address(0)");
			expect(await MagneticFieldGenerator().developer()).to.equal(Dev.address);
		});

		it("Should emit event 'DevelopmentTransferred' on delegate", async () =>
		{
			expect(await MagneticFieldGenerator().developer()).to.equal(Dev.address);

			const result = await MagneticFieldGenerator().connect(Dev).transferDevelopment(Bob.address);

			await expect(result)
				.to.emit(Contract, "DevelopmentTransferred")
				.withArgs(Dev.address, Bob.address);
		});
	});

	context("Contract ERC20-Ownable", async () =>
	{
		let Fermion: IFermion;

		beforeEach(async () =>
		{
			Fermion = (await FermionFactory.deploy()) as IFermion;
			await Fermion.deployed();

			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, Dev.address, "1000", "0");
			await Contract.deployed();

			await Fermion.transferOwnership(Contract.address);
		});

		it("Should only allow owner to renounce ownership", async () =>
		{
			expect(await MagneticFieldGenerator().owner()).to.equal(Alice.address);

			await expect(MagneticFieldGenerator().connect(Bob).renounceOwnership())
				.to.be.revertedWith("Ownable: caller is not the owner");
			expect(await MagneticFieldGenerator().owner()).to.equal(Alice.address);

			await MagneticFieldGenerator().renounceOwnership();
			expect(await MagneticFieldGenerator().owner()).to.equal(ADDRESS_ZERO);
		});

		it("Should only allow owner to transfer ownership", async () =>
		{
			expect(await MagneticFieldGenerator().owner()).to.equal(Alice.address);

			await expect(MagneticFieldGenerator().connect(Bob).transferOwnership(Carol.address))
				.to.be.revertedWith("Ownable: caller is not the owner");
			expect(await MagneticFieldGenerator().owner()).to.equal(Alice.address);

			await MagneticFieldGenerator().transferOwnership(Bob.address);
			expect(await MagneticFieldGenerator().owner()).to.equal(Bob.address);

			await expect(MagneticFieldGenerator().transferOwnership(Carol.address))
				.to.be.revertedWith("Ownable: caller is not the owner");
			expect(await MagneticFieldGenerator().owner()).to.equal(Bob.address);

			await MagneticFieldGenerator().connect(Bob).transferOwnership(Carol.address);
			expect(await MagneticFieldGenerator().owner()).to.equal(Carol.address);
		});
	});

	context("Contract MagneticFieldGenerator", () =>
	{
		let Fermion: IFermion;

		beforeEach(async () =>
		{
			Fermion = (await FermionFactory.deploy()) as IFermion;
			await Fermion.deployed();

			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, Dev.address, "100", "0");
			await Contract.deployed();

			await Fermion.transferOwnership(Contract.address);
		});

		it("Should set correct state variables", async () =>
		{
			const fermionAddress = await MagneticFieldGenerator().getFermionContract();
			const devaddr = await MagneticFieldGenerator().developer();
			const fermionPerBlock = await MagneticFieldGenerator().getFermionPerBlock();
			const startBlock = await MagneticFieldGenerator().getStartBlock();
			const owner = await Fermion.owner();

			expect(fermionAddress).to.equal(Fermion.address);
			expect(devaddr).to.equal(Dev.address);
			expect(fermionPerBlock).to.equal(100);
			expect(startBlock).to.equal(0);
			expect(owner).to.equal(MagneticFieldGenerator().address);
		});
		it("Should only allow developer to transfer devlopment", async () =>
		{
			expect(await MagneticFieldGenerator().developer()).to.equal(Dev.address);

			await expect(MagneticFieldGenerator().connect(Bob).transferDevelopment(Bob.address))
				.to.be.revertedWith("MFG: caller is not developer");
			expect(await MagneticFieldGenerator().developer()).to.equal(Dev.address);

			await MagneticFieldGenerator().connect(Dev).transferDevelopment(Bob.address);
			expect(await MagneticFieldGenerator().developer()).to.equal(Bob.address);

			await expect(MagneticFieldGenerator().connect(Dev).transferDevelopment(Alice.address))
				.to.be.revertedWith("MFG: caller is not developer");
			expect(await MagneticFieldGenerator().developer()).to.equal(Bob.address);

			await MagneticFieldGenerator().connect(Bob).transferDevelopment(Alice.address);
			expect(await MagneticFieldGenerator().developer()).to.equal(Alice.address);
		});

		it("Should not allow developer to transfer devlopment to zero address", async () =>
		{
			expect(await MagneticFieldGenerator().developer()).to.equal(Dev.address);

			await expect(MagneticFieldGenerator().connect(Dev).transferDevelopment(ADDRESS_ZERO))
				.to.be.revertedWith("MFG: new developer is address(0)");
			expect(await MagneticFieldGenerator().developer()).to.equal(Dev.address);
		});

		it("Should emit event 'DevelopmentTransferred' on delegate", async () =>
		{
			expect(await MagneticFieldGenerator().developer()).to.equal(Dev.address);

			const result = await MagneticFieldGenerator().connect(Dev).transferDevelopment(Bob.address);

			await expect(result)
				.to.emit(Contract, "DevelopmentTransferred")
				.withArgs(Dev.address, Bob.address);
		});
	});

	context("Contract MagneticFieldGenerator with ERC/LP token added to the field", () =>
	{
		let lpToken: IERC20;
		let lpToken2: IERC20;
		let lpToken3: IERC20;
		let Fermion: IFermion;

		beforeEach(async () =>
		{
			// Needs to be done inside context too so that tests are isolated.
			Fermion = (await FermionFactory.deploy()) as IFermion;
			await Fermion.deployed();

			lpToken = await ERC20MockFactory.deploy("LPToken", "LP", "10000000000") as IERC20;
			await lpToken.deployed();
			await lpToken.transfer(Alice.address, "1000");
			await lpToken.transfer(Bob.address, "1000");
			await lpToken.transfer(Carol.address, "1000");

			lpToken2 = await ERC20MockFactory.deploy("LPToken2", "LP2", "10000000000") as IERC20;
			await lpToken2.deployed();
			await lpToken2.transfer(Alice.address, "1000");
			await lpToken2.transfer(Bob.address, "1000");
			await lpToken2.transfer(Carol.address, "1000");

			lpToken3 = await ERC20MockFactory.deploy("LPToken3", "LP3", "10000000000") as IERC20;
			await lpToken3.deployed();
			await lpToken3.transfer(Alice.address, "1000");
			await lpToken3.transfer(Bob.address, "1000");
			await lpToken3.transfer(Carol.address, "1000");
		});

		it("Should revert `add` on total alloc overflow", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock + 100;
			const limit: BigNumber = BigNumber.from(2).pow(256).sub(2);

			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, Dev.address, "1000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();
			expect(await MagneticFieldGenerator().poolLength()).to.equal(BigNumber.from(0));

			await MagneticFieldGenerator().add(limit, lpToken.address);
			expect(await MagneticFieldGenerator().poolLength()).to.equal(BigNumber.from(1));

			await MagneticFieldGenerator().add(1, lpToken2.address);
			expect(await MagneticFieldGenerator().poolLength()).to.equal(BigNumber.from(2));

			await expect(MagneticFieldGenerator().add(BigNumber.from(1), lpToken3.address)).to.be.revertedWith(PANIC_CODES.Code_0x11);
			expect(await MagneticFieldGenerator().poolLength()).to.equal(BigNumber.from(2));
		});

		it("Should revert `set` on total alloc overflow", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock + 100;
			const limit: BigNumber = BigNumber.from(2).pow(256).sub(2);

			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, Dev.address, "1000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();
			expect(await MagneticFieldGenerator().poolLength()).to.equal(BigNumber.from(0));

			await MagneticFieldGenerator().add(limit, lpToken.address);
			await MagneticFieldGenerator().add(1, lpToken2.address);
			expect((await MagneticFieldGenerator().poolInfo(0)).allocPoint).to.equal(limit);
			expect((await MagneticFieldGenerator().poolInfo(1)).allocPoint).to.equal(1);

			await MagneticFieldGenerator().set(1, 0);
			expect((await MagneticFieldGenerator().poolInfo(1)).allocPoint).to.equal(0);

			await expect(MagneticFieldGenerator().set(1, 2)).to.be.revertedWith(PANIC_CODES.Code_0x11);
			expect((await MagneticFieldGenerator().poolInfo(1)).allocPoint).to.equal(0);
		});

		it("Should set alloc point and total alloc correctly on `set`", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock + 100;

			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, Dev.address, "1000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();
			expect(await MagneticFieldGenerator().poolLength()).to.equal(BigNumber.from(0));

			await MagneticFieldGenerator().add(100, lpToken.address);
			await MagneticFieldGenerator().add(100, lpToken2.address);
			expect((await MagneticFieldGenerator().poolInfo(0)).allocPoint).to.equal(100);
			expect((await MagneticFieldGenerator().poolInfo(1)).allocPoint).to.equal(100);
			expect(await MagneticFieldGenerator().totalAllocPoint()).to.equal(200);

			await MagneticFieldGenerator().set(1, 0);
			expect((await MagneticFieldGenerator().poolInfo(1)).allocPoint).to.equal(0);
			expect(await MagneticFieldGenerator().totalAllocPoint()).to.equal(100);

			await MagneticFieldGenerator().set(1, 25);
			expect((await MagneticFieldGenerator().poolInfo(1)).allocPoint).to.equal(25);
			expect(await MagneticFieldGenerator().totalAllocPoint()).to.equal(125);

			await MagneticFieldGenerator().set(1, 10);
			expect((await MagneticFieldGenerator().poolInfo(1)).allocPoint).to.equal(10);
			expect(await MagneticFieldGenerator().totalAllocPoint()).to.equal(110);

			await MagneticFieldGenerator().set(1, 100);
			expect((await MagneticFieldGenerator().poolInfo(1)).allocPoint).to.equal(100);
			expect(await MagneticFieldGenerator().totalAllocPoint()).to.equal(200);
		});

		it("Should return correct pool length", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock + 100;
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, Dev.address, "1000", BigNumber.from(startBlock));

			await MagneticFieldGenerator().deployed();
			expect(await MagneticFieldGenerator().poolLength()).to.equal(BigNumber.from(0));

			await MagneticFieldGenerator().add(BigNumber.from(100), lpToken.address);
			expect(await MagneticFieldGenerator().poolLength()).to.equal(BigNumber.from(1));

			await MagneticFieldGenerator().add(BigNumber.from(100), lpToken2.address);
			expect(await MagneticFieldGenerator().poolLength()).to.equal(BigNumber.from(2));
		});

		it("Should allow emergency withdraw", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock + 100;

			// 1000 per block farming rate starting at block +100
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, Dev.address, "1000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();

			await MagneticFieldGenerator().add(BigNumber.from(100), lpToken.address);

			await lpToken.connect(Bob).approve(MagneticFieldGenerator().address, "1000");
			await MagneticFieldGenerator().connect(Bob).deposit(0, "100");
			expect(await lpToken.balanceOf(Bob.address)).to.equal("900");

			await MagneticFieldGenerator().connect(Bob).emergencyWithdraw(0);
			expect(await lpToken.balanceOf(Bob.address)).to.equal("1000");
		});

		it("Should give out FMNs only after farming time", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock + 100;
			// 1000 per block farming rate starting at block +100
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, Dev.address, "1000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();

			await Fermion.transferOwnership(MagneticFieldGenerator().address);
			await MagneticFieldGenerator().add(BigNumber.from(100), lpToken.address);

			await lpToken.connect(Bob).approve(MagneticFieldGenerator().address, "1000");
			await MagneticFieldGenerator().connect(Bob).deposit(0, "100");
			await AdvanceBlockTo(baseBlock + 89);

			await MagneticFieldGenerator().connect(Bob).deposit(0, "0"); // block +90
			expect(await Fermion.balanceOf(Bob.address)).to.equal("0");
			await AdvanceBlockTo(baseBlock + 94);

			await MagneticFieldGenerator().connect(Bob).deposit(0, "0"); // block +95
			expect(await Fermion.balanceOf(Bob.address)).to.equal("0");
			await AdvanceBlockTo(baseBlock + 99);

			await MagneticFieldGenerator().connect(Bob).deposit(0, "0"); // block +100
			expect(await Fermion.balanceOf(Bob.address)).to.equal("0");
			await AdvanceBlockTo(baseBlock + 100);

			await MagneticFieldGenerator().connect(Bob).deposit(0, "0"); // block +101
			expect(await Fermion.balanceOf(Bob.address)).to.equal("1000");

			await AdvanceBlockTo(baseBlock + 104);
			await MagneticFieldGenerator().connect(Bob).deposit(0, "0"); // block +105

			expect(await Fermion.balanceOf(Bob.address)).to.equal("5000");
			expect(await Fermion.balanceOf(Dev.address)).to.equal("500");
			expect(await Fermion.totalSupply()).to.equal("5500");
		});

		it("Should not withdraw more that deposit", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock;
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, Dev.address, "1000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();
			await Fermion.transferOwnership(MagneticFieldGenerator().address);
			await MagneticFieldGenerator().add(BigNumber.from(100), lpToken.address);
			await lpToken.connect(Bob).approve(MagneticFieldGenerator().address, "1000");
			await MagneticFieldGenerator().connect(Bob).deposit(0, "100");

			const result = MagneticFieldGenerator().connect(Bob).withdraw(0, "101");

			await expect(result).to.revertedWith("MFG: amount exeeds stored amount");
		});

		it("Should not distribute FMNs if no one deposit", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock + 200;

			// 1000 per block farming rate starting at block +200
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, Dev.address, "1000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();
			await Fermion.transferOwnership(MagneticFieldGenerator().address);

			await MagneticFieldGenerator().add(100, lpToken.address);
			await lpToken.connect(Bob).approve(MagneticFieldGenerator().address, "1000");
			await AdvanceBlockTo(baseBlock + 199);
			expect(await Fermion.totalSupply()).to.equal("0");
			await AdvanceBlockTo(baseBlock + 204);
			expect(await Fermion.totalSupply()).to.equal("0");
			await AdvanceBlockTo(baseBlock + 209);
			await MagneticFieldGenerator().connect(Bob).deposit(0, "10"); // block +210
			expect(await Fermion.totalSupply()).to.equal("0");
			expect(await Fermion.balanceOf(Bob.address)).to.equal("0");
			expect(await Fermion.balanceOf(Dev.address)).to.equal("0");
			expect(await lpToken.balanceOf(Bob.address)).to.equal("990");
			await AdvanceBlockTo(baseBlock + 219);
			await MagneticFieldGenerator().connect(Bob).withdraw(0, "10"); // block +220
			expect(await Fermion.totalSupply()).to.equal("11000");
			expect(await Fermion.balanceOf(Bob.address)).to.equal("10000");
			expect(await Fermion.balanceOf(Dev.address)).to.equal("1000");
			expect(await lpToken.balanceOf(Bob.address)).to.equal("1000");
		});

		it("Should distribute FMNs properly for each staker", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock + 300;
			// 1000 per block farming rate starting at block +300
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, Dev.address, "1000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();
			await Fermion.transferOwnership(MagneticFieldGenerator().address);
			await MagneticFieldGenerator().add(100, lpToken.address);
			await lpToken.connect(Alice).approve(MagneticFieldGenerator().address, "1000");
			await lpToken.connect(Bob).approve(MagneticFieldGenerator().address, "1000");
			await lpToken.connect(Carol).approve(MagneticFieldGenerator().address, "1000");

			// Alice deposits 10 LPs at block +310
			await AdvanceBlockTo(baseBlock + 309);
			await MagneticFieldGenerator().connect(Alice).deposit(0, "10");
			// Bob deposits 20 LPs at block +314
			await AdvanceBlockTo(baseBlock + 313);
			await MagneticFieldGenerator().connect(Bob).deposit(0, "20");
			// Carol deposits 30 LPs at block +318
			await AdvanceBlockTo(baseBlock + 317);
			await MagneticFieldGenerator().connect(Carol).deposit(0, "30");
			// Alice deposits 10 more LPs at block +320. At this point:
			//   Alice should have: 4*1000 + 4*1/3*1000 + 2*1/6*1000 = 5666
			//   MasterChef should have the remaining: 10000 - 5666 = 4334
			await AdvanceBlockTo(baseBlock + 319);
			await MagneticFieldGenerator().connect(Alice).deposit(0, "10");
			expect(await Fermion.totalSupply()).to.equal("11000");
			expect(await Fermion.balanceOf(Alice.address)).to.equal("5666");
			expect(await Fermion.balanceOf(Bob.address)).to.equal("0");
			expect(await Fermion.balanceOf(Carol.address)).to.equal("0");
			expect(await Fermion.balanceOf(MagneticFieldGenerator().address)).to.equal("4334");
			expect(await Fermion.balanceOf(Dev.address)).to.equal("1000");
			// Bob withdraws 5 LPs at block +330. At this point:
			//   Bob should have: 4*2/3*1000 + 2*2/6*1000 + 10*2/7*1000 = 6190
			await AdvanceBlockTo(baseBlock + 329);
			await MagneticFieldGenerator().connect(Bob).withdraw(0, "5", { from: Bob.address });
			expect(await Fermion.totalSupply()).to.equal("22000");
			expect(await Fermion.balanceOf(Alice.address)).to.equal("5666");
			expect(await Fermion.balanceOf(Bob.address)).to.equal("6190");
			expect(await Fermion.balanceOf(Carol.address)).to.equal("0");
			expect(await Fermion.balanceOf(MagneticFieldGenerator().address)).to.equal("8144");
			expect(await Fermion.balanceOf(Dev.address)).to.equal("2000");
			// Alice withdraws 20 LPs at block +340.
			// Bob withdraws 15 LPs at block +350.
			// Carol withdraws 30 LPs at block +360.
			await AdvanceBlockTo(baseBlock + 339);
			await MagneticFieldGenerator().connect(Alice).withdraw(0, "20");
			await AdvanceBlockTo(baseBlock + 349);
			await MagneticFieldGenerator().connect(Bob).withdraw(0, "15");
			await AdvanceBlockTo(baseBlock + 359);
			await MagneticFieldGenerator().connect(Carol).withdraw(0, "30");
			expect(await Fermion.totalSupply()).to.equal("55000");
			expect(await Fermion.balanceOf(Dev.address)).to.equal("5000");
			// Alice should have: 5666 + 10*2/7*1000 + 10*2/6.5*1000 = 11600
			expect(await Fermion.balanceOf(Alice.address)).to.equal("11600");
			// Bob should have: 6190 + 10*1.5/6.5 * 1000 + 10*1.5/4.5*1000 = 11831
			expect(await Fermion.balanceOf(Bob.address)).to.equal("11831");
			// Carol should have: 2*3/6*1000 + 10*3/7*1000 + 10*3/6.5*1000 + 10*3/4.5*1000 + 10*1000 = 26568
			expect(await Fermion.balanceOf(Carol.address)).to.equal("26568");
			// All of them should have 1000 LPs back.
			expect(await lpToken.balanceOf(Alice.address)).to.equal("1000");
			expect(await lpToken.balanceOf(Bob.address)).to.equal("1000");
			expect(await lpToken.balanceOf(Carol.address)).to.equal("1000");
		});

		it("Should give proper FMNs allocation to each pool", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock + 400;
			// 1000 per block farming rate starting at block +400
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, Dev.address, "1000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();
			await Fermion.transferOwnership(MagneticFieldGenerator().address);
			await lpToken.connect(Alice).approve(MagneticFieldGenerator().address, "1000");
			await lpToken2.connect(Bob).approve(MagneticFieldGenerator().address, "1000");
			// Add first LP to the pool with allocation 1
			await MagneticFieldGenerator().add(10, lpToken.address);
			// Alice deposits 10 LPs at block +410
			await AdvanceBlockTo(baseBlock + 409);
			await MagneticFieldGenerator().connect(Alice).deposit(0, "10");
			// Add LP2 to the pool with allocation 2 at block +420
			await AdvanceBlockTo(baseBlock + 419);
			await MagneticFieldGenerator().add(20, lpToken2.address);
			// Alice should have 10*1000 pending reward
			expect(await MagneticFieldGenerator().pendingFermion(0, Alice.address)).to.equal("10000");
			// Bob deposits 10 LP2s at block +425
			await AdvanceBlockTo(baseBlock + 424);
			await MagneticFieldGenerator().connect(Bob).deposit(1, "5");
			// Alice should have 10000 + 5*1/3*1000 = 11666 pending reward
			expect(await MagneticFieldGenerator().pendingFermion(0, Alice.address)).to.equal("11666");
			await AdvanceBlockTo(baseBlock + 430);
			// At block 430. Bob should get 5*2/3*1000 = 3333. Alice should get ~1666 more.
			expect(await MagneticFieldGenerator().pendingFermion(0, Alice.address)).to.equal("13333");
			expect(await MagneticFieldGenerator().pendingFermion(1, Bob.address)).to.equal("3333");
		});

		it("Should allow owner to disable pool", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock + 400;
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, Dev.address, "1000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();
			await Fermion.transferOwnership(MagneticFieldGenerator().address);
			await lpToken.connect(Alice).approve(MagneticFieldGenerator().address, "1000");
			await MagneticFieldGenerator().add(10, lpToken.address);
			await MagneticFieldGenerator().disablePool(0);

			const result = await MagneticFieldGenerator().poolInfo(0);

			expect(result.allocPoint).to.equal(0);
			expect(result.lpToken).to.equal(lpToken.address);
		});

		it("Should not allow non-owner to disable pool", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock + 400;
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, Dev.address, "1000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();
			await Fermion.transferOwnership(MagneticFieldGenerator().address);
			await lpToken.connect(Alice).approve(MagneticFieldGenerator().address, "1000");
			await MagneticFieldGenerator().add(10, lpToken.address);

			const result = MagneticFieldGenerator().connect(Bob).disablePool(0);

			await expect(result).to.revertedWith("Ownable: caller is not the owner");
		});
	});
});
