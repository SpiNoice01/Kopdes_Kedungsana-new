import type { Member } from "../domain/member";
import type { MemberRepository } from "../domain/member-repository";

export class GetMemberByIdUseCase {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(memberId: string): Promise<Member | null> {
    return this.memberRepository.findById(memberId);
  }
}
