/* eslint-disable node/no-unpublished-import */
import { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ADDRESS_ZERO, AdvanceBlock, AdvanceBlockTo, GetBlockNumber, PANIC_CODES, StartAutomine, StopAutomine } from "./helpers";
import { IERC20, IFermion, IMagneticFieldGenerator } from "../typechain-types";

describe("MagneticFieldGenerator", () =>
{
	let MagneticFieldGeneratorFactory: ContractFactory;
	let FermionFactory: ContractFactory;
	let ERC20MockFactory: ContractFactory;
	let Signers: SignerWithAddress[];
	let Alice: SignerWithAddress;
	let Bob: SignerWithAddress;
	let Carol: SignerWithAddress;
	let Minter: SignerWithAddress;
	let Contract: Contract;
	const MagneticFieldGenerator = () => Contract as IMagneticFieldGenerator;

	before(async () =>
	{
		Signers = await ethers.getSigners();
		Alice = Signers[0];
		Bob = Signers[1];
		Carol = Signers[2];
		Minter = Signers[3];

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

			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, "100", "0");
			await Contract.deployed();

			await Fermion.transferOwnership(Contract.address);
		});

		it("MagneticFieldGenerator.constructor: Should set correct state variables", async () =>
		{
			const fermionAddress = await MagneticFieldGenerator().getFermionContract();
			const fermionPerBlock = await MagneticFieldGenerator().getFermionPerBlock();
			const startBlock = await MagneticFieldGenerator().getStartBlock();
			const owner = await Fermion.owner();
			const migrator = await MagneticFieldGenerator().migrator();

			expect(fermionAddress).to.equal(Fermion.address);
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

		it("MagneticFieldGenerator.setMigrator: Should not allow non-owner to set migrator", async () =>
		{
			const fakeUniToken = await ERC20MockFactory.deploy("UniSwap Token", "UNI", 1000) as IERC20;
			const uniMigratorFactory = await ethers.getContractFactory("UniMigratorMock");
			await fakeUniToken.deployed();
			const uniMigrator = await uniMigratorFactory.deploy(Bob.address, fakeUniToken.address);
			await uniMigrator.deployed();

			const result = MagneticFieldGenerator().connect(Bob).setMigrator(uniMigrator.address);

			await expect(result).to.revertedWith("Ownable: caller is not the owner");
		});

		it("MagneticFieldGenerator.setMigrator: Should not allow non-owner to call migrate", async () =>
		{
			const fakeUniToken = await ERC20MockFactory.deploy("UniSwap Token", "UNI", 1000) as IERC20;
			const uniMigratorFactory = await ethers.getContractFactory("UniMigratorMock");
			await fakeUniToken.deployed();
			const uniMigrator = await uniMigratorFactory.deploy(Bob.address, fakeUniToken.address);
			await uniMigrator.deployed();
			await MagneticFieldGenerator().setMigrator(uniMigrator.address);
			await MagneticFieldGenerator().add(100, fakeUniToken.address);
			await fakeUniToken.transfer(MagneticFieldGenerator().address, 1000);

			const result = MagneticFieldGenerator().connect(Bob).migrate(0);

			await expect(result).to.revertedWith("Ownable: caller is not the owner");
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
	});

	context("Contract ERC20-Ownable", async () =>
	{
		let Fermion: IFermion;

		beforeEach(async () =>
		{
			Fermion = (await FermionFactory.deploy()) as IFermion;
			await Fermion.deployed();

			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, "1000", "0");
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

			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, "100", "0");
			await Contract.deployed();

			await Fermion.transferOwnership(Contract.address);
		});

		it("Should set correct state variables", async () =>
		{
			const fermionAddress = await MagneticFieldGenerator().getFermionContract();
			const fermionPerBlock = await MagneticFieldGenerator().getFermionPerBlock();
			const startBlock = await MagneticFieldGenerator().getStartBlock();
			const owner = await Fermion.owner();

			expect(fermionAddress).to.equal(Fermion.address);
			expect(fermionPerBlock).to.equal(100);
			expect(startBlock).to.equal(0);
			expect(owner).to.equal(MagneticFieldGenerator().address);
		});
	});

	context("Contract MagneticFieldGenerator with ERC/LP token added to the field", () =>
	{
		let lpToken: IERC20;
		let lpToken2: IERC20;
		let lpToken3: IERC20;
		let Fermion: IFermion;

		afterEach(async () =>
		{
			await StartAutomine();
		});

		beforeEach(async () =>
		{
			// Needs to be done inside context too so that tests are isolated.
			Fermion = (await FermionFactory.deploy()) as IFermion;
			await Fermion.deployed();
			const preMine: BigNumber = BigNumber.from(400000000).mul(BigNumber.from(10).pow(18));
			await Fermion.burn(preMine);

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

		it("Should allow hand over to new MFG Contract", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock + 100;
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, "1000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();
			await Fermion.transferOwnership(MagneticFieldGenerator().address);
			expect(await MagneticFieldGenerator().poolLength()).to.equal(BigNumber.from(0));
			await MagneticFieldGenerator().add(100, lpToken.address);
			await MagneticFieldGenerator().add(200, lpToken2.address);
			await MagneticFieldGenerator().add(300, lpToken3.address);

			const NewContract = (await MagneticFieldGeneratorFactory.deploy(Fermion.address, "1000", BigNumber.from(startBlock))) as IMagneticFieldGenerator;
			await NewContract.deployed();
			await NewContract.transferOwnership(Contract.address);
			await MagneticFieldGenerator().handOverToSuccessor(NewContract.address);

			expect(await MagneticFieldGenerator().poolLength()).to.equal(3);
			expect((await MagneticFieldGenerator().poolInfo(0)).allocPoint).to.equal(0);
			expect((await MagneticFieldGenerator().poolInfo(1)).allocPoint).to.equal(0);
			expect((await MagneticFieldGenerator().poolInfo(2)).allocPoint).to.equal(0);
			expect(await NewContract.poolLength()).to.equal(3);
			expect((await NewContract.poolInfo(0)).allocPoint).to.equal(100);
			expect((await NewContract.poolInfo(1)).allocPoint).to.equal(200);
			expect((await NewContract.poolInfo(2)).allocPoint).to.equal(300);
			expect(await NewContract.owner()).to.equal(Alice.address);
			expect(await NewContract.successor()).to.equal(ADDRESS_ZERO);
			expect(await Contract.successor()).to.equal(NewContract.address);
		});

		it("Should allow hand over to new MFG Contract active pools only", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock + 100;
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, "1000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();
			await Fermion.transferOwnership(MagneticFieldGenerator().address);
			expect(await MagneticFieldGenerator().poolLength()).to.equal(BigNumber.from(0));
			await MagneticFieldGenerator().add(100, lpToken.address);
			await MagneticFieldGenerator().add(200, lpToken2.address);
			await MagneticFieldGenerator().add(300, lpToken3.address);
			await MagneticFieldGenerator().disablePool(1); // lpToken2 pool

			const NewContract = (await MagneticFieldGeneratorFactory.deploy(Fermion.address, "1000", BigNumber.from(startBlock))) as IMagneticFieldGenerator;
			await NewContract.deployed();
			await NewContract.transferOwnership(Contract.address);
			await MagneticFieldGenerator().handOverToSuccessor(NewContract.address);

			expect(await MagneticFieldGenerator().poolLength()).to.equal(3);
			expect((await MagneticFieldGenerator().poolInfo(0)).allocPoint).to.equal(0);
			expect((await MagneticFieldGenerator().poolInfo(1)).allocPoint).to.equal(0);
			expect((await MagneticFieldGenerator().poolInfo(2)).allocPoint).to.equal(0);
			expect(await NewContract.poolLength()).to.equal(2);
			expect((await NewContract.poolInfo(0)).allocPoint).to.equal(100);
			expect((await NewContract.poolInfo(1)).allocPoint).to.equal(300);
			expect(await NewContract.owner()).to.equal(Alice.address);
			expect(await NewContract.successor()).to.equal(ADDRESS_ZERO);
			expect(await Contract.successor()).to.equal(NewContract.address);
		});

		it("Should not allow hand over to new MFG Contract twice", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock + 100;
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, "1000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();
			await Fermion.transferOwnership(MagneticFieldGenerator().address);
			expect(await MagneticFieldGenerator().poolLength()).to.equal(BigNumber.from(0));
			await MagneticFieldGenerator().add(100, lpToken.address);
			await MagneticFieldGenerator().add(200, lpToken2.address);
			await MagneticFieldGenerator().add(300, lpToken3.address);

			const NewContract = (await MagneticFieldGeneratorFactory.deploy(Fermion.address, "1000", BigNumber.from(startBlock))) as IMagneticFieldGenerator;
			await NewContract.deployed();
			await NewContract.transferOwnership(Contract.address);
			await MagneticFieldGenerator().handOverToSuccessor(NewContract.address);

			const NewContract2 = (await MagneticFieldGeneratorFactory.deploy(Fermion.address, "1000", BigNumber.from(startBlock))) as IMagneticFieldGenerator;
			await NewContract2.deployed();
			await NewContract2.transferOwnership(Contract.address);
			const result = MagneticFieldGenerator().handOverToSuccessor(NewContract2.address);

			await expect(result).to.revertedWith("MFG: Successor already set");
		});

		it("Should not allow hand over to new MFG Contract when not owned", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock + 100;
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, "1000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();
			await Fermion.transferOwnership(MagneticFieldGenerator().address);
			expect(await MagneticFieldGenerator().poolLength()).to.equal(BigNumber.from(0));
			await MagneticFieldGenerator().add(100, lpToken.address);
			await MagneticFieldGenerator().add(200, lpToken2.address);
			await MagneticFieldGenerator().add(300, lpToken3.address);

			const NewContract = (await MagneticFieldGeneratorFactory.deploy(Fermion.address, "1000", BigNumber.from(startBlock))) as IMagneticFieldGenerator;
			await NewContract.deployed();
			const result = MagneticFieldGenerator().handOverToSuccessor(NewContract.address);

			await expect(result).to.revertedWith("MFG: Successor not owned by this");
		});

		it("Should revert `add` on total alloc overflow", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock + 100;
			const limit: BigNumber = BigNumber.from(2).pow(256).sub(2);

			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, "1000", BigNumber.from(startBlock));
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

			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, "1000", BigNumber.from(startBlock));
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

			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, "1000", BigNumber.from(startBlock));
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
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, "1000", BigNumber.from(startBlock));

			await MagneticFieldGenerator().deployed();
			expect(await MagneticFieldGenerator().poolLength()).to.equal(BigNumber.from(0));

			await MagneticFieldGenerator().add(BigNumber.from(100), lpToken.address);
			expect(await MagneticFieldGenerator().poolLength()).to.equal(BigNumber.from(1));

			await MagneticFieldGenerator().add(BigNumber.from(100), lpToken2.address);
			expect(await MagneticFieldGenerator().poolLength()).to.equal(BigNumber.from(2));
		});

		it("Should return correct user info", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock + 100;
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, "1000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();
			await MagneticFieldGenerator().add(BigNumber.from(100), lpToken.address);

			const userInfo1 = await MagneticFieldGenerator().userInfo(0, Alice.address);
			await lpToken.connect(Alice).approve(MagneticFieldGenerator().address, 1000);
			await MagneticFieldGenerator().connect(Alice).deposit(0, 100, Alice.address);
			const userInfo2 = await MagneticFieldGenerator().userInfo(0, Alice.address);

			expect(userInfo1.amount).to.equal(0);
			expect(userInfo1.rewardDebt).to.equal(0);

			expect(userInfo2.amount).to.equal(100);
			expect(userInfo2.rewardDebt).to.equal(0);
		});

		it("Should allow emergency withdraw", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock + 100;

			// 1000 per block farming rate starting at block +100
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, "1000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();

			await MagneticFieldGenerator().add(BigNumber.from(100), lpToken.address);

			await lpToken.connect(Bob).approve(MagneticFieldGenerator().address, "1000");
			await MagneticFieldGenerator().connect(Bob).deposit(0, "100", Bob.address);
			expect(await lpToken.balanceOf(Bob.address)).to.equal("900");

			await MagneticFieldGenerator().connect(Bob).emergencyWithdraw(0);
			expect(await lpToken.balanceOf(Bob.address)).to.equal("1000");
		});

		it("Should give out FMNs only after farming time", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock + 100;
			// 1000 per block farming rate starting at block +100
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, "1000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();

			await Fermion.transferOwnership(MagneticFieldGenerator().address);
			await MagneticFieldGenerator().add(BigNumber.from(100), lpToken.address);

			await lpToken.connect(Bob).approve(MagneticFieldGenerator().address, "1000");
			await MagneticFieldGenerator().connect(Bob).deposit(0, "100", Bob.address);
			await AdvanceBlockTo(baseBlock + 89);

			await MagneticFieldGenerator().connect(Bob).harvest(0, Bob.address); // block +90
			expect(await Fermion.balanceOf(Bob.address)).to.equal("0");
			await AdvanceBlockTo(baseBlock + 94);

			await MagneticFieldGenerator().connect(Bob).harvest(0, Bob.address); // block +95
			expect(await Fermion.balanceOf(Bob.address)).to.equal("0");
			await AdvanceBlockTo(baseBlock + 99);

			await MagneticFieldGenerator().connect(Bob).harvest(0, Bob.address); // block +100
			expect(await Fermion.balanceOf(Bob.address)).to.equal("0");
			await AdvanceBlockTo(baseBlock + 100);

			await MagneticFieldGenerator().connect(Bob).harvest(0, Bob.address); // block +101
			expect(await Fermion.balanceOf(Bob.address)).to.equal("1000");

			await AdvanceBlockTo(baseBlock + 104);
			await MagneticFieldGenerator().connect(Bob).harvest(0, Bob.address); // block +105

			expect(await Fermion.balanceOf(Bob.address)).to.equal("5000");
			expect(await Fermion.totalSupply()).to.equal("5000");
		});

		it("Should not withdraw more that deposit", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock;
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, "1000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();
			await Fermion.transferOwnership(MagneticFieldGenerator().address);
			await MagneticFieldGenerator().add(BigNumber.from(100), lpToken.address);
			await lpToken.connect(Bob).approve(MagneticFieldGenerator().address, "1000");
			await MagneticFieldGenerator().connect(Bob).deposit(0, "100", Bob.address);

			const result = MagneticFieldGenerator().connect(Bob).withdraw(0, "101", Bob.address);

			await expect(result).to.revertedWith("MFG: amount exeeds stored amount");
		});

		it("Should not withdraw and harvest more that deposit", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock;
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, "1000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();
			await Fermion.transferOwnership(MagneticFieldGenerator().address);
			await MagneticFieldGenerator().add(BigNumber.from(100), lpToken.address);
			await lpToken.connect(Bob).approve(MagneticFieldGenerator().address, "1000");
			await MagneticFieldGenerator().connect(Bob).deposit(0, "100", Bob.address);

			const result = MagneticFieldGenerator().connect(Bob).withdrawAndHarvest(0, "101", Bob.address);

			await expect(result).to.revertedWith("MFG: amount exeeds stored amount");
		});

		it("Should not distribute FMNs if no one deposit", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock + 200;

			// 1000 per block farming rate starting at block +200
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, "1000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();
			await Fermion.transferOwnership(MagneticFieldGenerator().address);

			await MagneticFieldGenerator().add(100, lpToken.address);
			await lpToken.connect(Bob).approve(MagneticFieldGenerator().address, "1000");
			await AdvanceBlockTo(baseBlock + 199);
			expect(await Fermion.totalSupply()).to.equal("0");
			await AdvanceBlockTo(baseBlock + 204);
			expect(await Fermion.totalSupply()).to.equal("0");
			await AdvanceBlockTo(baseBlock + 209);
			await MagneticFieldGenerator().connect(Bob).deposit(0, "10", Bob.address); // block +210
			expect(await Fermion.totalSupply()).to.equal("0");
			expect(await Fermion.balanceOf(Bob.address)).to.equal("0");
			expect(await lpToken.balanceOf(Bob.address)).to.equal("990");
			await AdvanceBlockTo(baseBlock + 219);
			await MagneticFieldGenerator().connect(Bob).withdrawAndHarvest(0, "10", Bob.address); // block +220
			expect(await Fermion.totalSupply()).to.equal("10000");
			expect(await Fermion.balanceOf(Bob.address)).to.equal("10000");
			expect(await lpToken.balanceOf(Bob.address)).to.equal("1000");
		});

		it("Should distribute FMNs properly for each staker", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock + 300;
			// 1000 per block farming rate starting at block +300
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, "1000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();
			await Fermion.transferOwnership(MagneticFieldGenerator().address);
			await MagneticFieldGenerator().add(100, lpToken.address);
			await lpToken.connect(Alice).approve(MagneticFieldGenerator().address, "1000");
			await lpToken.connect(Bob).approve(MagneticFieldGenerator().address, "1000");
			await lpToken.connect(Carol).approve(MagneticFieldGenerator().address, "1000");

			// Alice deposits 10 LPs at block +310
			await AdvanceBlockTo(baseBlock + 309);
			await MagneticFieldGenerator().connect(Alice).deposit(0, "10", Alice.address);
			// Bob deposits 20 LPs at block +314
			await AdvanceBlockTo(baseBlock + 313);
			await MagneticFieldGenerator().connect(Bob).deposit(0, "20", Bob.address);
			expect(await MagneticFieldGenerator().pendingFermion(0, Alice.address)).to.equal("4000");
			expect(await MagneticFieldGenerator().pendingFermion(0, Bob.address)).to.equal("0");
			expect(await MagneticFieldGenerator().pendingFermion(0, Carol.address)).to.equal("0");
			// Carol deposits 30 LPs at block +318
			await AdvanceBlockTo(baseBlock + 317);
			await MagneticFieldGenerator().connect(Carol).deposit(0, "30", Carol.address);
			expect(await MagneticFieldGenerator().pendingFermion(0, Alice.address)).to.equal("5333");
			expect(await MagneticFieldGenerator().pendingFermion(0, Bob.address)).to.equal("2666");
			expect(await MagneticFieldGenerator().pendingFermion(0, Carol.address)).to.equal("0");
			// Alice deposits 10 more LPs at block +320. At this point:
			await AdvanceBlockTo(baseBlock + 319);
			await MagneticFieldGenerator().connect(Alice).deposit(0, "10", Alice.address);
			expect(await MagneticFieldGenerator().pendingFermion(0, Alice.address)).to.equal("5667");
			expect(await MagneticFieldGenerator().pendingFermion(0, Bob.address)).to.equal("3333");
			expect(await MagneticFieldGenerator().pendingFermion(0, Carol.address)).to.equal("1000");
			expect(await Fermion.totalSupply()).to.equal("10000");
			expect(await Fermion.balanceOf(MagneticFieldGenerator().address)).to.equal("10000");
			// Bob withdraws and harvests 5 LPs at block +330. At this point:
			//   Bob should have: 4*2/3*1000 + 2*2/6*1000 + 10*2/7*1000 = 6190
			await AdvanceBlockTo(baseBlock + 329);
			await MagneticFieldGenerator().connect(Bob).withdrawAndHarvest(0, "5", Bob.address);
			expect(await MagneticFieldGenerator().pendingFermion(0, Alice.address)).to.equal(8524);
			expect(await MagneticFieldGenerator().pendingFermion(0, Bob.address)).to.equal(0);
			expect(await MagneticFieldGenerator().pendingFermion(0, Carol.address)).to.equal(5286);
			expect(await Fermion.totalSupply()).to.equal(20000);
			expect(await Fermion.balanceOf(Alice.address)).to.equal(0);
			expect(await Fermion.balanceOf(Bob.address)).to.equal(6190);
			expect(await Fermion.balanceOf(Carol.address)).to.equal(0);
			expect(await Fermion.balanceOf(MagneticFieldGenerator().address)).to.equal(13810);
			// Alice withdraws 20 LPs at block +340.
			// Bob withdraws 15 LPs at block +350.
			// Carol withdraws 30 LPs at block +360.
			await AdvanceBlockTo(baseBlock + 339);
			await MagneticFieldGenerator().connect(Alice).withdrawAndHarvest(0, "20", Alice.address);
			await AdvanceBlockTo(baseBlock + 349);
			await MagneticFieldGenerator().connect(Bob).withdrawAndHarvest(0, "15", Bob.address);
			await AdvanceBlockTo(baseBlock + 359);
			await MagneticFieldGenerator().connect(Carol).withdrawAndHarvest(0, "30", Carol.address);
			expect(await Fermion.totalSupply()).to.equal("50000");
			// Alice should have: 5667 + 10*2/7*1000 + 10*2/6.5*1000 = 11601
			expect(await Fermion.balanceOf(Alice.address)).to.equal("11601");
			// Bob should have: 6190 + 10*1.5/6.5 * 1000 + 10*1.5/4.5*1000 = 11831
			expect(await Fermion.balanceOf(Bob.address)).to.equal("11831");
			// Carol should have: 2*3/6*1000 + 10*3/7*1000 + 10*3/6.5*1000 + 10*3/4.5*1000 + 10*1000 = 26568
			expect(await Fermion.balanceOf(Carol.address)).to.equal("26568");
			expect(await Fermion.balanceOf(MagneticFieldGenerator().address)).to.equal("0");
			// All of them should have 1000 LPs back.
			expect(await lpToken.balanceOf(Alice.address)).to.equal("1000");
			expect(await lpToken.balanceOf(Bob.address)).to.equal("1000");
			expect(await lpToken.balanceOf(Carol.address)).to.equal("1000");
			// No more pending Fermions
			expect(await MagneticFieldGenerator().pendingFermion(0, Alice.address)).to.equal(0);
			expect(await MagneticFieldGenerator().pendingFermion(0, Bob.address)).to.equal(0);
			expect(await MagneticFieldGenerator().pendingFermion(0, Carol.address)).to.equal(0);
		});

		it("Should give proper FMNs allocation to each pool", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock + 400;
			// 1000 per block farming rate starting at block +400
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, "1000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();
			await Fermion.transferOwnership(MagneticFieldGenerator().address);
			await lpToken.connect(Alice).approve(MagneticFieldGenerator().address, "1000");
			await lpToken2.connect(Bob).approve(MagneticFieldGenerator().address, "1000");
			// Add first LP to the pool with allocation 1
			await MagneticFieldGenerator().add(10, lpToken.address);
			// Alice deposits 10 LPs at block +410
			await AdvanceBlockTo(baseBlock + 409);
			await MagneticFieldGenerator().connect(Alice).deposit(0, "10", Alice.address);
			// Add LP2 to the pool with allocation 2 at block +420
			await AdvanceBlockTo(baseBlock + 419);
			await MagneticFieldGenerator().add(20, lpToken2.address);
			// Alice should have 10*1000 pending reward
			expect(await MagneticFieldGenerator().pendingFermion(0, Alice.address)).to.equal("10000");
			// Bob deposits 10 LP2s at block +425
			await AdvanceBlockTo(baseBlock + 424);
			await MagneticFieldGenerator().connect(Bob).deposit(1, "5", Bob.address);
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
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, "1000", BigNumber.from(startBlock));
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
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, "1000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();
			await Fermion.transferOwnership(MagneticFieldGenerator().address);
			await lpToken.connect(Alice).approve(MagneticFieldGenerator().address, "1000");
			await MagneticFieldGenerator().add(10, lpToken.address);

			const result = MagneticFieldGenerator().connect(Bob).disablePool(0);

			await expect(result).to.revertedWith("Ownable: caller is not the owner");
		});

		// TODO: Test if withdrawAndHarvest is equal withdraw + harvest.
		it("Should have same result with withdrawAndHarvest and withdraw + harvest", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock + 300;
			// 2000 per block farming rate starting at block +300
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, "2000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();
			await Fermion.transferOwnership(MagneticFieldGenerator().address);
			await MagneticFieldGenerator().add(100, lpToken.address);
			await MagneticFieldGenerator().add(100, lpToken2.address);
			await lpToken.connect(Alice).approve(MagneticFieldGenerator().address, "1000");
			await lpToken.connect(Bob).approve(MagneticFieldGenerator().address, "1000");
			await lpToken.connect(Carol).approve(MagneticFieldGenerator().address, "1000");
			await lpToken2.connect(Alice).approve(MagneticFieldGenerator().address, "1000");
			await lpToken2.connect(Bob).approve(MagneticFieldGenerator().address, "1000");
			await lpToken2.connect(Carol).approve(MagneticFieldGenerator().address, "1000");
			await StopAutomine();

			// Alice deposits 10 LPs at block +310
			await AdvanceBlockTo(baseBlock + 309);
			await MagneticFieldGenerator().connect(Alice).deposit(0, "10", Alice.address);
			await MagneticFieldGenerator().connect(Alice).deposit(1, "10", Alice.address);
			// Bob deposits 20 LPs at block +314
			await AdvanceBlockTo(baseBlock + 313);
			await MagneticFieldGenerator().connect(Bob).deposit(0, "20", Bob.address);
			await MagneticFieldGenerator().connect(Bob).deposit(1, "20", Bob.address);
			await MagneticFieldGenerator().connect(Alice).harvest(1, Alice.address);
			await AdvanceBlock();
			expect(await MagneticFieldGenerator().pendingFermion(0, Alice.address)).to.equal("4000");
			expect(await MagneticFieldGenerator().pendingFermion(0, Bob.address)).to.equal("0");
			expect(await MagneticFieldGenerator().pendingFermion(0, Carol.address)).to.equal("0");
			expect(await Fermion.balanceOf(Alice.address)).to.equal("4000");
			expect(await MagneticFieldGenerator().pendingFermion(1, Alice.address)).to.equal("0");
			expect(await MagneticFieldGenerator().pendingFermion(1, Bob.address)).to.equal("0");
			expect(await MagneticFieldGenerator().pendingFermion(1, Carol.address)).to.equal("0");
			// Carol deposits 30 LPs at block +318
			await AdvanceBlockTo(baseBlock + 317);
			await MagneticFieldGenerator().connect(Carol).deposit(0, "30", Carol.address);
			await MagneticFieldGenerator().connect(Carol).deposit(1, "30", Carol.address);
			await MagneticFieldGenerator().connect(Alice).harvest(1, Alice.address);
			await MagneticFieldGenerator().connect(Bob).harvest(1, Bob.address);
			await AdvanceBlock();
			expect(await MagneticFieldGenerator().pendingFermion(0, Alice.address)).to.equal("5333");
			expect(await MagneticFieldGenerator().pendingFermion(0, Bob.address)).to.equal("2666");
			expect(await MagneticFieldGenerator().pendingFermion(0, Carol.address)).to.equal("0");
			expect(await Fermion.balanceOf(Alice.address)).to.equal("5333");
			expect(await Fermion.balanceOf(Bob.address)).to.equal("2666");
			expect(await MagneticFieldGenerator().pendingFermion(1, Alice.address)).to.equal("0");
			expect(await MagneticFieldGenerator().pendingFermion(1, Bob.address)).to.equal("0");
			expect(await MagneticFieldGenerator().pendingFermion(1, Carol.address)).to.equal("0");
			// Alice deposits 10 more LPs at block +320. At this point:
			await AdvanceBlockTo(baseBlock + 319);
			await MagneticFieldGenerator().connect(Alice).deposit(0, "10", Alice.address);
			await MagneticFieldGenerator().connect(Alice).deposit(1, "10", Alice.address);
			await MagneticFieldGenerator().connect(Alice).harvest(1, Alice.address);
			await MagneticFieldGenerator().connect(Bob).harvest(1, Bob.address);
			await MagneticFieldGenerator().connect(Carol).harvest(1, Carol.address);
			await AdvanceBlock();
			expect(await MagneticFieldGenerator().pendingFermion(0, Alice.address)).to.equal("5667");
			expect(await MagneticFieldGenerator().pendingFermion(0, Bob.address)).to.equal("3333");
			expect(await MagneticFieldGenerator().pendingFermion(0, Carol.address)).to.equal("1000");
			expect(await Fermion.balanceOf(Alice.address)).to.equal("5667");
			expect(await Fermion.balanceOf(Bob.address)).to.equal("3333");
			expect(await Fermion.balanceOf(Carol.address)).to.equal("1000");
			expect(await MagneticFieldGenerator().pendingFermion(1, Alice.address)).to.equal("0");
			expect(await MagneticFieldGenerator().pendingFermion(1, Bob.address)).to.equal("0");
			expect(await MagneticFieldGenerator().pendingFermion(1, Carol.address)).to.equal("0");
			expect(await Fermion.totalSupply()).to.equal("20000");
			expect(await Fermion.balanceOf(MagneticFieldGenerator().address)).to.equal("10000");
			// Bob withdraws and harvests 5 LPs at block +330. At this point:
			//   Bob should have: 4*2/3*1000 + 2*2/6*1000 + 10*2/7*1000 = 6190
			await AdvanceBlockTo(baseBlock + 329);
			await MagneticFieldGenerator().connect(Bob).withdrawAndHarvest(0, "5", Bob.address);
			await MagneticFieldGenerator().connect(Bob).withdraw(1, "5", Bob.address);
			await MagneticFieldGenerator().connect(Alice).harvest(1, Alice.address);
			await MagneticFieldGenerator().connect(Bob).harvest(1, Bob.address);
			await MagneticFieldGenerator().connect(Carol).harvest(1, Carol.address);
			await AdvanceBlock();
			expect(await MagneticFieldGenerator().pendingFermion(0, Alice.address)).to.equal(8524);
			expect(await MagneticFieldGenerator().pendingFermion(0, Bob.address)).to.equal(0);
			expect(await MagneticFieldGenerator().pendingFermion(0, Carol.address)).to.equal(5286);
			expect(await MagneticFieldGenerator().pendingFermion(1, Alice.address)).to.equal(0);
			expect(await MagneticFieldGenerator().pendingFermion(1, Bob.address)).to.equal(0);
			expect(await MagneticFieldGenerator().pendingFermion(1, Carol.address)).to.equal(0);
			expect(await Fermion.totalSupply()).to.equal(40000);
			expect(await Fermion.balanceOf(Alice.address)).to.equal(8524);
			expect(await Fermion.balanceOf(Bob.address)).to.equal(12379);
			expect(await Fermion.balanceOf(Carol.address)).to.equal(5286);
			expect(await Fermion.balanceOf(MagneticFieldGenerator().address)).to.equal(13811);
			// Alice withdraws 20 LPs at block +340.
			// Bob withdraws 15 LPs at block +350.
			// Carol withdraws 30 LPs at block +360.
			await AdvanceBlockTo(baseBlock + 339);
			await MagneticFieldGenerator().connect(Alice).withdrawAndHarvest(0, "20", Alice.address);
			await MagneticFieldGenerator().connect(Alice).withdraw(1, "20", Alice.address);
			await MagneticFieldGenerator().connect(Alice).harvest(1, Alice.address);
			await MagneticFieldGenerator().connect(Bob).harvest(1, Bob.address);
			await MagneticFieldGenerator().connect(Carol).harvest(1, Carol.address);
			await AdvanceBlockTo(baseBlock + 349);
			await MagneticFieldGenerator().connect(Bob).withdrawAndHarvest(0, "15", Bob.address);
			await MagneticFieldGenerator().connect(Bob).withdraw(1, "15", Bob.address);
			await MagneticFieldGenerator().connect(Alice).harvest(1, Alice.address);
			await MagneticFieldGenerator().connect(Bob).harvest(1, Bob.address);
			await MagneticFieldGenerator().connect(Carol).harvest(1, Carol.address);
			await AdvanceBlockTo(baseBlock + 359);
			await MagneticFieldGenerator().connect(Carol).withdrawAndHarvest(0, "30", Carol.address);
			await MagneticFieldGenerator().connect(Carol).withdraw(1, "30", Carol.address);
			await MagneticFieldGenerator().connect(Alice).harvest(1, Alice.address);
			await MagneticFieldGenerator().connect(Bob).harvest(1, Bob.address);
			await MagneticFieldGenerator().connect(Carol).harvest(1, Carol.address);
			await AdvanceBlock();
			await StartAutomine();
			expect(await Fermion.totalSupply()).to.equal("100000");
			// Alice should have: 5667 + 10*2/7*1000 + 10*2/6.5*1000 = 11601
			expect(await Fermion.balanceOf(Alice.address)).to.equal("23202");
			// Bob should have: 6190 + 10*1.5/6.5 * 1000 + 10*1.5/4.5*1000 = 11831
			expect(await Fermion.balanceOf(Bob.address)).to.equal("23661");
			// Carol should have: 2*3/6*1000 + 10*3/7*1000 + 10*3/6.5*1000 + 10*3/4.5*1000 + 10*1000 = 26568
			expect(await Fermion.balanceOf(Carol.address)).to.equal("53136");
			// 1 Token remains because auf cut of decimals in the calculation.
			expect(await Fermion.balanceOf(MagneticFieldGenerator().address)).to.equal("1");
			// All of them should have 1000 LPs back.
			expect(await lpToken.balanceOf(Alice.address)).to.equal("1000");
			expect(await lpToken.balanceOf(Bob.address)).to.equal("1000");
			expect(await lpToken.balanceOf(Carol.address)).to.equal("1000");
			expect(await lpToken2.balanceOf(Alice.address)).to.equal("1000");
			expect(await lpToken2.balanceOf(Bob.address)).to.equal("1000");
			expect(await lpToken2.balanceOf(Carol.address)).to.equal("1000");
			// No more pending Fermions
			expect(await MagneticFieldGenerator().pendingFermion(0, Alice.address)).to.equal(0);
			expect(await MagneticFieldGenerator().pendingFermion(0, Bob.address)).to.equal(0);
			expect(await MagneticFieldGenerator().pendingFermion(0, Carol.address)).to.equal(0);
			expect(await MagneticFieldGenerator().pendingFermion(1, Alice.address)).to.equal(0);
			expect(await MagneticFieldGenerator().pendingFermion(1, Bob.address)).to.equal(0);
			expect(await MagneticFieldGenerator().pendingFermion(1, Carol.address)).to.equal(0);
		});

		it("Should have same result with withdrawAndHarvest and withdraw before harvest", async () =>
		{
			const baseBlock = await GetBlockNumber();
			const startBlock = baseBlock + 300;
			// 2000 per block farming rate starting at block +300
			Contract = await MagneticFieldGeneratorFactory.deploy(Fermion.address, "2000", BigNumber.from(startBlock));
			await MagneticFieldGenerator().deployed();
			await Fermion.transferOwnership(MagneticFieldGenerator().address);
			await MagneticFieldGenerator().add(100, lpToken.address);
			await MagneticFieldGenerator().add(100, lpToken2.address);
			await lpToken.connect(Alice).approve(MagneticFieldGenerator().address, "1000");
			await lpToken.connect(Bob).approve(MagneticFieldGenerator().address, "1000");
			await lpToken.connect(Carol).approve(MagneticFieldGenerator().address, "1000");
			await lpToken2.connect(Alice).approve(MagneticFieldGenerator().address, "1000");
			await lpToken2.connect(Bob).approve(MagneticFieldGenerator().address, "1000");
			await lpToken2.connect(Carol).approve(MagneticFieldGenerator().address, "1000");
			await StopAutomine();

			// Alice deposits 10 LPs at block +310
			await AdvanceBlockTo(baseBlock + 309);
			await MagneticFieldGenerator().connect(Alice).deposit(0, 10, Alice.address);
			await MagneticFieldGenerator().connect(Alice).deposit(1, 10, Alice.address);
			await AdvanceBlockTo(baseBlock + 314);
			expect(await MagneticFieldGenerator().pendingFermion(0, Alice.address)).to.equal(4000);
			expect(await MagneticFieldGenerator().pendingFermion(1, Alice.address)).to.equal(4000);
			expect(await Fermion.balanceOf(Alice.address)).to.equal(0);

			await AdvanceBlockTo(baseBlock + 317);
			await MagneticFieldGenerator().connect(Alice).withdrawAndHarvest(0, 10, Alice.address);
			await MagneticFieldGenerator().connect(Alice).withdraw(1, 10, Alice.address);
			await AdvanceBlock();
			expect(await MagneticFieldGenerator().pendingFermion(0, Alice.address)).to.equal(0);
			expect(await MagneticFieldGenerator().pendingFermion(1, Alice.address)).to.equal(8000);
			expect(await Fermion.balanceOf(Alice.address)).to.equal(8000);

			await AdvanceBlockTo(baseBlock + 319);
			await MagneticFieldGenerator().connect(Alice).deposit(0, 10, Alice.address);
			await MagneticFieldGenerator().connect(Alice).deposit(1, 10, Alice.address);

			await AdvanceBlockTo(baseBlock + 324);
			expect(await MagneticFieldGenerator().pendingFermion(0, Alice.address)).to.equal(4000);
			expect(await MagneticFieldGenerator().pendingFermion(1, Alice.address)).to.equal(12000);
			expect(await Fermion.balanceOf(Alice.address)).to.equal(8000);
			await StartAutomine();
		});
	});
});
