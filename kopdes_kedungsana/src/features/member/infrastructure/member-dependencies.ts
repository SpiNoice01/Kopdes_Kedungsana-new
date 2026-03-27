import { AddMemberByKtpUseCase } from "../application/add-member-by-nik-use-case";
import { AddMemberMonthlySavingUseCase } from "../application/add-member-monthly-saving-use-case";
import { GetMemberByIdUseCase } from "../application/get-member-by-id-use-case";
import { GetMemberMonthlySavingsUseCase } from "../application/get-member-monthly-savings-use-case";
import { GetMembersUseCase } from "../application/get-members-use-case";
import { InMemoryMemberRepository } from "./in-memory-member-repository";

const memberRepository = new InMemoryMemberRepository();

export const memberDependencies = {
  getMembersUseCase: new GetMembersUseCase(memberRepository),
  getMemberByIdUseCase: new GetMemberByIdUseCase(memberRepository),
  getMemberMonthlySavingsUseCase: new GetMemberMonthlySavingsUseCase(
    memberRepository,
  ),
  addMemberByKtpUseCase: new AddMemberByKtpUseCase(memberRepository),
  addMemberMonthlySavingUseCase: new AddMemberMonthlySavingUseCase(
    memberRepository,
  ),
};
