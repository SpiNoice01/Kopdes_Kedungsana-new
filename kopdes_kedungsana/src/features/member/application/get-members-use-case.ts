import type { Member } from "../domain/member";
import type { MemberRepository } from "../domain/member-repository";

export class GetMembersUseCase {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(): Promise<Member[]> {
    return this.memberRepository.getAll();
  }
}
