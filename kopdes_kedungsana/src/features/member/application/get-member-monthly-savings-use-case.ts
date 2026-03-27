import type { MemberMonthlySaving } from "../domain/member-monthly-saving";
import type { MemberRepository } from "../domain/member-repository";

export class GetMemberMonthlySavingsUseCase {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(memberId: string): Promise<MemberMonthlySaving[]> {
    return this.memberRepository.getMonthlySavingsByMemberId(memberId);
  }
}
