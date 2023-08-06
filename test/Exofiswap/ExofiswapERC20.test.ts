import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, ContractFactory, Wallet } from "ethers";
import { ecsign } from "ethereumjs-util";

import { ExpandTo18Decimals, GetApprovalDigest, GetDomainSeparator, MAX_UINT256 } from "../helpers";
import { IExofiswapERC20 } from "../../typechain-types";
import { keccak256, toUtf8Bytes, hexlify } from "ethers/lib/utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("ExofiswapERC20", () =>
{
	let Wallet: Wallet;
	let Signers: SignerWithAddress[];
	let Alice: SignerWithAddress;
	let Bob: SignerWithAddress;
	let ExofiswapERC20Factory: ContractFactory;
	let ExofiswapERC20Contract: Contract;
	const ExofiswapERC20 = () => ExofiswapERC20Contract as IExofiswapERC20;
	const TEST_TOKEN_NAME = "Exofiswap LP Token";
	const TOTAL_SUPPLY = ExpandTo18Decimals(10000);
	const TEST_AMOUNT = ExpandTo18Decimals(10);

	before(async () =>
	{
		Wallet = ethers.Wallet.createRandom();
		Signers = await ethers.getSigners();
		Alice = Signers[0];
		Bob = Signers[1];
		ExofiswapERC20Factory = await ethers.getContractFactory("ExofiswapERC20Mock");
	});

	context("this", () =>
	{
		beforeEach(async () =>
		{
			ExofiswapERC20Contract = await ExofiswapERC20Factory.deploy(TEST_TOKEN_NAME, TOTAL_SUPPLY);
			await ExofiswapERC20Contract.deployed();
		});

		it("ExofiswapERC20.constructor: Should set correct state variables", async () =>
		{
			const exoName = await ExofiswapERC20().name();
			expect(exoName).to.eq(TEST_TOKEN_NAME);
			expect(await ExofiswapERC20().symbol()).to.eq("ENERGY");
			expect(await ExofiswapERC20().decimals()).to.eq(18);
			expect(await ExofiswapERC20().totalSupply()).to.eq(TOTAL_SUPPLY);
			expect(await ExofiswapERC20().balanceOf(Alice.address)).to.eq(TOTAL_SUPPLY);
			expect(await ExofiswapERC20().DOMAIN_SEPARATOR()).to.eq(
				await GetDomainSeparator(exoName, ExofiswapERC20Contract.address)
			);
			expect(await ExofiswapERC20().PERMIT_TYPEHASH()).to.eq(
				keccak256(toUtf8Bytes("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"))
			);
		});

		it("permit", async () =>
		{
			const nonce = await ExofiswapERC20().nonces(Wallet.address);
			const deadline = MAX_UINT256;

			const exoDigest = await GetApprovalDigest(
				ExofiswapERC20Contract,
				{ owner: Wallet.address, spender: Bob.address, value: TEST_AMOUNT },
				nonce,
				deadline
			);
			const exoSign = ecsign(Buffer.from(exoDigest.slice(2), "hex"), Buffer.from(Wallet.privateKey.slice(2), "hex"));

			await expect(ExofiswapERC20().permit(Wallet.address, Bob.address, TEST_AMOUNT, deadline, exoSign.v, hexlify(exoSign.r), hexlify(exoSign.s)))
				.to.emit(ExofiswapERC20(), "Approval")
				.withArgs(Wallet.address, Bob.address, TEST_AMOUNT);
			expect(await ExofiswapERC20().allowance(Wallet.address, Bob.address)).to.eq(TEST_AMOUNT);
			expect(await ExofiswapERC20().nonces(Wallet.address)).to.eq(1);
		});
	});

	context("IERC20", () =>
	{
		beforeEach(async () =>
		{
			ExofiswapERC20Contract = await ExofiswapERC20Factory.deploy(TEST_TOKEN_NAME, TOTAL_SUPPLY);
			await ExofiswapERC20Contract.deployed();
			await ExofiswapERC20().transfer(Alice.address, TOTAL_SUPPLY);
		});

		it("approve", async () =>
		{
			await expect(ExofiswapERC20().approve(Bob.address, TEST_AMOUNT))
				.to.emit(ExofiswapERC20(), "Approval")
				.withArgs(Alice.address, Bob.address, TEST_AMOUNT);
			expect(await ExofiswapERC20().allowance(Alice.address, Bob.address)).to.eq(TEST_AMOUNT);
		});

		it("transfer", async () =>
		{
			await expect(ExofiswapERC20().transfer(Bob.address, TEST_AMOUNT))
				.to.emit(ExofiswapERC20(), "Transfer")
				.withArgs(Alice.address, Bob.address, TEST_AMOUNT);
			expect(await ExofiswapERC20().balanceOf(Alice.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT));
			expect(await ExofiswapERC20().balanceOf(Bob.address)).to.eq(TEST_AMOUNT);
		});

		it("transfer:fail", async () =>
		{
			await expect(ExofiswapERC20().transfer(Bob.address, TOTAL_SUPPLY.add(1))).to.be.reverted; // ds-math-sub-underflow
			await expect(ExofiswapERC20().connect(Bob).transfer(Alice.address, 1)).to.be.reverted; // ds-math-sub-underflow
		});

		it("transferFrom", async () =>
		{
			await ExofiswapERC20().approve(Bob.address, TEST_AMOUNT);
			await expect(ExofiswapERC20().connect(Bob).transferFrom(Alice.address, Bob.address, TEST_AMOUNT))
				.to.emit(ExofiswapERC20(), "Transfer")
				.withArgs(Alice.address, Bob.address, TEST_AMOUNT);
			expect(await ExofiswapERC20().allowance(Alice.address, Bob.address)).to.eq(0);
			expect(await ExofiswapERC20().balanceOf(Alice.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT));
			expect(await ExofiswapERC20().balanceOf(Bob.address)).to.eq(TEST_AMOUNT);
		});

		it("transferFrom:max", async () =>
		{
			await ExofiswapERC20().approve(Bob.address, MAX_UINT256);
			await expect(ExofiswapERC20().connect(Bob).transferFrom(Alice.address, Bob.address, TEST_AMOUNT))
				.to.emit(ExofiswapERC20(), "Transfer")
				.withArgs(Alice.address, Bob.address, TEST_AMOUNT);
			expect(await ExofiswapERC20().allowance(Alice.address, Bob.address)).to.eq(MAX_UINT256);
			expect(await ExofiswapERC20().balanceOf(Alice.address)).to.eq(TOTAL_SUPPLY.sub(TEST_AMOUNT));
			expect(await ExofiswapERC20().balanceOf(Bob.address)).to.eq(TEST_AMOUNT);
		});
	});
});
