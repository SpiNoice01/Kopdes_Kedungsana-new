import type { MemberInvestment } from "../domain/member-investment";
import type { MemberRepository } from "../domain/member-repository";

export class GetMemberInvestmentsUseCase {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(memberId: string): Promise<MemberInvestment[]> {
    return this.memberRepository.getInvestmentsByMemberId(memberId);
  }
}
