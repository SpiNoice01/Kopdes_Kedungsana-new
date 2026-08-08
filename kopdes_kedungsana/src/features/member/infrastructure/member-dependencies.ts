import { AddMemberByKtpUseCase } from "../application/add-member-by-nik-use-case";
import { AddMemberMonthlySavingUseCase } from "../application/add-member-monthly-saving-use-case";
import { AddMemberServiceContributionUseCase } from "../application/add-member-service-contribution-use-case";
import { GetMemberByIdUseCase } from "../application/get-member-by-id-use-case";
import { GetMemberMonthlySavingsUseCase } from "../application/get-member-monthly-savings-use-case";
import { GetMemberServiceContributionsUseCase } from "../application/get-member-service-contributions-use-case";
import { GetMembersUseCase } from "../application/get-members-use-case";
import { UpdateMemberPhotoUseCase } from "../application/update-member-photo-use-case";
import { UpdateMemberStatusUseCase } from "../application/update-member-status-use-case";
import { UpdateMemberProfileUseCase } from "../application/update-member-profile-use-case";
import { GetCooperativeStatsUseCase } from "../application/get-cooperative-stats-use-case";
import { SupabaseMemberRepository } from "./supabase-member-repository";

const memberRepository = new SupabaseMemberRepository();
const getMembersUseCase = new GetMembersUseCase(memberRepository);
const getMemberMonthlySavingsUseCase = new GetMemberMonthlySavingsUseCase(memberRepository);

export const memberDependencies = {
  getMembersUseCase,
  getMemberByIdUseCase: new GetMemberByIdUseCase(memberRepository),
  getMemberMonthlySavingsUseCase,
  addMemberByKtpUseCase: new AddMemberByKtpUseCase(memberRepository),
  addMemberMonthlySavingUseCase: new AddMemberMonthlySavingUseCase(
    memberRepository,
  ),
  getMemberServiceContributionsUseCase: new GetMemberServiceContributionsUseCase(
    memberRepository,
  ),
  addMemberServiceContributionUseCase: new AddMemberServiceContributionUseCase(
    memberRepository,
  ),
  updateMemberPhotoUseCase: new UpdateMemberPhotoUseCase(memberRepository),
  updateMemberStatusUseCase: new UpdateMemberStatusUseCase(memberRepository),
  updateMemberProfileUseCase: new UpdateMemberProfileUseCase(memberRepository),
  getCooperativeStatsUseCase: new GetCooperativeStatsUseCase(
    getMembersUseCase,
    getMemberMonthlySavingsUseCase
  )
};

