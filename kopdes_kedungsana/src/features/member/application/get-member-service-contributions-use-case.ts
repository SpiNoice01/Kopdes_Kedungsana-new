import type { MemberServiceContribution } from "../domain/member-service-contribution";
import type { MemberRepository } from "../domain/member-repository";

export class GetMemberServiceContributionsUseCase {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(memberId: string): Promise<MemberServiceContribution[]> {
    return this.memberRepository.getServiceContributionsByMemberId(memberId);
  }
}
